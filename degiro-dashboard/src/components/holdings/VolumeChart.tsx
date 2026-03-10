import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import type { VolumePoint } from '../../types/holding';
import { formatEuroCompact } from '../../utils/currency';

interface VolumeChartProps {
  data: VolumePoint[];
  width?: number;
  height?: number;
}

export function VolumeChart({ data, width = 80, height = 32 }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-slate-300"
      >
        —
      </div>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="volume" fill="#94a3b8" radius={[1, 1, 0, 0]} isAnimationActive={false} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload as VolumePoint;
            return (
              <div className="rounded bg-slate-800 px-2 py-1 text-xs text-white shadow">
                <p>{item.label}</p>
                <p>{formatEuroCompact(item.volume)}</p>
              </div>
            );
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
