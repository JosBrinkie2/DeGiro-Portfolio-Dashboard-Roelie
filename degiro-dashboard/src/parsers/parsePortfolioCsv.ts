import Papa from 'papaparse';
import { parseDutchNumber } from '../utils/currency';

// Portfolio CSV (DeGiro "Portefeuille" export) column indices (0-based):
// 0=Product, 1=Symbool/ISIN, 2=Aantal, 3=Slotkoers, 4=LokaleWaarde(currency),
// 5=LokaleWaarde(amount), 6=WaardeInEUR

const CASH_PRODUCT_PREFIX = 'CASH & CASH FUND';

/**
 * Parse a DeGiro Portefeuille CSV and return the available cash balance.
 * The cash row is identified by a product name starting with "CASH & CASH FUND".
 */
export function parsePortfolioCsv(csvText: string): { freeCash: number } {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data.slice(1) as string[][];

  for (const row of rows) {
    const product = (row[0] ?? '').trim();
    if (product.toUpperCase().startsWith(CASH_PRODUCT_PREFIX)) {
      // WaardeInEUR is at index 6 (last meaningful column)
      const freeCash = parseDutchNumber(row[6]);
      return { freeCash };
    }
  }

  return { freeCash: 0 };
}
