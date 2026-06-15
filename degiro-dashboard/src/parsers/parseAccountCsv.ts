import Papa from 'papaparse';
import type { AccountEntry, AccountName } from '../types/account';
import { parseDutchNumber } from '../utils/currency';
import { parseDutchDate } from '../utils/dates';

// account.csv column indices (0-based):
// 0=Datum, 1=Tijd, 2=Valutadatum, 3=Product, 4=ISIN, 5=Omschrijving,
// 6=FX, 7=Mutatie(currency), 8=Mutatie(amount), 9=Saldo(currency),
// 10=Saldo(amount), 11=Order Id

const COL = {
  DATUM: 0,
  PRODUCT: 3,
  ISIN: 4,
  OMSCHRIJVING: 5,
  MUTATIE_CURRENCY: 7,
  MUTATIE_AMOUNT: 8,
  SALDO_CURRENCY: 9,
  SALDO_AMOUNT: 10,
  ORDER_ID: 11,
} as const;

function detectEntryType(omschrijving: string): AccountEntry['entryType'] {
  const lower = omschrijving.toLowerCase().trim();
  // Withdrawals first. Dutch: "Terugboeking", "flatex terugstorting";
  // English: "Processed Flatex Withdrawal".
  if (lower.includes('terugboeking') || lower.includes('terugstorting') || lower.includes('withdrawal')) {
    return 'withdrawal';
  }
  // Deposits. Dutch: "Storting", "flatex Storting", "iDEAL storting"; English: "iDEAL Deposit".
  // Exclude "terugstorting" (already handled above) from the broad "storting" match.
  if (lower.includes('storting') || lower.includes('deposit')) return 'deposit';
  return 'other';
}

export function parseAccountCsv(csvText: string, account: AccountName): AccountEntry[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  // Skip header row (index 0)
  const rows = result.data.slice(1) as string[][];

  return rows
    .filter((row) => row.length > COL.SALDO_AMOUNT)
    .map((row): AccountEntry => ({
      date: parseDutchDate(row[COL.DATUM]),
      product: row[COL.PRODUCT] ?? '',
      isin: row[COL.ISIN] ?? '',
      description: row[COL.OMSCHRIJVING] ?? '',
      entryType: detectEntryType(row[COL.OMSCHRIJVING] ?? ''),
      mutationCurrency: row[COL.MUTATIE_CURRENCY] ?? '',
      mutationAmount: parseDutchNumber(row[COL.MUTATIE_AMOUNT]),
      balanceCurrency: row[COL.SALDO_CURRENCY] ?? '',
      balanceAmount: parseDutchNumber(row[COL.SALDO_AMOUNT]),
      orderId: (row[COL.ORDER_ID] ?? '').trim(),
      account,
    }));
}
