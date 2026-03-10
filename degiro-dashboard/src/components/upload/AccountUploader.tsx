import { useState } from 'react';
import { UploadZone } from './UploadZone';
import type { AccountName } from '../../types/account';
import { parseAccountCsv } from '../../parsers/parseAccountCsv';
import { parseTransactionsCsv } from '../../parsers/parseTransactionsCsv';
import { useAccountStore } from '../../store/useAccountStore';

interface AccountUploaderProps {
  account: AccountName;
  label: string;
  color: 'blue' | 'violet';
}

export function AccountUploader({ account, label, color }: AccountUploaderProps) {
  const setAccountData = useAccountStore((s) => s.setAccountData);
  const clearAccount = useAccountStore((s) => s.clearAccount);
  const isLoaded = useAccountStore((s) =>
    account === 'Roel64' ? s.roel64.loaded : s.roelPensioen64.loaded
  );

  const [accountFilename, setAccountFilename] = useState<string | null>(null);
  const [transactionsFilename, setTransactionsFilename] = useState<string | null>(null);
  const [accountCsvText, setAccountCsvText] = useState<string | null>(null);
  const [transactionsCsvText, setTransactionsCsvText] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  function tryParse(newAccountCsv: string | null, newTransactionsCsv: string | null) {
    if (!newAccountCsv || !newTransactionsCsv) return;
    try {
      const entries = parseAccountCsv(newAccountCsv, account);
      const transactions = parseTransactionsCsv(newTransactionsCsv, account);
      setAccountData(account, entries, transactions);
    } catch (e) {
      console.error('CSV parse error', e);
    }
  }

  function handleAccountFile(text: string, filename: string) {
    setAccountError(null);
    try {
      parseAccountCsv(text, account); // validate
      setAccountCsvText(text);
      setAccountFilename(filename);
      tryParse(text, transactionsCsvText);
    } catch {
      setAccountError('Ongeldig account.csv bestand');
    }
  }

  function handleTransactionsFile(text: string, filename: string) {
    setTransactionsError(null);
    try {
      parseTransactionsCsv(text, account); // validate
      setTransactionsCsvText(text);
      setTransactionsFilename(filename);
      tryParse(accountCsvText, text);
    } catch {
      setTransactionsError('Ongeldig transactions.csv bestand');
    }
  }

  const headerColor = color === 'blue'
    ? 'bg-blue-600'
    : 'bg-violet-600';

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className={`${headerColor} px-5 py-3 flex items-center justify-between`}>
        <h3 className="font-semibold text-white">{label}</h3>
        {isLoaded && (
          <button
            onClick={() => {
              clearAccount(account);
              setAccountCsvText(null);
              setTransactionsCsvText(null);
              setAccountFilename(null);
              setTransactionsFilename(null);
            }}
            className="text-xs text-white/70 hover:text-white underline"
          >
            Verwijderen
          </button>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UploadZone
          label="account.csv"
          onFileLoaded={handleAccountFile}
          loaded={!!accountFilename}
          loadedFilename={accountFilename ?? undefined}
          error={accountError}
        />
        <UploadZone
          label="transactions.csv"
          onFileLoaded={handleTransactionsFile}
          loaded={!!transactionsFilename}
          loadedFilename={transactionsFilename ?? undefined}
          error={transactionsError}
        />
      </div>
    </div>
  );
}
