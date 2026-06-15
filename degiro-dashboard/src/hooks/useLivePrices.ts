import { useEffect } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { usePriceStore } from '../store/usePriceStore';
import { fetchAllPrices, calc5DayTrend } from '../services/yahooFinance';

const REFRESH_TTL = 5 * 60 * 1000; // 5 minutes

export function useLivePrices() {
  const getAllHoldings = useAccountStore((s) => s.getAllHoldings);
  const getAllTransactions = useAccountStore((s) => s.getAllTransactions);
  const { prices, setLoading, setPriceData, setError } = usePriceStore();

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

    // Only fetch ISINs that are stale or not yet fetched
    const staleIsins = holdings
      .filter((h) => {
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

    if (staleIsins.length === 0) return;

    // Mark all stale ISINs as loading
    staleIsins.forEach(({ isin }) => setLoading(isin));

    fetchAllPrices(staleIsins, (isin, data, errorReason) => {
      if (!data) {
        setError(isin, errorReason ?? 'Kon koers niet ophalen');
        return;
      }
      const trend5Day = calc5DayTrend(data.history5Day);
      setPriceData(isin, {
        ticker: data.ticker,
        nativeCurrency: data.nativeCurrency,
        nativePriceRaw: data.nativePriceRaw,
        currentPriceEUR: data.priceEUR,
        history1Y: data.history1Y,
        history5Day: data.history5Day,
        trend5Day,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllHoldings().length]);
}
