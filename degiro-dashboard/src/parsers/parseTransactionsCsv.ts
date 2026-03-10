import Papa from 'papaparse';
import type { Transaction } from '../types/transaction';
import type { AccountName } from '../types/account';
import { parseDutchNumber } from '../utils/currency';
import { parseDutchDate } from '../utils/dates';

// transactions.csv column indices (0-based):
// 0=Datum, 1=Tijd, 2=Product, 3=ISIN, 4=Beurs, 5=Uitvoeringsplaats,
// 6=Aantal, 7=Koers(currency), 8=Koers(amount), 9=LokaleWaarde(currency),
// 10=LokaleWaarde(amount), 11=WaardeEUR, 12=Wisselkoers,
// 13=AutoFXKosten, 14=Transactiekosten, 15=TotaalEUR, 16=Order ID

const COL = {
  DATUM: 0,
  PRODUCT: 2,
  ISIN: 3,
  BEURS: 4,
  AANTAL: 6,
  KOERS_CURRENCY: 7,
  KOERS_AMOUNT: 8,
  WAARDE_EUR: 11,
  TOTAAL_EUR: 15,
} as const;

export function parseTransactionsCsv(csvText: string, account: AccountName): Transaction[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  // Skip header row
  const rows = result.data.slice(1) as string[][];

  return rows
    .filter((row) => row.length > COL.TOTAAL_EUR)
    .map((row): Transaction => ({
      date: parseDutchDate(row[COL.DATUM]),
      product: row[COL.PRODUCT] ?? '',
      isin: row[COL.ISIN] ?? '',
      exchange: row[COL.BEURS] ?? '',
      quantity: parseDutchNumber(row[COL.AANTAL]),
      priceCurrency: row[COL.KOERS_CURRENCY] ?? '',
      priceAmount: parseDutchNumber(row[COL.KOERS_AMOUNT]),
      valueEUR: parseDutchNumber(row[COL.WAARDE_EUR]),
      totalEUR: parseDutchNumber(row[COL.TOTAAL_EUR]),
      account,
    }));
}
