import type { PricePoint } from '../types/holding';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

// Exchange code to Yahoo Finance suffix mapping.
// Primary keys are MIC codes from the Uitvoeringsplaats column (col 5).
// DeGiro short codes (Beurs, col 4) are kept as fallback.
const YAHOO_BASE = 'https://query2.finance.yahoo.com';
const STOOQ_BASE = 'https://stooq.com';

// Optional Cloudflare Worker proxy (see cloudflare-proxy/). When set it becomes
// the primary, reliable source; the public CORS proxies remain as fallback.
// Trailing slashes are trimmed so `${PROXY_BASE}/yahoo${path}` is well-formed.
const PROXY_BASE = ((import.meta.env.VITE_PROXY_BASE as string | undefined) ?? '').replace(/\/+$/, '');

const PROXY_TIMEOUT = 6000; // per-attempt timeout (ms)

// A single proxy attempt: given an abort signal, produce a Response.
type Attempt = (signal: AbortSignal) => Promise<Response>;

// Race a group of attempts: resolve with the first OK response, abort the
// losers (never the winner, so its body stays readable), and resolve null only
// once every attempt has failed. Each attempt has its own timeout.
function raceAttempts(attempts: Attempt[]): Promise<Response | null> {
  return new Promise((resolve) => {
    if (attempts.length === 0) {
      resolve(null);
      return;
    }
    const controllers = attempts.map(() => new AbortController());
    const timers = controllers.map((c) => setTimeout(() => c.abort(), PROXY_TIMEOUT));
    let settled = false;
    let pending = attempts.length;

    attempts.forEach((attempt, i) => {
      attempt(controllers[i].signal)
        .then((resp) => {
          if (!resp.ok) throw new Error(`status ${resp.status}`);
          if (settled) return;
          settled = true;
          timers.forEach(clearTimeout);
          controllers.forEach((c, j) => {
            if (j !== i) c.abort();
          });
          resolve(resp);
        })
        .catch(() => {
          pending -= 1;
          if (!settled && pending === 0) {
            timers.forEach(clearTimeout);
            resolve(null);
          }
        });
    });
  });
}

// Run attempt groups in order, racing within each group; return the first
// group that yields an OK response. Keeps outbound fan-out bounded (2 at a
// time) so we don't trip the public proxies' rate limits.
async function fetchViaGroups(groups: Attempt[][]): Promise<Response | null> {
  for (const group of groups) {
    const resp = await raceAttempts(group);
    if (resp) return resp;
  }
  return null;
}

