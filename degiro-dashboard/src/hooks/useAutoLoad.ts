import { useEffect, useRef } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { parseAccountCsv } from '../parsers/parseAccountCsv';
import { parseTransactionsCsv } from '../parsers/parseTransactionsCsv';
import type { AccountName } from '../types/account';

const ACCOUNTS: Array<{ name: AccountName; accountFile: string; transactionsFile: string }> = [
  {
    name: 'Roel64',
    accountFile: 'Roel64_Account.csv',
    transactionsFile: 'Roel64_Transactions.csv',
  },
  {
    name: 'RoelPensioen64',
    accountFile: 'RoelPensioen64_Account.csv',
    transactionsFile: 'RoelPensioen64_Transactions.csv',
  },
];

export function useAutoLoad() {
  const mergeAccountData = useAccountStore((s) => s.mergeAccountData);
  const roel64Loaded = useAccountStore((s) => s.roel64.loaded);
  const roelPensLoaded = useAccountStore((s) => s.roelPensioen64.loaded);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (roel64Loaded && roelPensLoaded) return;
    didRun.current = true;

    const base = import.meta.env.BASE_URL;

    for (const account of ACCOUNTS) {
      (async () => {
        try {
          const [accountRes, txRes] = await Promise.all([
            fetch(`${base}data/${account.accountFile}`),
            fetch(`${base}data/${account.transactionsFile}`),
          ]);
          if (!accountRes.ok || !txRes.ok) return;

          const [accountText, txText] = await Promise.all([
            accountRes.text(),
            txRes.text(),
          ]);

          const entries = parseAccountCsv(accountText, account.name);
          const transactions = parseTransactionsCsv(txText, account.name);
          mergeAccountData(account.name, entries, transactions);
        } catch {
          // silently skip — user can upload manually
        }
      })();
    }
  }, [roel64Loaded, roelPensLoaded, mergeAccountData]);
}
