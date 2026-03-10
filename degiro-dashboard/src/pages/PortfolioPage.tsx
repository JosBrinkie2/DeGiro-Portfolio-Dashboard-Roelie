import { PortfolioChart } from '../components/portfolio/PortfolioChart';
import { useAccountStore } from '../store/useAccountStore';

export function PortfolioPage() {
  const anyLoaded = useAccountStore(
    (s) => s.roel64.loaded || s.roelPensioen64.loaded
  );

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
      <PortfolioChart />
    </div>
  );
}