// allorigins /get wraps the upstream body in {contents, status} JSON — unwrap
// it back into a plain Response so callers can treat every proxy uniformly.
function allOriginsAttempt(encodedTarget: string): Attempt {
  return (signal) =>
    fetch(`https://api.allorigins.win/get?url=${encodedTarget}`, { signal }).then(async (r) => {
      if (!r.ok) throw new Error('allorigins failed');
      const wrapper = await r.json();
      if (!wrapper.contents) throw new Error('empty contents');
      return new Response(wrapper.contents, { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
}

// Fetch a Yahoo Finance path, racing the Worker (if configured) and public
// proxies. Returns the first OK Response, or null if all fail.
async function fetchYahoo(path: string): Promise<Response | null> {
  const target = `${YAHOO_BASE}${path}`;
  const encoded = encodeURIComponent(target);

  // Primary group: Worker (direct CORS, no wrapping) + one reliable public proxy.
  const primary: Attempt[] = [];
  if (PROXY_BASE) primary.push((signal) => fetch(`${PROXY_BASE}/yahoo${path}`, { signal }));
  primary.push((signal) => fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`, { signal }));

  // Fallback group: remaining public proxies (allorigins last — slowest).
  const fallback: Attempt[] = [
    (signal) => fetch(`https://corsproxy.io/?url=${encoded}`, { signal }),
    (signal) => fetch(`https://thingproxy.freeboard.io/fetch/${target}`, { signal }),
    allOriginsAttempt(encoded),
  ];

  return fetchViaGroups([primary, fallback]);
}

// Fetch a Stooq URL through the Worker/public proxies; returns raw text.
async function fetchStooqText(stooqUrl: string): Promise<string | null> {
  const encoded = encodeURIComponent(stooqUrl);
  const stooqPath = stooqUrl.startsWith(STOOQ_BASE) ? stooqUrl.slice(STOOQ_BASE.length) : stooqUrl;

  const primary: Attempt[] = [];
  if (PROXY_BASE) primary.push((signal) => fetch(`${PROXY_BASE}/stooq${stooqPath}`, { signal }));
  primary.push((signal) => fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`, { signal }));

  const fallback: Attempt[] = [
    (signal) => fetch(`https://corsproxy.io/?url=${encoded}`, { signal }),
    (signal) => fetch(`https://thingproxy.freeboard.io/fetch/${stooqUrl}`, { signal }),
    allOriginsAttempt(encoded),
  ];

  const resp = await fetchViaGroups([primary, fallback]);
  if (!resp) return null;
  try {
    return await resp.text();
  } catch {
    return null;
  }
}

// Mapping from Yahoo Finance suffix → Stooq suffix, and the currency for that exchange.
const YAHOO_TO_STOOQ: Record<string, { suffix: string; currency: string }> = {
  '.AS': { suffix: '.NL', currency: 'EUR' }, // Amsterdam
  '.DE': { suffix: '.DE', currency: 'EUR' }, // Frankfurt
  '.TG': { suffix: '.DE', currency: 'EUR' }, // Tradegate (use Frankfurt on Stooq)
  '.PA': { suffix: '.FR', currency: 'EUR' }, // Paris
  '.L':  { suffix: '.UK', currency: 'GBP' }, // London
  '.MI': { suffix: '.IT', currency: 'EUR' }, // Milan
  '.BR': { suffix: '.BE', currency: 'EUR' }, // Brussels
  '.LS': { suffix: '.PT', currency: 'EUR' }, // Lisbon
  '.HE': { suffix: '.FI', currency: 'EUR' }, // Helsinki
  '.ST': { suffix: '.SE', currency: 'SEK' }, // Stockholm
  '.CO': { suffix: '.DK', currency: 'DKK' }, // Copenhagen
  '.OL': { suffix: '.NO', currency: 'NOK' }, // Oslo
  '.SW': { suffix: '.CH', currency: 'CHF' }, // Switzerland
  '':    { suffix: '.US', currency: 'USD' }, // US exchanges
};

const MIC_TO_SUFFIX: Record<string, string> = {
  // MIC codes (Uitvoeringsplaats column — preferred)
  XAMS: '.AS', // Euronext Amsterdam
  XETR: '.DE', // Frankfurt XETRA
  XETA: '.DE', // Frankfurt XETRA (alternate MIC)
  XGAT: '.TG', // Tradegate Exchange
  XPAR: '.PA', // Euronext Paris
  XLON: '.L',  // London Stock Exchange
  XNYS: '',    // NYSE
  XNAS: '',    // NASDAQ
  XMIL: '.MI', // Borsa Italiana (old)
  MSEU: '.MI', // Euronext Milan
  XBRU: '.BR', // Euronext Brussels
  XLIS: '.LS', // Euronext Lisbon
  XHEL: '.HE', // Nasdaq Helsinki
  XSTO: '.ST', // Nasdaq Stockholm
  XCSE: '.CO', // Nasdaq Copenhagen
  XOSL: '.OL', // Oslo Børs
  XSWX: '.SW', // SIX Swiss Exchange
  SOHO: '',    // NASDAQ dark pool
  JNST: '',    // NASDAQ dark pool
  CDED: '',    // US dark pool (NASDAQ/NYSE)
  // DeGiro short codes (Beurs column — fallback)
  EAM:  '.AS',
  TDG:  '.TG',
  XET:  '.DE',
  NDQ:  '',
  NSY:  '',
  LSE:  '.L',
  MIL:  '.MI',
  EBR:  '.BR',
  EPA:  '.PA',
};

const TICKER_CACHE_KEY = 'ticker_cache_v1';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const QUOTE_CACHE_KEY = 'quote_cache_v1';
const CACHE_TTL_PRICE = 5 * 60 * 1000;       // 5 minutes
const CACHE_TTL_HISTORY = 60 * 60 * 1000;    // 1 hour

// Batching: with proxies now raced + timed out, modest fan-out is safe.
// Quotes are single raced requests, so they batch wider; the heavier history
// calls stay gentler to avoid tripping public-proxy rate limits.
const QUOTE_BATCH_SIZE = 5;
const QUOTE_BATCH_DELAY = 250;
const HISTORY_BATCH_SIZE = 3;
const HISTORY_BATCH_DELAY = 300;

interface HistoryCacheEntry {
  data: PricePoint[];
  fetchedAt: number;
}

// Quote cache — persisted so reloads within the price TTL paint instantly
// without re-fetching every quote. Keyed by ISIN.
export interface QuoteCacheEntry {
  ticker: string;
  priceEUR: number;
  nativeCurrency: string;
  nativePriceRaw: number;
  fetchedAt: number;
}

export function getCachedQuote(isin: string): QuoteCacheEntry | null {
  const cache = getFromLocalStorage<Record<string, QuoteCacheEntry>>(QUOTE_CACHE_KEY) ?? {};
  const entry = cache[isin];
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_PRICE) return entry;
  return null;
}

export interface QuoteResult {
  ticker: string;
  price: number;
  currency: string;
  priceInEUR: number;
}

export interface ResolvedTicker {
  ticker: string;
  // Quote captured during the direct probe, if that path succeeded — lets the
  // caller skip a second identical fetch. null when the ticker came from cache
  // or a search (no fresh quote was fetched).
  quote: { price: number; currency: string } | null;
}

// Resolve a ticker symbol for an ISIN.
// Strategy:
//   1. Return cached ticker if available.
//   2. Probe ISIN+suffix directly against Yahoo chart API (works for most tickers).
//   3. Search Yahoo by ISIN and pick the result matching the expected exchange suffix.
//   4. If that fails and a product name is available, search Yahoo by name.
//   5. Last resort: cache and return ISIN+suffix as-is.
export async function resolveTicker(isin: string, exchange: string, productName?: string): Promise<ResolvedTicker> {
  const cache = getFromLocalStorage<Record<string, string>>(TICKER_CACHE_KEY) ?? {};
  if (cache[isin]) return { ticker: cache[isin], quote: null };

  const suffix = MIC_TO_SUFFIX[exchange?.toUpperCase()] ?? '';
  const candidate = `${isin}${suffix}`;

  // Step 2: probe the candidate ticker directly
  const probeResult = await fetchQuote(candidate);
  if (probeResult) {
    cache[isin] = candidate;
    saveToLocalStorage(TICKER_CACHE_KEY, cache);
    return { ticker: candidate, quote: probeResult };
  }

  // Helper: search Yahoo Finance and return the best matching ticker
  async function searchYahoo(query: string): Promise<string | null> {
    try {
      const resp = await fetchYahoo(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`);
      if (!resp) return null;
      const json = await resp.json();
      const quotes: Array<{ symbol: string; quoteType: string }> =
        json?.quoteResponse?.result ?? json?.quotes ?? [];
      const eligible = quotes.filter(
        (q) => q.quoteType === 'ETF' || q.quoteType === 'EQUITY' || q.quoteType === 'MUTUALFUND'
      );
      const preferred = suffix
        ? eligible.find((q) => q.symbol.endsWith(suffix))
        : eligible[0];
      return (preferred ?? eligible[0])?.symbol ?? null;
    } catch {
      return null;
    }
  }

  // Step 2: search by ISIN
  const isinMatch = await searchYahoo(isin);
  if (isinMatch) {
    cache[isin] = isinMatch;
    saveToLocalStorage(TICKER_CACHE_KEY, cache);
    return { ticker: isinMatch, quote: null };
  }

  // Step 3: search by product name (fallback for ISINs Yahoo doesn't know)
  if (productName) {
    const nameMatch = await searchYahoo(productName);
    if (nameMatch) {
      cache[isin] = nameMatch;
      saveToLocalStorage(TICKER_CACHE_KEY, cache);
      return { ticker: nameMatch, quote: null };
    }
  }

  // Step 5: last resort — cache the candidate so we don't re-probe every load
  cache[isin] = candidate;
  saveToLocalStorage(TICKER_CACHE_KEY, cache);
  return { ticker: candidate, quote: null };
}

// Fetch a current quote for a ticker
export async function fetchQuote(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const resp = await fetchYahoo(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`);
    if (!resp) return null;
    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const price: number = result.meta?.regularMarketPrice ?? result.meta?.chartPreviousClose;
    const currency: string = result.meta?.currency ?? 'EUR';
    return { price, currency };
  } catch {
    return null;
  }
}

// Fallback: fetch a current quote from Stooq using the Yahoo ticker.
// Converts Yahoo suffix to Stooq suffix and derives the currency from the exchange.
export async function fetchQuoteStooq(yahooTicker: string): Promise<{ price: number; currency: string } | null> {
  try {
    // Detect Yahoo suffix and strip it to get the base symbol
    let baseTicker = yahooTicker;
    let stooqSuffix = '.US';
    let currency = 'USD';

    for (const [yahooSuffix, stooqInfo] of Object.entries(YAHOO_TO_STOOQ)) {
      if (yahooSuffix !== '' && yahooTicker.endsWith(yahooSuffix)) {
        baseTicker = yahooTicker.slice(0, -yahooSuffix.length);
        stooqSuffix = stooqInfo.suffix;
        currency = stooqInfo.currency;
        break;
      }
    }
    // If no suffix matched and the empty-string entry exists, it's a US ticker
    if (baseTicker === yahooTicker && !yahooTicker.includes('.')) {
      stooqSuffix = '.US';
      currency = 'USD';
    }

    const stooqTicker = `${baseTicker}${stooqSuffix}`.toLowerCase();
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqTicker)}&f=sd2l1c1&e=csv`;
    const text = await fetchStooqText(url);
    if (!text) return null;

    // CSV format: Symbol,Date,Open,Close,...  (first row is header)
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const cols = lines[1].split(',');
    // col index 2 = Open (l1), col index 3 = Close (c1) based on f=sd2l1c1
    // f=sd2l1c1: s=symbol, d2=date, l1=last price, c1=change
    const price = parseFloat(cols[2]);
    if (isNaN(price) || price <= 0) return null;

    return { price, currency };
  } catch {
    return null;
  }
}

// Fetch 1-year weekly price history for sparkline
export async function fetchHistory1Y(ticker: string): Promise<PricePoint[]> {
  const cacheKey = `${HISTORY_CACHE_KEY}_1y_${ticker}`;
  const cached = getFromLocalStorage<HistoryCacheEntry>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_HISTORY) {
    return cached.data;
  }

  try {
    const resp = await fetchYahoo(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1wk&range=1y`);
    if (!resp) return [];
    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    const data: PricePoint[] = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i],
      }))
      .filter((p) => p.close != null && !isNaN(p.close));

    saveToLocalStorage(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    return [];
  }
}

