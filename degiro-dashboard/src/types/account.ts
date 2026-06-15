export type AccountName = 'Roel64' | 'RoelPensioen64';

export interface AccountEntry {
  date: Date;
  product: string;
  isin: string;
  description: string;
  entryType: 'deposit' | 'withdrawal' | 'other';
  mutationCurrency: string;
  mutationAmount: number;
  balanceCurrency: string;
  balanceAmount: number;
  orderId: string;
  account: AccountName;
}

export interface AccountSummary {
  account: AccountName;
  totalGestort: number;
  totalTerugboekingen: number;
  nettoInleg: number;
  freeCash: number;
  currentPortfolioValue: number;
}
