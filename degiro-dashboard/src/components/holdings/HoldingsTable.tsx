import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Holding } from '../../types/holding';
import type { AccountName } from '../../types/account';
import { useAccountStore } from '../../store/useAccountStore';
import { usePriceStore } from '../../store/usePriceStore';
import { formatEuro } from '../../utils/currency';
import { getCachedFxRate } from '../../services/yahooFinance';
import { HoldingRow } from './HoldingRow';

type SortKey = 'product' | 'quantity' | 'averageCostEUR' | 'currentValue' | 'profitLossPct' | 'account';

function SortHeader({
  label,
  sortKey,
  current,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === sortKey;
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-slate-700 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {align === 'right' && active && (
          direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
        {label}
        {align === 'left' && active && (
          direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </span>
    </th>
  );
}

export function HoldingsTable() {
  const getAllHoldings = useAccountStore((s) => s.getAllHoldings);
  const prices = usePriceStore((s) => s.prices);

  const [filterAccount, setFilterAccount] = useState<AccountName | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const holdings = getAllHoldings();

  // Re-read from module-level cache; prices subscription drives re-renders when it's populated
  const usdFxRate = getCachedFxRate('USD'); // units of USD per 1 EUR, e.g. 1.08
  const usdToEur = usdFxRate ? (1 / usdFxRate) : null;

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function getSortValue(h: Holding): number | string {
    switch (sortKey) {
      case 'product': return h.product;
      case 'account': return h.account;
      case 'quantity': return h.quantity;
      case 'averageCostEUR': return h.averageCostEUR;
      case 'currentValue': return (prices[h.isin]?.currentPriceEUR ?? 0) * h.quantity;
      case 'profitLossPct': {
        const price = prices[h.isin]?.currentPriceEUR ?? 0;
        const value = price * h.quantity;
        return h.totalCostEUR > 0 ? (value - h.totalCostEUR) / h.totalCostEUR : 0;
      }
      default: return 0;
    }
  }

  const filtered = holdings.filter(
    (h) => filterAccount === 'all' || h.account === filterAccount
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = getSortValue(a);
    const vb = getSortValue(b);
    let cmp = 0;
    if (typeof va === 'string' && typeof vb === 'string') {
      cmp = va.localeCompare(vb);
    } else {
      cmp = (va as number) - (vb as number);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Totals row
  const totalCost = sorted.reduce((s, h) => s + h.totalCostEUR, 0);
  const totalValue = sorted.reduce(
    (s, h) => s + (prices[h.isin]?.currentPriceEUR ?? 0) * h.quantity,
    0
  );
  const totalPnl = totalValue - totalCost;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-800">Portefeuille posities</h2>
          {usdToEur !== null && (
            <span className="text-xs text-slate-400 tabular-nums">
              1 USD = {usdToEur.toFixed(4)} EUR
            </span>
          )}
        </div>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value as AccountName | 'all')}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">Alle rekeningen</option>
          <option value="Roel64">Roel64</option>
          <option value="RoelPensioen64">RoelPensioen64</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <SortHeader label="Rekening" sortKey="account" current={sortKey} direction={sortDir} onSort={handleSort} />
              <SortHeader label="Product" sortKey="product" current={sortKey} direction={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Beurs</th>
              <SortHeader label="Aantal" sortKey="quantity" current={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="GAK" sortKey="averageCostEUR" current={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Huidige koers</th>
              <SortHeader label="Waarde" sortKey="currentValue" current={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">P&L €</th>
              <SortHeader label="P&L %" sortKey="profitLossPct" current={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">1J grafiek</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Volume</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">5d trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Geen posities gevonden. Upload CSV bestanden om te beginnen.
                </td>
              </tr>
            ) : (
              sorted.map((h) => (
                <HoldingRow key={`${h.account}-${h.isin}`} holding={h} />
              ))
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Totaal ({sorted.length} posities)
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-slate-800 tabular-nums">
                  {totalValue > 0 ? formatEuro(totalValue) : '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${
                    totalPnl >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {totalValue > 0
                    ? `${totalPnl >= 0 ? '+' : ''}${formatEuro(totalPnl)}`
                    : '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${
                    totalPnl >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {totalValue > 0 && totalCost > 0
                    ? `${totalPnl >= 0 ? '+' : ''}${((totalPnl / totalCost) * 100).toFixed(2)}%`
                    : '—'}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
