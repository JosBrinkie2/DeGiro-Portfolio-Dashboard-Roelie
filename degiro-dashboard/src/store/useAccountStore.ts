import { create } from 'zustand';
import type { AccountEntry, AccountName, AccountSummary } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { Holding } from '../types/holding';
import { computeHoldings } from '../parsers/computeHoldings';
import { computeAccountSummary } from '../parsers/computeAccountSummary';
import { loadAccountData, saveAccountData } from '../utils/localStorage';
import { hashAccountEntry, hashTransaction } from '../utils/dedup';

interface AccountData {
  entries: AccountEntry[];
  transactions: Transaction[];
  loaded: boolean;
  portfolioFreeCash: number | null;
}

export interface MergeResult {
  newEntries: number;
  skippedEntries: number;
  newTransactions: number;
  skippedTransactions: number;
}

interface AccountStoreState {
  roel64: AccountData;
  roelPensioen64: AccountData;
  setAccountData: (
    account: AccountName,
    entries: AccountEntry[],
    transactions: Transaction[]
  ) => void;
  mergeAccountData: (
    account: AccountName,
    newEntries: AccountEntry[],
    newTransactions: Transaction[]
  ) => MergeResult;
  setPortfolioFreeCash: (account: AccountName, freeCash: number) => void;
  clearAccount: (account: AccountName) => void;
  getSummary: (account: AccountName) => AccountSummary | null;
  getAllHoldings: () => Holding[];
  getAllTransactions: () => Transaction[];
}

function hydrateFromStorage(account: AccountName): AccountData {
  const persisted = loadAccountData(account);
  if (!persisted) return { entries: [], transactions: [], loaded: false, portfolioFreeCash: null };
  return { ...persisted, loaded: true, portfolioFreeCash: persisted.portfolioFreeCash ?? null };
}

const emptyData: AccountData = { entries: [], transactions: [], loaded: false, portfolioFreeCash: null };

export const useAccountStore = create<AccountStoreState>((set, get) => ({
  roel64: hydrateFromStorage('Roel64'),
  roelPensioen64: hydrateFromStorage('RoelPensioen64'),

  setAccountData: (account, entries, transactions) => {
    saveAccountData(account, entries, transactions);
    set((state) => ({
      roel64: account === 'Roel64'
        ? { ...state.roel64, entries, transactions, loaded: true }
        : state.roel64,
      roelPensioen64: account === 'RoelPensioen64'
        ? { ...state.roelPensioen64, entries, transactions, loaded: true }
        : state.roelPensioen64,
    }));
  },

  mergeAccountData: (account, newEntries, newTransactions) => {
    const state = get();
    const existing = account === 'Roel64' ? state.roel64 : state.roelPensioen64;

    const entryHashes = new Set(existing.entries.map(hashAccountEntry));
    const txHashes = new Set(existing.transactions.map(hashTransaction));

    const addedEntries = newEntries.filter(e => !entryHashes.has(hashAccountEntry(e)));
    const addedTxs = newTransactions.filter(t => !txHashes.has(hashTransaction(t)));

    const mergedEntries = [...existing.entries, ...addedEntries];
    const mergedTxs = [...existing.transactions, ...addedTxs];

    saveAccountData(account, mergedEntries, mergedTxs);
    set((state) => ({
      roel64: account === 'Roel64'
        ? { ...state.roel64, entries: mergedEntries, transactions: mergedTxs, loaded: true }
        : state.roel64,
      roelPensioen64: account === 'RoelPensioen64'
        ? { ...state.roelPensioen64, entries: mergedEntries, transactions: mergedTxs, loaded: true }
        : state.roelPensioen64,
    }));

    return {
      newEntries: addedEntries.length,
      skippedEntries: newEntries.length - addedEntries.length,
      newTransactions: addedTxs.length,
      skippedTransactions: newTransactions.length - addedTxs.length,
    };
  },

  setPortfolioFreeCash: (account, freeCash) => {
    set((state) => ({
      roel64: account === 'Roel64'
        ? { ...state.roel64, portfolioFreeCash: freeCash, loaded: true }
        : state.roel64,
      roelPensioen64: account === 'RoelPensioen64'
        ? { ...state.roelPensioen64, portfolioFreeCash: freeCash, loaded: true }
        : state.roelPensioen64,
    }));
  },

  clearAccount: (account) => {
    saveAccountData(account, [], []);
    set((state) => ({
      roel64: account === 'Roel64' ? emptyData : state.roel64,
      roelPensioen64: account === 'RoelPensioen64' ? emptyData : state.roelPensioen64,
    }));
  },

  getSummary: (account) => {
    const { roel64, roelPensioen64 } = get();
    const data = account === 'Roel64' ? roel64 : roelPensioen64;
    if (!data.loaded) return null;
    const summary = computeAccountSummary(data.entries, account, data.transactions);
    if (data.portfolioFreeCash !== null) {
      return { ...summary, freeCash: data.portfolioFreeCash };
    }
    return summary;
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
