import { useState } from 'react';
import { TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { AccountSummary } from '../../types/account';
import { formatEuro } from '../../utils/currency';
import { Spinner } from '../ui/Spinner';

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconColor: string;
}

function Metric({ icon, label, value, sub, iconColor }: MetricProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 rounded-lg p-2 ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-base font-semibold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

interface AccountSummaryCardProps {
  summary: AccountSummary | null;
  pricesLoading?: boolean;
  color: 'blue' | 'violet';
}

export function AccountSummaryCard({ summary, pricesLoading, color }: AccountSummaryCardProps) {
  const [includeVrijeRuimte, setIncludeVrijeRuimte] = useState(true);

  const headerColor = color === 'blue'
    ? 'bg-gradient-to-r from-blue-600 to-blue-500'
    : 'bg-gradient-to-r from-violet-600 to-violet-500';

  if (!summary) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className={`${headerColor} px-5 py-4`}>
          <p className="text-sm font-semibold text-white/60">Geen data geladen</p>
        </div>
        <div className="p-5 text-sm text-slate-400">Upload CSV bestanden om te beginnen.</div>
      </div>
    );
  }

  const portfolioValue = summary.currentPortfolioValue + (includeVrijeRuimte ? summary.freeCash : 0);
  const totalPnl = portfolioValue - summary.nettoInleg;
  const totalPnlPct = summary.nettoInleg > 0 ? (totalPnl / summary.nettoInleg) * 100 : 0;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className={`${headerColor} px-5 py-4`}>
        <p className="text-sm font-bold text-white">{summary.account}</p>
        <div className="mt-1 flex items-baseline gap-2">
          {pricesLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <span className="text-2xl font-bold text-white">
                {formatEuro(summary.currentPortfolioValue)}
              </span>
              <span
                className={`text-sm font-semibold ${
                  totalPnlPct >= 0 ? 'text-green-200' : 'text-red-200'
                }`}
              >
                {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-white/60 mt-1">Huidige portefeuillewaarde</p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-5">
        <Metric
          icon={<ArrowUpCircle className="h-4 w-4 text-green-600" />}
          iconColor="bg-green-50"
          label="Totaal gestort"
          value={formatEuro(summary.totalGestort)}
          sub="Totaal geïnvesteerd"
        />
        <Metric
          icon={<ArrowDownCircle className="h-4 w-4 text-orange-500" />}
          iconColor="bg-orange-50"
          label="Terugboekingen"
          value={formatEuro(summary.totalTerugboekingen)}
          sub="Ontvangen uit verkopen"
        />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg p-2 bg-blue-50">
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Vrije ruimte</p>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVrijeRuimte}
                  onChange={(e) => setIncludeVrijeRuimte(e.target.checked)}
                  className="h-3 w-3 accent-blue-600"
                />
                <span className="text-xs text-slate-400">meerekenen</span>
              </label>
            </div>
            <p className="text-base font-semibold text-slate-800">{formatEuro(summary.freeCash)}</p>
            <p className="text-xs text-slate-400">Beschikbaar cash</p>
          </div>
        </div>
        <Metric
          icon={<TrendingUp className="h-4 w-4 text-slate-600" />}
          iconColor="bg-slate-100"
          label="Totaal resultaat"
          value={`${totalPnl >= 0 ? '+' : ''}${formatEuro(totalPnl)}`}
          sub={`t.o.v. netto inleg ${formatEuro(summary.nettoInleg)}`}
        />
      </div>
    </div>
  );
}
