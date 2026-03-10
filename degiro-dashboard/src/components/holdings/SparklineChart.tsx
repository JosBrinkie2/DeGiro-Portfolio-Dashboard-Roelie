import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { PricePoint } from '../../types/holding';

interface SparklineChartProps {
  data: PricePoint[];
  width?: number;
  height?: number;
}

export function SparklineChart({ data, width = 100, height = 32 }: SparklineChartProps) {
  if (data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-slate-300"
      >
        —
      </div>
    );
  }

  const isPositive = data[data.length - 1].close >= data[0].close;
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
