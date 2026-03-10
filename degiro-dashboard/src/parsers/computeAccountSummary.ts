import type { AccountEntry, AccountName, AccountSummary } from '../types/account';

/**
 * Compute account summary from account.csv entries.
 *
 * - totalDeposited: sum of all "Storting" mutations
 * - totalWithdrawn: sum of absolute values of all "Terugboeking" mutations
 * - freeCash: most recent EUR saldo (= currently available cash for investing)
 */
export function computeAccountSummary(
  entries: AccountEntry[],
  account: AccountName
): AccountSummary {
  const deposits = entries
    .filter((e) => e.entryType === 'deposit')
    .reduce((sum, e) => sum + e.mutationAmount, 0);

  const withdrawals = entries
    .filter((e) => e.entryType === 'withdrawal')
    .reduce((sum, e) => sum + Math.abs(e.mutationAmount), 0);

  // Find the most recent EUR balance entry
  const eurEntries = entries
    .filter((e) => e.balanceCurrency === 'EUR')
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const freeCash = eurEntries.length > 0 ? eurEntries[0].balanceAmount : 0;

  return {
    account,
    totalDeposited: deposits,
    totalWithdrawn: withdrawals,
    freeCash,
    currentPortfolioValue: 0, // filled in after live prices are loaded
  };
}
