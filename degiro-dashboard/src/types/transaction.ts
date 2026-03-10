import type { AccountName } from './account';

export interface Transaction {
  date: Date;
  product: string;
  isin: string;
  exchange: string;
  quantity: number; // positive = buy, negative = sell
  priceCurrency: string;
  priceAmount: number;
  valueEUR: number;
  totalEUR: number; // authoritative cost including fees
  account: AccountName;
}
