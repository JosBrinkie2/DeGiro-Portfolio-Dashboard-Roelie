import { useEffect } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { usePriceStore } from '../store/usePriceStore';
import {
  fetchQuotesPhase,
  fetchHistoryPhase,
  getCachedQuote,
  calc5DayTrend,
} from '../services/yahooFinance';

const REFRESH_TTL = 5 * 60 * 1000; // 5 minutes

export function useLivePrices() {
  const getAllHoldings = useAccountStore((s) => s.getAllHoldings);
  const getAllTransactions = useAccountStore((s) => s.getAllTransactions);
  const { prices, setLoading, setQuoteData, setHistoryData, setError } = usePriceStore();

  useEffect(() => {
    const holdings = getAllHoldings();
    const transactions = getAllTransactions();

    if (holdings.length === 0) return;

    // Build a map of ISIN → exchange (from the most recent transaction for each ISIN)
    const isinExchangeMap: Record<string, string> = {};
    for (const tx of transactions) {
      if (tx.isin && tx.exchange) {
        isinExchangeMap[tx.isin] = tx.exchange;
      }
    }

    // Hydrate from persisted quotes first so a reload paints instantly, and
    // remember which ISINs are already covered by a fresh cached quote.
    const cachedTickers: Record<string, string> = {};
    for (const h of holdings) {
      if (prices[h.isin]) continue;
      const cached = getCachedQuote(h.isin);
      if (cached) {
        cachedTickers[h.isin] = cached.ticker;
        setQuoteData(h.isin, {
          ticker: cached.ticker,
          nativeCurrency: cached.nativeCurrency,
          nativePriceRaw: cached.nativePriceRaw,
          currentPriceEUR: cached.priceEUR,
        });
      }
    }

    // Quotes to (re)fetch: stale, missing, and not covered by a fresh cache.
    const staleIsins = holdings
      .filter((h) => {
        if (cachedTickers[h.isin]) return false;
        const existing = prices[h.isin];
        if (!existing) return true;
        if (existing.loading) return false;
        return Date.now() - existing.lastFetched > REFRESH_TTL;
      })
      .map((h) => ({
        isin: h.isin,
        exchange: isinExchangeMap[h.isin] ?? '',
        productName: h.product,
      }));

    // Mark the ones we'll fetch as loading.
    staleIsins.forEach(({ isin }) => setLoading(isin));

    // Phase A: quotes first (fast paint). Phase B: history/sparklines in the
    // background — it must NOT block the price numbers from appearing. History
    // is fetched for cached holdings too (cheap — it's localStorage-cached) so
    // sparklines still show on a quick reload.
    (async () => {
      const resolved = staleIsins.length
        ? await fetchQuotesPhase(staleIsins, (isin, data, errorReason) => {
            if (!data) {
              setError(isin, errorReason ?? 'Kon koers niet ophalen');
              return;
            }
            setQuoteData(isin, {
              ticker: data.ticker,
              nativeCurrency: data.nativeCurrency,
              nativePriceRaw: data.nativePriceRaw,
              currentPriceEUR: data.priceEUR,
            });
          })
        : [];

      // History targets: freshly resolved + cached holdings (deduped by ISIN).
      const historyTargets = [...resolved];
      for (const [isin, ticker] of Object.entries(cachedTickers)) {
        if (!historyTargets.some((t) => t.isin === isin)) {
          historyTargets.push({ isin, ticker });
        }
      }

      if (historyTargets.length === 0) return;

      void fetchHistoryPhase(historyTargets, (isin, data) => {
        if (!data) return;
        setHistoryData(isin, {
          history1Y: data.history1Y,
          history5Day: data.history5Day,
          trend5Day: calc5DayTrend(data.history5Day),
        });
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllHoldings().length]);
}
