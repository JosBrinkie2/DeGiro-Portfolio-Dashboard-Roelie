import { useState } from 'react';
import { UploadZone } from './UploadZone';
import type { AccountName } from '../../types/account';
import { parseAccountCsv } from '../../parsers/parseAccountCsv';
import { useAccountStore } from '../../store/useAccountStore';
import type { MergeResult } from '../../store/useAccountStore';

interface AccountUploaderProps {
  account: AccountName;
  label: string;
  color: 'blue' | 'violet';
}

const ACCOUNT_KEY: Record<AccountName, 'roel64' | 'roelPensioen64'> = {
  Roel64: 'roel64',
  RoelPensioen64: 'roelPensioen64',
};

export function AccountUploader({ account, label, color }: AccountUploaderProps) {
  const mergeAccountData = useAccountStore((s) => s.mergeAccountData);
  const clearAccount = useAccountStore((s) => s.clearAccount);
  const loaded = useAccountStore((s) => s[ACCOUNT_KEY[account]].loaded);

  const [accountFilename, setAccountFilename] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  function handleAccountFile(text: string, filename: string) {
    setAccountError(null);
    setMergeResult(null);
    try {
      const entries = parseAccountCsv(text, account);
      const result = mergeAccountData(account, entries);
      setAccountFilename(filename);
      setMergeResult(result);
    } catch (e) {
      console.error('CSV parse error', e);
      setAccountError('Ongeldig rekeningoverzicht (Account.csv)');
    }
  }

  function handleClear() {
    clearAccount(account);
    setAccountFilename(null);
    setMergeResult(null);
  }

  const headerColor = color === 'blue'
    ? 'bg-blue-600'
    : 'bg-violet-600';

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className={`${headerColor} px-5 py-3`}>
        <h3 className="font-semibold text-white">{label}</h3>
      </div>
      <div className="p-4">
        <UploadZone
          label="Account.csv (rekeningoverzicht)"
          onFileLoaded={handleAccountFile}
          loaded={!!accountFilename}
          loadedFilename={accountFilename ?? undefined}
          error={accountError}
        />
      </div>
      {loaded && (
        <div className="px-4 pt-1 pb-3 flex justify-end">
          <button
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 transition"
          >
            Wis data
          </button>
        </div>
      )}
      {mergeResult && (
        <div className="px-4 pb-4 text-xs text-slate-500">
          <p>
            Mutaties: <span className="text-green-600 font-medium">{mergeResult.newEntries} nieuw</span>
            {mergeResult.skippedEntries > 0 && (
              <span className="ml-1">· {mergeResult.skippedEntries} al aanwezig</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
