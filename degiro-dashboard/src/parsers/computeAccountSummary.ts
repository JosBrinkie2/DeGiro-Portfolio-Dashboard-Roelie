import type { AccountEntry, AccountName, AccountSummary } from '../types/account';

/**
 * Compute account summary from account entries.
 *
 * - totalGestort: total cash deposited into the account — sum of deposit ("Storting")
 *   mutation lines from the account file (positive amounts).
 * - totalTerugboekingen: total cash transferred back to the bank — sum of withdrawal
 *   ("Terugboeking") mutation lines, expressed as a positive figure.
 * - nettoInleg: net capital deployed = totalGestort − totalTerugboekingen.
 * - freeCash: most recent EUR balance from account entries (overridden by Portfolio CSV in the store)
 */
export function computeAccountSummary(
  entries: AccountEntry[],
  account: AccountName,
): AccountSummary {
  const totalGestort = entries
    .filter((e) => e.entryType === 'deposit')
    .reduce((sum, e) => sum + e.mutationAmount, 0);

  const totalTerugboekingen = entries
    .filter((e) => e.entryType === 'withdrawal')
    .reduce((sum, e) => sum + Math.abs(e.mutationAmount), 0);

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
