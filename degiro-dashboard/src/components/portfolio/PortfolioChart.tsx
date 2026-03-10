import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePortfolioHistory } from '../../hooks/usePortfolioHistory';
import { formatEuroCompact } from '../../utils/currency';
import { Spinner } from '../ui/Spinner';

export function PortfolioChart() {
  const snapshots = usePortfolioHistory();

  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-8 text-center text-slate-400">
        <Spinner />
        <p className="mt-3 text-sm">Geen data beschikbaar. Upload CSV bestanden en wacht tot koersen geladen zijn.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Waardeontwikkeling over tijd</h2>
        <p className="text-xs text-slate-400 mt-0.5">Per kwartaal, gestapeld per rekening</p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart
            data={snapshots}
            margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradRoel64" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gradPensioen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
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
            <Tooltip
              formatter={(value, name) => [
                formatEuroCompact(Number(value)),
                name === 'valueRoel64' ? 'Roel64' : 'RoelPensioen64',
              ]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value) =>
                value === 'valueRoel64' ? 'Roel64' : 'RoelPensioen64'
              }
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="valueRoel64"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#gradRoel64)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="valueRoelPensioen64"
              stackId="1"
              stroke="#8b5cf6"
              fill="url(#gradPensioen)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
