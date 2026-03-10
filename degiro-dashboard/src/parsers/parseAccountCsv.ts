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
} as const;

function detectEntryType(omschrijving: string): AccountEntry['entryType'] {
  const lower = omschrijving.toLowerCase().trim();
  // Dutch: "Storting", "iDEAL storting"; English: "iDEAL Deposit"
  if (lower === 'storting' || lower.includes('ideal deposit') || lower.includes('ideal storting')) return 'deposit';
  // Dutch: "Terugboeking"; English: "Processed Flatex Withdrawal", "flatex terugstorting"
  if (lower === 'terugboeking' || lower.includes('withdrawal') || lower === 'flatex terugstorting') return 'withdrawal';
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
      account,
    }));
}
