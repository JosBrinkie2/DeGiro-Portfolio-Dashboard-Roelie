import type { AccountEntry } from '../types/account';
import type { Transaction } from '../types/transaction';

/**
 * Reconstruct buy/sell transactions from a DeGiro account ledger.
 *
 * The account CSV records every trade as a "Koop X @ Y CUR" / "Verkoop X @ Y CUR" line
 * (with Product + ISIN), linked via the Order Id column to its fee line
 * ("DEGIRO Transactiekosten...") and, for FX trades, to "Valuta Debitering" (EUR) /
 * "Valuta Creditering" (foreign) lines. The EUR cost (incl. fees) of a trade therefore
 * equals the absolute net EUR cash movement of its Order Id group — which works for both
 * EUR and foreign-currency trades without needing FX rates.
 *
 * Produces Transaction[] compatible with computeHoldings/computeVolumeHistory, so the
 * existing holdings/GAK/volume/history math is reused unchanged.
 */

// "Koop 11 @ 40,15 EUR" / "Verkoop 400 @ 2,5835 EUR" (also USD, and "STOCK DIVIDEND: Koop 1 @ 0 EUR")
const TRADE_RE = /(Koop|Verkoop)\s+([\d.,]+)\s+@\s+([\d.,]+)\s+([A-Z]{3})/i;

function parseDutchNum(s: string): number {
  const cleaned = s.trim().replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

interface ParsedTrade {
  direction: 'Koop' | 'Verkoop';
  quantity: number; // unsigned
  price: number;
  currency: string;
}

function parseTrade(description: string): ParsedTrade | null {
  // Money-market-fund sweeps ("Conversie geldmarktfonds: Koop ...") also match the trade
  // pattern but are cash management, not holdings — exclude them.
  if (description.toLowerCase().includes('geldmarktfonds')) return null;
  const m = TRADE_RE.exec(description);
  if (!m) return null;
  return {
    direction: m[1].toLowerCase() === 'koop' ? 'Koop' : 'Verkoop',
    quantity: parseDutchNum(m[2]),
    price: parseDutchNum(m[3]),
    currency: m[4].toUpperCase(),
  };
}

function eurSum(group: AccountEntry[], predicate: (e: AccountEntry) => boolean): number {
  return group
    .filter((e) => e.mutationCurrency === 'EUR' && predicate(e))
    .reduce((sum, e) => sum + e.mutationAmount, 0);
}

/**
 * Convert one Order Id group (or a single corporate-action row) into transactions.
 * The group's total EUR cost and fees are allocated across its trade legs; with a single
 * leg (the normal case) the whole group cost is attributed to it. Multi-leg groups split
 * proportionally by |qty × price| — exact for single-currency orders, approximate for the
 * rare multi-currency multi-leg order.
 */
function transactionsForGroup(group: AccountEntry[]): Transaction[] {
  const legs = group
    .map((e) => ({ entry: e, trade: parseTrade(e.description) }))
    .filter((l): l is { entry: AccountEntry; trade: ParsedTrade } => l.trade !== null);

  if (legs.length === 0) return [];

  const totalEUR = Math.abs(eurSum(group, () => true));
  const feeEUR = Math.abs(
    eurSum(group, (e) => e.description.toLowerCase().includes('transactiekosten')),
  );

  const weights = legs.map((l) => Math.abs(l.trade.quantity * l.trade.price));
  const weightSum = weights.reduce((s, w) => s + w, 0);

  return legs.map((l, i) => {
    const share = weightSum > 0 ? weights[i] / weightSum : 1 / legs.length;
    const legTotal = totalEUR * share;
    const legFee = feeEUR * share;
    // Trade value excluding fees. Buys: cost − fee. Sells: proceeds + fee.
    const rawValue = l.trade.direction === 'Koop' ? legTotal - legFee : legTotal + legFee;

    return {
      date: l.entry.date,
      product: l.entry.product,
      isin: l.entry.isin,
      exchange: '', // not present in the account ledger
      quantity: l.trade.direction === 'Koop' ? l.trade.quantity : -l.trade.quantity,
      priceCurrency: l.trade.currency,
      priceAmount: l.trade.price,
      valueEUR: Math.max(rawValue, 0),
      totalEUR: legTotal,
      account: l.entry.account,
    };
  });
}

export function deriveTransactionsFromAccount(entries: AccountEntry[]): Transaction[] {
  // Group rows that share a non-empty Order Id so a trade's fee/FX legs are co-located.
  const groupsByOrderId = new Map<string, AccountEntry[]>();
  // Rows without an Order Id (STOCK DIVIDEND / CLAIMEMISSIE corporate actions, 0-cost):
  // each is its own singleton group. computeHoldings treats totalEUR===0 as a split.
  const orderlessRows: AccountEntry[] = [];

  for (const e of entries) {
    if (e.orderId) {
      const g = groupsByOrderId.get(e.orderId);
      if (g) g.push(e);
      else groupsByOrderId.set(e.orderId, [e]);
    } else {
      orderlessRows.push(e);
    }
  }

  const transactions: Transaction[] = [];
  for (const group of groupsByOrderId.values()) {
    transactions.push(...transactionsForGroup(group));
  }
  for (const row of orderlessRows) {
    transactions.push(...transactionsForGroup([row]));
  }

  return transactions;
}
