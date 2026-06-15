import type { AccountEntry } from '../types/account';

export function hashAccountEntry(e: AccountEntry): string {
  return JSON.stringify([
    e.account,
    e.date instanceof Date ? e.date.toISOString() : e.date,
    e.product,
    e.isin,
    e.description,
    e.entryType,
    e.mutationCurrency,
    e.mutationAmount,
    e.balanceCurrency,
    e.balanceAmount,
  ]);
}
