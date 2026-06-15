import type { AccountName, AccountEntry } from '../types/account';

// v2: only account entries are persisted; transactions are derived from them on load.
// The version bump retires v1 state that lacked the Order Id needed for derivation.
const ACCOUNT_DATA_KEY = (account: AccountName) => `account-data-v2-${account}`;

type SerializedAccountEntry = Omit<AccountEntry, 'date'> & { date: string };

interface PersistedAccountData {
  entries: SerializedAccountEntry[];
}

export function loadAccountData(account: AccountName): { entries: AccountEntry[] } | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_DATA_KEY(account));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAccountData;
    return {
      entries: parsed.entries.map(e => ({ ...e, date: new Date(e.date), orderId: e.orderId ?? '' })),
    };
  } catch {
    return null;
  }
}

export function saveAccountData(account: AccountName, entries: AccountEntry[]): void {
  try {
    const data: PersistedAccountData = {
      entries: entries.map(e => ({ ...e, date: e.date.toISOString() })),
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
