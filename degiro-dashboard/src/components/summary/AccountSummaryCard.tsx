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

  const netInvested = summary.totalDeposited - summary.totalWithdrawn;
  const portfolioValue = summary.currentPortfolioValue + summary.freeCash;
  const totalPnl = portfolioValue - netInvested;
  const totalPnlPct = netInvested > 0 ? (totalPnl / netInvested) * 100 : 0;

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
          value={formatEuro(summary.totalDeposited)}
        />
        <Metric
          icon={<ArrowDownCircle className="h-4 w-4 text-orange-500" />}
          iconColor="bg-orange-50"
          label="Terugboekingen"
          value={formatEuro(summary.totalWithdrawn)}
        />
        <Metric
          icon={<Wallet className="h-4 w-4 text-blue-600" />}
          iconColor="bg-blue-50"
          label="Vrije ruimte"
          value={formatEuro(summary.freeCash)}
          sub="Beschikbaar cash"
        />
        <Metric
          icon={<TrendingUp className="h-4 w-4 text-slate-600" />}
          iconColor="bg-slate-100"
          label="Totaal resultaat"
          value={`${totalPnl >= 0 ? '+' : ''}${formatEuro(totalPnl)}`}
          sub={`t.o.v. netto inleg ${formatEuro(netInvested)}`}
        />
      </div>
    </div>
  );
}
