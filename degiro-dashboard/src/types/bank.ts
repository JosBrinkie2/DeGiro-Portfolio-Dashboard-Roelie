export type AccountType = 'lopende' | 'spaar' | 'beleggersrekening';

export interface BankAccount {
  id: string;
  datum: string; // ISO date string
  bank: string;
  bankrekeningnummer: string;
  typeRekening: AccountType | string;
  bedrag: number;
}
