import { useState } from 'react';
import { UploadZone } from './UploadZone';
import type { AccountName } from '../../types/account';
import { parseAccountCsv } from '../../parsers/parseAccountCsv';
import { parseTransactionsCsv } from '../../parsers/parseTransactionsCsv';
import { useAccountStore } from '../../store/useAccountStore';
import type { MergeResult } from '../../store/useAccountStore';

interface AccountUploaderProps {
  account: AccountName;
  label: string;
  color: 'blue' | 'violet';
}

export function AccountUploader({ account, label, color }: AccountUploaderProps) {
  const mergeAccountData = useAccountStore((s) => s.mergeAccountData);

  const [accountFilename, setAccountFilename] = useState<string | null>(null);
  const [transactionsFilename, setTransactionsFilename] = useState<string | null>(null);
  const [accountCsvText, setAccountCsvText] = useState<string | null>(null);
  const [transactionsCsvText, setTransactionsCsvText] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  function tryParse(newAccountCsv: string | null, newTransactionsCsv: string | null) {
    if (!newAccountCsv || !newTransactionsCsv) return;
    try {
      const entries = parseAccountCsv(newAccountCsv, account);
      const transactions = parseTransactionsCsv(newTransactionsCsv, account);
      const result = mergeAccountData(account, entries, transactions);
      setMergeResult(result);
    } catch (e) {
      console.error('CSV parse error', e);
    }
  }

  function handleAccountFile(text: string, filename: string) {
    setAccountError(null);
    setMergeResult(null);
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
    setMergeResult(null);
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
      <div className={`${headerColor} px-5 py-3`}>
        <h3 className="font-semibold text-white">{label}</h3>
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
      {mergeResult && (
        <div className="px-4 pb-4 text-xs text-slate-500 space-y-0.5">
          <p>
            Transacties: <span className="text-green-600 font-medium">{mergeResult.newTransactions} nieuw</span>
            {mergeResult.skippedTransactions > 0 && (
              <span className="ml-1">· {mergeResult.skippedTransactions} al aanwezig</span>
            )}
          </p>
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
