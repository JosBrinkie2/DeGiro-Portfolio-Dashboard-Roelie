export interface PortfolioSnapshot {
  date: string;   // ISO date (quarter end)
  quarter: string; // e.g. "Q1 2024"
  valueRoel64: number;
  valueRoelPensioen64: number;
  totalValue: number;
}
