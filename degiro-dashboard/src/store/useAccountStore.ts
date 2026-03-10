import { create } from 'zustand';
import type { AccountEntry, AccountName, AccountSummary } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { Holding } from '../types/holding';
import { computeHoldings } from '../parsers/computeHoldings';
import { computeAccountSummary } from '../parsers/computeAccountSummary';

interface AccountData {
  entries: AccountEntry[];
  transactions: Transaction[];
  loaded: boolean;
}

interface AccountStoreState {
  roel64: AccountData;
  roelPensioen64: AccountData;
  setAccountData: (
    account: AccountName,
    entries: AccountEntry[],
    transactions: Transaction[]
  ) => void;
  clearAccount: (account: AccountName) => void;
  getSummary: (account: AccountName) => AccountSummary | null;
  getAllHoldings: () => Holding[];
  getAllTransactions: () => Transaction[];
}

const emptyData: AccountData = { entries: [], transactions: [], loaded: false };

export const useAccountStore = create<AccountStoreState>((set, get) => ({
  roel64: emptyData,
  roelPensioen64: emptyData,

  setAccountData: (account, entries, transactions) => {
    set((state) => ({
      roel64: account === 'Roel64'
        ? { entries, transactions, loaded: true }
        : state.roel64,
      roelPensioen64: account === 'RoelPensioen64'
        ? { entries, transactions, loaded: true }
        : state.roelPensioen64,
    }));
  },

  clearAccount: (account) => {
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
