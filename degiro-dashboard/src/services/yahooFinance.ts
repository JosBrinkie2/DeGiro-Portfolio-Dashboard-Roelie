import type { PricePoint } from '../types/holding';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

// MIC code to Yahoo Finance exchange suffix mapping
const MIC_TO_SUFFIX: Record<string, string> = {
  XAMS: '.AS', // Amsterdam (Euronext)
  XETR: '.DE', // Frankfurt XETRA
  XPAR: '.PA', // Paris (Euronext)
  XLON: '.L',  // London Stock Exchange
  XNYS: '',    // NYSE
  XNAS: '',    // NASDAQ
  XMIL: '.MI', // Milan (Borsa Italiana)
  XBRU: '.BR', // Brussels (Euronext)
  XLIS: '.LS', // Lisbon
  XHEL: '.HE', // Helsinki
  XSTO: '.ST', // Stockholm
  XCSE: '.CO', // Copenhagen
  XOSL: '.OL', // Oslo
  XSWX: '.SW', // Swiss Exchange
};

const TICKER_CACHE_KEY = 'ticker_cache_v1';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const CACHE_TTL_PRICE = 5 * 60 * 1000;       // 5 minutes
const CACHE_TTL_HISTORY = 60 * 60 * 1000;    // 1 hour

interface HistoryCacheEntry {
  data: PricePoint[];
  fetchedAt: number;
}

export interface QuoteResult {
  ticker: string;
  price: number;
  currency: string;
  priceInEUR: number;
}

// Build a candidate ticker from ISIN + exchange MIC code
export function buildTickerFromISIN(isin: string, exchange: string): string {
  const suffix = MIC_TO_SUFFIX[exchange?.toUpperCase()] ?? '';
  return `${isin}${suffix}`;
}

// Resolve a ticker symbol for an ISIN, using cache or Yahoo search fallback
export async function resolveTicker(isin: string, exchange: string): Promise<string> {
  const cache = getFromLocalStorage<Record<string, string>>(TICKER_CACHE_KEY) ?? {};
  if (cache[isin]) return cache[isin];

  const suffix = MIC_TO_SUFFIX[exchange?.toUpperCase()] ?? '';
  const candidate = buildTickerFromISIN(isin, exchange);

  try {
    const resp = await fetch(
      `/api/yahoo/v1/finance/search?q=${encodeURIComponent(isin)}&quotesCount=5&newsCount=0`
    );
    if (resp.ok) {
      const json = await resp.json();
      const quotes: Array<{ symbol: string; quoteType: string }> =
        json?.quoteResponse?.result ?? json?.quotes ?? [];
      const eligible = quotes.filter(
        (q) => q.quoteType === 'ETF' || q.quoteType === 'EQUITY' || q.quoteType === 'MUTUALFUND'
      );

      // Prefer a result whose symbol ends with the expected exchange suffix
      const preferred = suffix
        ? eligible.find((q) => q.symbol.endsWith(suffix))
        : undefined;
      const match = preferred ?? eligible[0];

      if (match?.symbol) {
        cache[isin] = match.symbol;
        saveToLocalStorage(TICKER_CACHE_KEY, cache);
        return match.symbol;
      }
    }
  } catch {
    // Network error — fall through to candidate
  }

  // Fall back to candidate ticker
  cache[isin] = candidate;
  saveToLocalStorage(TICKER_CACHE_KEY, cache);
  return candidate;
}

// Fetch a current quote for a ticker
export async function fetchQuote(ticker: string): Promise<{ price: number; currency: string } | null> {
  try {
    const resp = await fetch(
      `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    );
    if (!resp.ok) return null;
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

// Fetch 1-year weekly price history for sparkline
export async function fetchHistory1Y(ticker: string): Promise<PricePoint[]> {
  const cacheKey = `${HISTORY_CACHE_KEY}_1y_${ticker}`;
  const cached = getFromLocalStorage<HistoryCacheEntry>(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_HISTORY) {
    return cached.data;
  }

  try {
    const resp = await fetch(
      `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1wk&range=1y`
    );
    if (!resp.ok) return [];
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
    const resp = await fetch(
      `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
    );
    if (!resp.ok) return [];
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

async function fetchFxRateToEUR(currency: string): Promise<number> {
  if (currency === 'EUR') return 1;

  // Yahoo Finance uses "GBp" (pence) for London-listed securities.
  // We normalize to GBP for the FX lookup; the /100 conversion happens on the price side.
  const normalizedCurrency = currency === 'GBp' ? 'GBP' : currency;

  const cached = fxRateCache[normalizedCurrency];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_PRICE) {
    return cached.rate;
  }

  try {
    const ticker = `EUR${normalizedCurrency}=X`;
    const resp = await fetch(
      `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    );
    if (!resp.ok) return 1;
    const json = await resp.json();
    const rate: number = json?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1;
    fxRateCache[normalizedCurrency] = { rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    return 1;
  }
}

// Batch fetch with rate limiting (5 per batch, 300ms delay)
export async function fetchAllPrices(
  isins: Array<{ isin: string; exchange: string }>,
  onProgress: (isin: string, data: {
    ticker: string;
    priceEUR: number;
    history1Y: PricePoint[];
    history5Day: PricePoint[];
  } | null) => void
): Promise<void> {
  const BATCH_SIZE = 5;
  const DELAY = 300;

  for (let i = 0; i < isins.length; i += BATCH_SIZE) {
    const batch = isins.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ isin, exchange }) => {
        try {
          const ticker = await resolveTicker(isin, exchange);
          const [quote, history1Y, history5Day] = await Promise.all([
            fetchQuote(ticker),
            fetchHistory1Y(ticker),
            fetchHistory5Day(ticker),
          ]);

          const rawPrice = quote?.price ?? 0;
          const currency = quote?.currency ?? 'EUR';
          // Yahoo quotes London securities in GBp (pence) — normalize to GBP first
          const normalizedPrice = currency === 'GBp' ? rawPrice / 100 : rawPrice;
          const fxRate = await fetchFxRateToEUR(currency);
          // fxRate = units of foreign currency per 1 EUR (EURGBP=X ≈ 0.855, EURUSD=X ≈ 1.08)
          // priceEUR = normalizedPrice / fxRate
          const priceEUR = fxRate > 0 ? normalizedPrice / fxRate : normalizedPrice;

          onProgress(isin, {
            ticker,
            priceEUR,
            history1Y,
            history5Day,
          });
        } catch {
          onProgress(isin, null);
        }
      })
    );

    if (i + BATCH_SIZE < isins.length) {
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }
}
