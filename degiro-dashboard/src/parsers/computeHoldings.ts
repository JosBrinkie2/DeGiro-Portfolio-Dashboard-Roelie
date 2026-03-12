import type { Transaction } from '../types/transaction';
import type { AccountName } from '../types/account';
import type { Holding, VolumePoint } from '../types/holding';
import { getBiMonthlyKey, getBiMonthlyLabel } from '../utils/dates';

interface HoldingState {
  isin: string;
  product: string;
  account: AccountName;
  exchange: string;
  quantity: number;
  averageCostEUR: number; // GAK
  totalCostEUR: number;
}

/**
 * Compute current holdings (with GAK) from a list of transactions.
 *
 * Uses the weighted average cost method:
 * - BUY: recalculate average cost = (totalCost + buyAmount) / (qty + buyQty)
 * - SELL: reduce quantity, reduce total cost proportionally (average cost unchanged)
 * - Stock splits (totalEUR === 0): adjust quantity only, skip cost update
 */
export function computeHoldings(transactions: Transaction[]): Holding[] {
  // Group by account + ISIN
  const map = new Map<string, HoldingState>();

  // Sort by date ascending to process chronologically
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const tx of sorted) {
    if (!tx.isin || tx.isin.trim() === '') continue;

    const key = `${tx.account}::${tx.isin}`;
    const existing = map.get(key) ?? {
      isin: tx.isin,
      product: tx.product,
      account: tx.account,
      exchange: tx.exchange,
      quantity: 0,
      averageCostEUR: 0,
      totalCostEUR: 0,
    };

    const qty = tx.quantity;

    if (qty > 0) {
      // BUY
      const cost = Math.abs(tx.totalEUR);

      if (tx.totalEUR === 0) {
        // Stock split or corporate action — quantity adjustment only
        existing.quantity += qty;
      } else {
        existing.totalCostEUR += cost;
        existing.quantity += qty;
        existing.averageCostEUR = existing.quantity > 0
          ? existing.totalCostEUR / existing.quantity
          : 0;
      }
    } else if (qty < 0) {
      // SELL
      const sellQty = Math.abs(qty);
      existing.quantity -= sellQty;
      existing.totalCostEUR -= sellQty * existing.averageCostEUR;

      // Clamp to prevent floating-point negatives on full sell
      if (existing.quantity < 0.0001) {
        existing.quantity = 0;
        existing.totalCostEUR = 0;
        existing.averageCostEUR = 0;
      }
    }

    // Update product name and exchange from the most recent transaction
    if (tx.product && tx.product.trim() !== '') {
      existing.product = tx.product;
    }
    if (tx.exchange && tx.exchange.trim() !== '') {
      existing.exchange = tx.exchange;
    }

    map.set(key, existing);
  }

  // Return only open positions
  return Array.from(map.values())
    .filter((h) => h.quantity > 0.0001)
    .map((h): Holding => ({
      isin: h.isin,
      product: h.product,
      account: h.account,
      exchange: h.exchange,
      quantity: h.quantity,
      averageCostEUR: h.averageCostEUR,
      totalCostEUR: h.totalCostEUR,
    }));
}

/**
 * Compute volume history (bi-monthly) for a specific ISIN + account combination.
 * Volume = absolute EUR value of all buy/sell transactions in that period.
 */
export function computeVolumeHistory(
  transactions: Transaction[],
  isin: string,
  account: AccountName
): VolumePoint[] {
  const relevant = transactions.filter(
    (t) => t.isin === isin && t.account === account
  );

  const buckets: Record<string, number> = {};

  for (const t of relevant) {
    const key = getBiMonthlyKey(t.date);
    buckets[key] = (buckets[key] ?? 0) + Math.abs(t.valueEUR);
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, volume]): VolumePoint => ({
      period: key,
      label: getBiMonthlyLabel(key),
      volume,
    }));
}

/**
 * Reconstruct holdings state as of a specific date (for portfolio history chart).
 * Returns holdings from transactions up to and including the given date.
 */
export function computeHoldingsAtDate(
  transactions: Transaction[],
  asOfDate: Date
): Holding[] {
  const upTo = transactions.filter((t) => t.date <= asOfDate);
  return computeHoldings(upTo);
}
