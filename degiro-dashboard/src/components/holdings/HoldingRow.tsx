import type { Holding } from '../../types/holding';
import { usePriceStore } from '../../store/usePriceStore';
import { useAccountStore } from '../../store/useAccountStore';
import { computeVolumeHistory } from '../../parsers/computeHoldings';
import { formatEuro, formatPct } from '../../utils/currency';
import { SparklineChart } from './SparklineChart';
import { VolumeChart } from './VolumeChart';
import { TrendBadge } from './TrendBadge';
import { Spinner } from '../ui/Spinner';

interface HoldingRowProps {
  holding: Holding;
}

export function HoldingRow({ holding }: HoldingRowProps) {
  const priceData = usePriceStore((s) => s.prices[holding.isin]);
  const getAllTransactions = useAccountStore((s) => s.getAllTransactions);
  const transactions = getAllTransactions();

  const volumeHistory = computeVolumeHistory(
    transactions,
    holding.isin,
    holding.account
  );

  const price = priceData?.currentPriceEUR ?? 0;
  const currentValue = price * holding.quantity;
  const profitLoss = currentValue - holding.totalCostEUR;
  const profitLossPct = holding.totalCostEUR > 0 ? profitLoss / holding.totalCostEUR : 0;
  const trend5Day = priceData?.trend5Day ?? 0;

  const isLoading = priceData?.loading ?? false;
  const hasPrice = price > 0;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      {/* Account */}
      <td className="px-4 py-3 text-xs font-medium">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
            holding.account === 'Roel64'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-violet-100 text-violet-700'
          }`}
        >
          {holding.account === 'Roel64' ? 'R64' : 'RP64'}
        </span>
      </td>

      {/* Product + ISIN */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-slate-800 leading-tight">{holding.product}</p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{holding.isin}</p>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
        {holding.quantity % 1 === 0
          ? holding.quantity.toFixed(0)
          : holding.quantity.toFixed(4)}
      </td>

      {/* GAK */}
      <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
        {formatEuro(holding.averageCostEUR)}
      </td>

      {/* Current Price */}
      <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
        {isLoading ? (
          <div className="flex justify-end"><Spinner size="sm" /></div>
        ) : hasPrice ? (
          formatEuro(price)
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Current Value */}
      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800 tabular-nums">
        {hasPrice ? formatEuro(currentValue) : <span className="text-slate-300">—</span>}
      </td>

      {/* P&L EUR */}
      <td
        className={`px-4 py-3 text-right text-sm font-medium tabular-nums ${
          profitLoss >= 0 ? 'text-green-700' : 'text-red-600'
        }`}
      >
        {hasPrice ? (
          `${profitLoss >= 0 ? '+' : ''}${formatEuro(profitLoss)}`
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* P&L % */}
      <td
        className={`px-4 py-3 text-right text-sm font-medium tabular-nums ${
          profitLossPct >= 0 ? 'text-green-700' : 'text-red-600'
        }`}
      >
        {hasPrice ? formatPct(profitLossPct) : <span className="text-slate-300">—</span>}
      </td>

      {/* 1Y Sparkline */}
      <td className="px-4 py-3">
        <SparklineChart data={priceData?.history1Y ?? []} />
      </td>

      {/* Volume */}
      <td className="px-4 py-3">
        <VolumeChart data={volumeHistory} />
      </td>

      {/* 5-day trend */}
      <td className="px-4 py-3">
        {hasPrice ? (
          <TrendBadge trend5Day={trend5Day} />
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
