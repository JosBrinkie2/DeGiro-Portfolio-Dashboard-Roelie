import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  trend5Day: number; // as a decimal, e.g. 0.05 = +5%
}

export function TrendBadge({ trend5Day }: TrendBadgeProps) {
  const pct = trend5Day * 100;

  const isStronglyPositive = pct > 10;
  const isStronglyNegative = pct < -10;
  const isPositive = pct > 0;
  const isNegative = pct < 0;

  const label = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        {
          'bg-green-100 text-green-800': isStronglyPositive,
          'bg-green-50 text-green-700': isPositive && !isStronglyPositive,
          'bg-red-100 text-red-800': isStronglyNegative,
          'bg-red-50 text-red-700': isNegative && !isStronglyNegative,
          'bg-slate-100 text-slate-600': !isPositive && !isNegative,
        }
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNegative ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
