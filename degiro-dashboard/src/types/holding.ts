import type { AccountName } from './account';

export interface PricePoint {
  date: string; // ISO date string
  close: number;
}

export interface VolumePoint {
  period: string; // e.g. "2024-B0" (bi-monthly bucket)
  label: string;  // human-readable label e.g. "Jan-Feb 2024"
  volume: number;
}

export interface Holding {
  isin: string;
  product: string;
  account: AccountName;
  quantity: number;
  averageCostEUR: number; // GAK
  totalCostEUR: number;
}

export interface HoldingWithPrice extends Holding {
  currentPriceEUR: number;
  currentValueEUR: number;
  profitLossEUR: number;
  profitLossPct: number;
  priceHistory1Y: PricePoint[];
  volumeHistory: VolumePoint[];
  trend5Day: number; // % change over last 5 trading days
  loading: boolean;
}
