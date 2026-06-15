import { useEffect, useRef } from 'react';
import { useAccountStore } from '../store/useAccountStore';
import { parseAccountCsv } from '../parsers/parseAccountCsv';
import type { AccountName } from '../types/account';

const ACCOUNTS: Array<{ name: AccountName; accountFile: string }> = [
  { name: 'Roel64', accountFile: 'Roel64_Account.csv' },
  { name: 'RoelPensioen64', accountFile: 'RoelPensioen64_Account.csv' },
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
          const accountRes = await fetch(`${base}data/${account.accountFile}`);
          if (!accountRes.ok) return;
          const accountText = await accountRes.text();
          const entries = parseAccountCsv(accountText, account.name);
          mergeAccountData(account.name, entries);
        } catch {
          // silently skip — user can upload manually
        }
      })();
    }
  }, [roel64Loaded, roelPensLoaded, mergeAccountData]);
}