// Fetch last 5 trading days for trend calculation
export async function fetchHistory5Day(ticker: string): Promise<PricePoint[]> {
  const cacheKey = `${HISTORY_CACHE_KEY}_5d_${ticker}`;
  const cached = getFromLocalStorage<HistoryCacheEntry>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_PRICE) {
    return cached.data;
  }

  try {
    const resp = await fetchYahoo(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`);
    if (!resp) return [];
    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    const data: PricePoint[] = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i],
      }))
      .filter((p) => p.close != null && !isNaN(p.close));

    saveToLocalStorage(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    return [];
  }
}

// Calculate trend percentage from 5-day history
export function calc5DayTrend(history: PricePoint[]): number {
  if (history.length < 2) return 0;
  const first = history[0].close;
  const last = history[history.length - 1].close;
  if (first === 0) return 0;
  return (last - first) / first;
}

// Fetch EUR/foreign exchange rate. E.g. currency="USD" → fetch "EURUSD=X" → returns USD per 1 EUR.
// To convert a USD price to EUR: priceEUR = priceUSD / fxRate
export const fxRateCache: Record<string, { rate: number; fetchedAt: number }> = {};

export function getCachedFxRate(currency: string): number | null {
  const entry = fxRateCache[currency];
  return entry ? entry.rate : null;
}

// Fallback FX rate from Frankfurter (ECB data, native CORS, no proxy needed).
async function fetchFxRateFrankfurter(currency: string): Promise<number | null> {
  try {
    const resp = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${currency}`);
    if (!resp.ok) return null;
    const json = await resp.json();
    const rate: number = json?.rates?.[currency];
    return rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

async function fetchFxRateToEUR(currency: string): Promise<number> {
  if (currency === 'EUR') return 1;

  // Yahoo Finance uses "GBp" (pence) for London-listed securities.
  // We normalize to GBP for the FX lookup; the /100 conversion happens on the price side.
  const normalizedCurrency = currency === 'GBp' ? 'GBP' : currency;

  const cached = fxRateCache[normalizedCurrency];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_PRICE) {
    return cached.rate;
  }

  // Primary: Yahoo Finance
  try {
    const ticker = `EUR${normalizedCurrency}=X`;
    const resp = await fetchYahoo(`/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`);
    if (resp) {
      const json = await resp.json();
      const rate: number = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rate > 0) {
        fxRateCache[normalizedCurrency] = { rate, fetchedAt: Date.now() };
        return rate;
      }
    }
  } catch {
    // fall through to Frankfurter
  }

  // Fallback: Frankfurter (ECB rates, direct CORS)
  const frankfurterRate = await fetchFxRateFrankfurter(normalizedCurrency);
  if (frankfurterRate) {
    fxRateCache[normalizedCurrency] = { rate: frankfurterRate, fetchedAt: Date.now() };
    return frankfurterRate;
  }

  return 1;
}

