import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BankAccount } from '../types/bank';

interface BankStoreState {
  accounts: BankAccount[];
  addAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateAccount: (id: string, data: Partial<Omit<BankAccount, 'id'>>) => void;
  deleteAccount: (id: string) => void;
}

export const useBankStore = create<BankStoreState>()(
  persist(
    (set) => ({
      accounts: [],

      addAccount: (data) =>
        set((state) => ({
          accounts: [
            ...state.accounts,
            { ...data, id: crypto.randomUUID() },
          ],
        })),

      updateAccount: (id, data) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        })),

      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
    }),
    { name: 'bank-accounts' }
  )
);
