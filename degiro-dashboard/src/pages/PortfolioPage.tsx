import { useState } from 'react';
import { PortfolioChart } from '../components/portfolio/PortfolioChart';
import { PnlPerStockChart } from '../components/performance/PnlPerStockChart';
import { useAccountStore } from '../store/useAccountStore';

type FilterAccount = 'all' | 'Roel64' | 'RoelPensioen64';

export function PortfolioPage() {
  const anyLoaded = useAccountStore(
    (s) => s.roel64.loaded || s.roelPensioen64.loaded
  );
  const [filterAccount, setFilterAccount] = useState<FilterAccount>('all');

  if (!anyLoaded) {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-8 text-center">
        <p className="text-slate-400 text-sm">
          Upload CSV bestanden op het Dashboard om de waardeontwikkeling te zien.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['all', 'Roel64', 'RoelPensioen64'] as FilterAccount[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilterAccount(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterAccount === opt
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt === 'all' ? 'Alle rekeningen' : opt}
          </button>
        ))}
      </div>
      <PortfolioChart />
      <PnlPerStockChart filterAccount={filterAccount} />
    </div>
  );
}