export interface QuotePhaseResult {
  ticker: string;
  priceEUR: number;
  nativeCurrency: string;
  nativePriceRaw: number;
}

export interface HistoryPhaseResult {
  history1Y: PricePoint[];
  history5Day: PricePoint[];
}

// Phase A (fast): resolve the ticker, fetch the current quote, convert to EUR,
// and report it so the table can paint the price immediately. Returns the
// resolved tickers so the history phase doesn't have to re-resolve them.
// Fresh quotes are persisted to localStorage for instant reloads.
export async function fetchQuotesPhase(
  isins: Array<{ isin: string; exchange: string; productName?: string }>,
  onQuote: (isin: string, data: QuotePhaseResult | null, errorReason?: string) => void
): Promise<Array<{ isin: string; ticker: string }>> {
  const resolved: Array<{ isin: string; ticker: string }> = [];
  const quoteCache = getFromLocalStorage<Record<string, QuoteCacheEntry>>(QUOTE_CACHE_KEY) ?? {};

  for (let i = 0; i < isins.length; i += QUOTE_BATCH_SIZE) {
    const batch = isins.slice(i, i + QUOTE_BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ isin, exchange, productName }) => {
        try {
          const { ticker, quote: probedQuote } = await resolveTicker(isin, exchange, productName);
          resolved.push({ isin, ticker });

          // Reuse the probe's quote when available, else fetch (Yahoo → Stooq).
          const quote = probedQuote ?? (await fetchQuote(ticker)) ?? (await fetchQuoteStooq(ticker));
          if (!quote) {
            onQuote(isin, null, 'Koers niet beschikbaar');
            return;
          }

          const rawPrice = quote.price ?? 0;
          const currency = quote.currency ?? 'EUR';
          // Yahoo quotes London securities in GBp (pence) — normalize to GBP first
          const normalizedPrice = currency === 'GBp' ? rawPrice / 100 : rawPrice;
          const nativeCurrency = currency === 'GBp' ? 'GBP' : currency;
          const fxRate = await fetchFxRateToEUR(currency);
          // fxRate = units of foreign currency per 1 EUR (EURGBP=X ≈ 0.855, EURUSD=X ≈ 1.08)
          const priceEUR = fxRate > 0 ? normalizedPrice / fxRate : normalizedPrice;

          quoteCache[isin] = {
            ticker,
            priceEUR,
            nativeCurrency,
            nativePriceRaw: normalizedPrice,
            fetchedAt: Date.now(),
          };

          onQuote(isin, { ticker, priceEUR, nativeCurrency, nativePriceRaw: normalizedPrice });
        } catch {
          onQuote(isin, null, 'API niet bereikbaar');
        }
      })
    );

    if (i + QUOTE_BATCH_SIZE < isins.length) {
      await new Promise((r) => setTimeout(r, QUOTE_BATCH_DELAY));
    }
  }

  // One localStorage write for the whole batch (avoids O(n) writes).
  saveToLocalStorage(QUOTE_CACHE_KEY, quoteCache);
  return resolved;
}

// Phase B (lazy, background): fetch 1Y + 5D history for sparklines/trend.
// Both are already localStorage-cached, so reloads within TTL are cheap.
export async function fetchHistoryPhase(
  resolved: Array<{ isin: string; ticker: string }>,
  onHistory: (isin: string, data: HistoryPhaseResult | null) => void
): Promise<void> {
  for (let i = 0; i < resolved.length; i += HISTORY_BATCH_SIZE) {
    const batch = resolved.slice(i, i + HISTORY_BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ isin, ticker }) => {
        try {
          const [history1Y, history5Day] = await Promise.all([
            fetchHistory1Y(ticker),
            fetchHistory5Day(ticker),
          ]);
          onHistory(isin, { history1Y, history5Day });
        } catch {
          onHistory(isin, null);
        }
      })
    );

    if (i + HISTORY_BATCH_SIZE < resolved.length) {
      await new Promise((r) => setTimeout(r, HISTORY_BATCH_DELAY));
    }
  }
}
