import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Building2 } from 'lucide-react';
import clsx from 'clsx';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { BankPage } from './pages/BankPage';
import { useAccountStore } from './store/useAccountStore';

type Page = 'dashboard' | 'portfolio' | 'bank';

const NAV_ITEMS: Array<{ id: Page; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Waardeontwikkeling', icon: TrendingUp },
  { id: 'bank', label: 'Bankrekeningen', icon: Building2 },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const roel64Loaded = useAccountStore((s) => s.roel64.loaded);
  const roelPensLoaded = useAccountStore((s) => s.roelPensioen64.loaded);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <h1 className="text-base font-bold text-slate-800 leading-tight">
            DeGiro Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Portefeuille overzicht</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={clsx(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                page === id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Status indicator */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <StatusIndicator label="Roel64" loaded={roel64Loaded} />
            <StatusIndicator label="RoelPensioen64" loaded={roelPensLoaded} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'portfolio' && <PortfolioPage />}
          {page === 'bank' && <BankPage />}
        </div>
      </main>
    </div>
  );
}

function StatusIndicator({ label, loaded }: { label: string; loaded: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${
          loaded ? 'bg-green-500' : 'bg-slate-300'
        }`}
      />
      <span className={loaded ? 'text-slate-700 font-medium' : 'text-slate-400'}>
        {label}
      </span>
    </div>
  );
}
