import type { AccountEntry } from '../types/account';
import type { Transaction } from '../types/transaction';

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

export function hashTransaction(t: Transaction): string {
  return JSON.stringify([
    t.account,
    t.date instanceof Date ? t.date.toISOString() : t.date,
    t.product,
    t.isin,
    t.exchange,
    t.quantity,
    t.priceCurrency,
    t.priceAmount,
    t.valueEUR,
    t.totalEUR,
  ]);
}
