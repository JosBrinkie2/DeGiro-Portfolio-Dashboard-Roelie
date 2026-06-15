import { create } from 'zustand';
import type { AccountEntry, AccountName, AccountSummary } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { Holding } from '../types/holding';
import { computeHoldings } from '../parsers/computeHoldings';
import { computeAccountSummary } from '../parsers/computeAccountSummary';
import { deriveTransactionsFromAccount } from '../parsers/deriveTransactionsFromAccount';
import { loadAccountData, saveAccountData } from '../utils/localStorage';
import { hashAccountEntry } from '../utils/dedup';

interface AccountData {
  entries: AccountEntry[];
  transactions: Transaction[]; // derived from entries
  loaded: boolean;
}

export interface MergeResult {
  newEntries: number;
  skippedEntries: number;
}

interface AccountStoreState {
  roel64: AccountData;
  roelPensioen64: AccountData;
  setAccountData: (account: AccountName, entries: AccountEntry[]) => void;
  mergeAccountData: (account: AccountName, newEntries: AccountEntry[]) => MergeResult;
  clearAccount: (account: AccountName) => void;
  getSummary: (account: AccountName) => AccountSummary | null;
  getAllHoldings: () => Holding[];
  getAllTransactions: () => Transaction[];
}

function hydrateFromStorage(account: AccountName): AccountData {
  const persisted = loadAccountData(account);
  if (!persisted) return { entries: [], transactions: [], loaded: false };
  return {
    entries: persisted.entries,
    transactions: deriveTransactionsFromAccount(persisted.entries),
    loaded: true,
  };
}

const emptyData: AccountData = { entries: [], transactions: [], loaded: false };

function buildData(entries: AccountEntry[]): AccountData {
  return { entries, transactions: deriveTransactionsFromAccount(entries), loaded: true };
}

export const useAccountStore = create<AccountStoreState>((set, get) => ({
  roel64: hydrateFromStorage('Roel64'),
  roelPensioen64: hydrateFromStorage('RoelPensioen64'),

  setAccountData: (account, entries) => {
    saveAccountData(account, entries);
    const data = buildData(entries);
    set((state) => ({
      roel64: account === 'Roel64' ? data : state.roel64,
      roelPensioen64: account === 'RoelPensioen64' ? data : state.roelPensioen64,
    }));
  },

  mergeAccountData: (account, newEntries) => {
    const state = get();
    const existing = account === 'Roel64' ? state.roel64 : state.roelPensioen64;

    const entryHashes = new Set(existing.entries.map(hashAccountEntry));
    const addedEntries = newEntries.filter(e => !entryHashes.has(hashAccountEntry(e)));

    const mergedEntries = [...existing.entries, ...addedEntries];
    saveAccountData(account, mergedEntries);
    const data = buildData(mergedEntries);
    set((state) => ({
      roel64: account === 'Roel64' ? data : state.roel64,
      roelPensioen64: account === 'RoelPensioen64' ? data : state.roelPensioen64,
    }));

    return {
      newEntries: addedEntries.length,
      skippedEntries: newEntries.length - addedEntries.length,
    };
  },

  clearAccount: (account) => {
    saveAccountData(account, []);
    set((state) => ({
      roel64: account === 'Roel64' ? emptyData : state.roel64,
      roelPensioen64: account === 'RoelPensioen64' ? emptyData : state.roelPensioen64,
    }));
  },

  getSummary: (account) => {
    const { roel64, roelPensioen64 } = get();
    const data = account === 'Roel64' ? roel64 : roelPensioen64;
    if (!data.loaded) return null;
    return computeAccountSummary(data.entries, account);
  },

  getAllHoldings: () => {
    const { roel64, roelPensioen64 } = get();
    const allTransactions = [
      ...roel64.transactions,
      ...roelPensioen64.transactions,
    ];
    return computeHoldings(allTransactions);
  },

  getAllTransactions: () => {
    const { roel64, roelPensioen64 } = get();
    return [...roel64.transactions, ...roelPensioen64.transactions];
  },
}));
