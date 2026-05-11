import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { PortfolioSnapshot } from '../../types/portfolio';
import { formatEuro, formatEuroCompact } from '../../utils/currency';

type FilterAccount = 'all' | 'Roel64' | 'RoelPensioen64';

interface PnlOverTimeChartProps {
  snapshots: PortfolioSnapshot[];
  filterAccount: FilterAccount;
}

export function PnlOverTimeChart({ snapshots, filterAccount }: PnlOverTimeChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-8 text-center text-slate-400 text-sm">
        Geen data beschikbaar.
      </div>
    );
  }

  const showRoel64 = filterAccount === 'all' || filterAccount === 'Roel64';
  const showPensioen = filterAccount === 'all' || filterAccount === 'RoelPensioen64';
  const showTotal = filterAccount === 'all';

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">P&L over tijd</h2>
        <p className="text-xs text-slate-400 mt-0.5">Ongerealiseerde winst/verlies per periode</p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={snapshots}
            margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradPnlRoel64" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradPnlPensioen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradPnlTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tickFormatter={(v: number) => formatEuroCompact(v)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} />
            <Tooltip
              formatter={(value, name) => {
                const label =
                  name === 'pnlRoel64'
                    ? 'Roel64'
                    : name === 'pnlRoelPensioen64'
                    ? 'RoelPensioen64'
                    : 'Totaal';
                return [formatEuro(Number(value)), label];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend
              formatter={(value) =>
                value === 'pnlRoel64'
                  ? 'Roel64'
                  : value === 'pnlRoelPensioen64'
                  ? 'RoelPensioen64'
                  : 'Totaal'
              }
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            {showTotal && (
              <Area
                type="monotone"
                dataKey="totalPnl"
                stroke="#10b981"
                fill="url(#gradPnlTotal)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
            {showRoel64 && (
              <Area
                type="monotone"
                dataKey="pnlRoel64"
                stroke="#3b82f6"
                fill="url(#gradPnlRoel64)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
            {showPensioen && (
              <Area
                type="monotone"
                dataKey="pnlRoelPensioen64"
                stroke="#8b5cf6"
                fill="url(#gradPnlPensioen)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
