import type { AccountEntry, AccountName, AccountSummary } from '../types/account';
import type { Transaction } from '../types/transaction';

/**
 * Compute account summary from transactions and optional account entries.
 *
 * - nettoInleg: net capital deployed = -(sum of all totalEUR across transactions)
 *   buys have negative totalEUR, sells have positive — so negating gives net outflow
 * - freeCash: most recent EUR balance from account entries (overridden by Portfolio CSV in the store)
 */
export function computeAccountSummary(
  entries: AccountEntry[],
  account: AccountName,
  transactions: Transaction[] = [],
): AccountSummary {
  const totalGestort = transactions
    .filter((t) => t.quantity > 0)
    .reduce((sum, t) => sum + Math.abs(t.totalEUR), 0);

  const totalTerugboekingen = transactions
    .filter((t) => t.quantity < 0)
    .reduce((sum, t) => sum + t.totalEUR, 0);

  const nettoInleg = totalGestort - totalTerugboekingen;

  // Find the most recent EUR balance entry (fallback when no Portfolio CSV available)
  const eurEntries = entries
    .filter((e) => e.balanceCurrency === 'EUR')
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const freeCash = eurEntries.length > 0 ? eurEntries[0].balanceAmount : 0;

  return {
    account,
    totalGestort,
    totalTerugboekingen,
    nettoInleg,
    freeCash,
    currentPortfolioValue: 0, // filled in after live prices are loaded
  };
}
