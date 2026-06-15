import { useEffect, useRef } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { parseAccountCsv } from '../parsers/parseAccountCsv';
import { parseTransactionsCsv } from '../parsers/parseTransactionsCsv';
import { parsePortfolioCsv } from '../parsers/parsePortfolioCsv';
import type { AccountName } from '../types/account';

const ACCOUNTS: Array<{ name: AccountName; accountFile: string; transactionsFile: string; portfolioFile: string }> = [
  {
    name: 'Roel64',
    accountFile: 'Roel64_Account.csv',
    transactionsFile: 'Roel64_Transactions.csv',
    portfolioFile: 'Roel64_Portfolio.csv',
  },
  {
    name: 'RoelPensioen64',
    accountFile: 'RoelPensioen64_Account.csv',
    transactionsFile: 'RoelPensioen64_Transactions.csv',
    portfolioFile: 'RoelPensioen64_Portfolio.csv',
  },
];

export function useAutoLoad() {
  const mergeAccountData = useAccountStore((s) => s.mergeAccountData);
  const setPortfolioFreeCash = useAccountStore((s) => s.setPortfolioFreeCash);
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
          const [accountRes, txRes, portfolioRes] = await Promise.all([
            fetch(`${base}data/${account.accountFile}`),
            fetch(`${base}data/${account.transactionsFile}`),
            fetch(`${base}data/${account.portfolioFile}`),
          ]);

          const [accountText, txText] = await Promise.all([
            accountRes.ok ? accountRes.text() : Promise.resolve(null),
            txRes.ok ? txRes.text() : Promise.resolve(null),
          ]);

          if (accountText && txText) {
            const entries = parseAccountCsv(accountText, account.name);
            const transactions = parseTransactionsCsv(txText, account.name);
            mergeAccountData(account.name, entries, transactions);
          }

          if (portfolioRes.ok) {
            const portfolioText = await portfolioRes.text();
            const { freeCash } = parsePortfolioCsv(portfolioText);
            setPortfolioFreeCash(account.name, freeCash);
          }
        } catch {
          // silently skip — user can upload manually
        }
      })();
    }
  }, [roel64Loaded, roelPensLoaded, mergeAccountData, setPortfolioFreeCash]);
}
