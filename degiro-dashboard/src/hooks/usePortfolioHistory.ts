import { useMemo } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { usePriceStore } from '../store/usePriceStore';
import type { PortfolioSnapshot } from '../types/portfolio';
import { computeHoldingsAtDate } from '../parsers/computeHoldings';
import { getQuarterEndDates, formatQuarter } from '../utils/dates';

export function usePortfolioHistory(): PortfolioSnapshot[] {
  const getAllTransactions = useAccountStore((s) => s.getAllTransactions);
  const roel64Entries = useAccountStore((s) => s.roel64.entries);
  const roelPensEntries = useAccountStore((s) => s.roelPensioen64.entries);
  const prices = usePriceStore((s) => s.prices);

  return useMemo(() => {
    const transactions = getAllTransactions();
    if (transactions.length === 0) return [];

    const allDates = transactions.map((t) => t.date);
    const oldest = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const today = new Date();

    const quarterEnds = getQuarterEndDates(oldest, today);
    if (quarterEnds.length === 0) return [];

    return quarterEnds.map((qDate): PortfolioSnapshot => {
      const holdingsAtDate = computeHoldingsAtDate(transactions, qDate);

      let valueRoel64 = 0;
      let valueRoelPensioen64 = 0;

      for (const h of holdingsAtDate) {
        // Use 1-year history to find the price closest to this quarter-end date
        const priceData = prices[h.isin];
        let price = 0;

        if (priceData?.history1Y && priceData.history1Y.length > 0) {
          // Find the closest price to qDate in the history
          const qTime = qDate.getTime();
          const sorted = [...priceData.history1Y].sort(
            (a, b) =>
              Math.abs(new Date(a.date).getTime() - qTime) -
              Math.abs(new Date(b.date).getTime() - qTime)
          );
          price = sorted[0]?.close ?? 0;
        } else if (priceData?.currentPriceEUR && qDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          // For recent quarter ends, use current price as approximation
          price = priceData.currentPriceEUR;
        }

        const value = h.quantity * price;
        if (h.account === 'Roel64') valueRoel64 += value;
        else valueRoelPensioen64 += value;
      }

      // Add cash balance at that date (from account entries)
      const roel64CashEntries = roel64Entries
        .filter((e) => e.date <= qDate && e.balanceCurrency === 'EUR')
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      const roelPensCashEntries = roelPensEntries
        .filter((e) => e.date <= qDate && e.balanceCurrency === 'EUR')
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      valueRoel64 += roel64CashEntries[0]?.balanceAmount ?? 0;
      valueRoelPensioen64 += roelPensCashEntries[0]?.balanceAmount ?? 0;

      return {
        date: qDate.toISOString(),
        quarter: formatQuarter(qDate),
        valueRoel64,
        valueRoelPensioen64,
        totalValue: valueRoel64 + valueRoelPensioen64,
      };
    });
  }, [getAllTransactions, roel64Entries, roelPensEntries, prices]);
}
