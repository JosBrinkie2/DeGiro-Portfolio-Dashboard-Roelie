import type { AccountName, AccountEntry } from '../types/account';
import type { Transaction } from '../types/transaction';

const ACCOUNT_DATA_KEY = (account: AccountName) => `account-data-${account}`;

type SerializedAccountEntry = Omit<AccountEntry, 'date'> & { date: string };
type SerializedTransaction = Omit<Transaction, 'date'> & { date: string };

interface PersistedAccountData {
  entries: SerializedAccountEntry[];
  transactions: SerializedTransaction[];
  portfolioFreeCash?: number | null;
}

export function loadAccountData(account: AccountName): { entries: AccountEntry[]; transactions: Transaction[]; portfolioFreeCash: number | null } | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_DATA_KEY(account));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAccountData;
    return {
      entries: parsed.entries.map(e => ({ ...e, date: new Date(e.date) })),
      transactions: parsed.transactions.map(t => ({ ...t, date: new Date(t.date) })),
      portfolioFreeCash: parsed.portfolioFreeCash ?? null,
    };
  } catch {
    return null;
  }
}

export function saveAccountData(account: AccountName, entries: AccountEntry[], transactions: Transaction[], portfolioFreeCash?: number | null): void {
  try {
    const data: PersistedAccountData = {
      entries: entries.map(e => ({ ...e, date: e.date.toISOString() })),
      transactions: transactions.map(t => ({ ...t, date: t.date.toISOString() })),
      portfolioFreeCash: portfolioFreeCash ?? null,
    };
    localStorage.setItem(ACCOUNT_DATA_KEY(account), JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}

export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}
