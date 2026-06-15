import type { AccountEntry, AccountName, AccountSummary } from '../types/account';

/**
 * Compute account summary from account entries.
 *
 * - totalGestort: total cash deposited into the account — sum of deposit ("Storting" /
 *   "flatex Storting" / "iDEAL Deposit") mutation lines from the account file.
 * - totalTerugboekingen: total cash transferred back to the bank. Withdrawals are booked
 *   as a paired "Processed Flatex Withdrawal" (+X then −X, which nets to zero) plus the
 *   actual "flatex terugstorting" (−X). We therefore take the absolute value of the
 *   *signed* sum so the paired entries cancel and only the real transfer-out remains.
 * - nettoInleg: net capital deployed = totalGestort − totalTerugboekingen.
 * - freeCash: most recent EUR balance from account entries.
 */
export function computeAccountSummary(
  entries: AccountEntry[],
  account: AccountName,
): AccountSummary {
  const totalGestort = entries
    .filter((e) => e.entryType === 'deposit')
    .reduce((sum, e) => sum + e.mutationAmount, 0);

  const totalTerugboekingen = Math.abs(
    entries
      .filter((e) => e.entryType === 'withdrawal')
      .reduce((sum, e) => sum + e.mutationAmount, 0),
  );

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
