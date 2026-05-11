import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useAccountStore } from '../../store/useAccountStore';
import { usePriceStore } from '../../store/usePriceStore';
import { computeHoldings } from '../../parsers/computeHoldings';
import { formatEuro, formatPct } from '../../utils/currency';

type FilterAccount = 'all' | 'Roel64' | 'RoelPensioen64';

interface PnlPerStockChartProps {
  filterAccount: FilterAccount;
}

interface StockPnl {
  product: string;
  productShort: string;
  isin: string;
  account: string;
  pnl: number;
  pnlPct: number;
  hasPrice: boolean;
  totalCostEUR: number;
}

export function PnlPerStockChart({ filterAccount }: PnlPerStockChartProps) {
  const roel64Transactions = useAccountStore((s) => s.roel64.transactions);
  const roelPensTransactions = useAccountStore((s) => s.roelPensioen64.transactions);
  const prices = usePriceStore((s) => s.prices);

  const holdings = useMemo(
    () => computeHoldings([...roel64Transactions, ...roelPensTransactions]),
    [roel64Transactions, roelPensTransactions]
  );

  const data: StockPnl[] = useMemo(() => {
    const filtered = filterAccount === 'all'
      ? holdings
      : holdings.filter((h) => h.account === filterAccount);

    return filtered
      .map((h) => {
        const priceData = prices[h.isin];
        const hasPrice = (priceData?.currentPriceEUR ?? 0) > 0;
        const currentValue = hasPrice ? priceData!.currentPriceEUR * h.quantity : 0;
        const pnl = hasPrice ? currentValue - h.totalCostEUR : 0;
        const pnlPct = hasPrice && h.totalCostEUR > 0 ? pnl / h.totalCostEUR : 0;
        return {
          product: h.product,
          productShort: h.product.length > 22 ? h.product.slice(0, 20) + '…' : h.product,
          isin: h.isin,
          account: h.account,
          pnl,
          pnlPct,
          hasPrice,
          totalCostEUR: h.totalCostEUR,
        };
      })
      .filter((d) => d.totalCostEUR > 0)
      .sort((a, b) => a.pnl - b.pnl);
  }, [holdings, prices, filterAccount]);

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-8 text-center text-slate-400 text-sm">
        Geen posities beschikbaar.
      </div>
    );
  }

  const allPricesLoaded = data.every((d) => d.hasPrice);
  const barHeight = 36;
  const chartHeight = Math.max(200, data.length * barHeight + 60);

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">P&L per aandeel</h2>
          <p className="text-xs text-slate-400 mt-0.5">Ongerealiseerde winst/verlies, gesorteerd laag naar hoog</p>
        </div>
        {!allPricesLoaded && (
          <span className="text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
            Koersen worden geladen…
          </span>
        )}
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatEuro(v)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              type="category"
              dataKey="productShort"
              width={160}
              tick={{ fontSize: 11, fill: '#475569' }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as StockPnl;
                return (
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow text-xs space-y-0.5">
                    <p className="font-medium text-slate-800">{d.product}</p>
                    <p className="text-slate-500">{d.account} · {d.isin}</p>
                    {d.hasPrice ? (
                      <p className={d.pnl >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {formatEuro(d.pnl)} ({formatPct(d.pnlPct)})
                      </p>
                    ) : (
                      <p className="text-amber-500">Koers nog niet geladen</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="pnl" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={!entry.hasPrice ? '#94a3b8' : entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                  fillOpacity={entry.hasPrice ? 0.85 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
