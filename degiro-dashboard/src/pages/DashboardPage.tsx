import { AccountUploader } from '../components/upload/AccountUploader';
import { AccountSummaryCard } from '../components/summary/AccountSummaryCard';
import { HoldingsTable } from '../components/holdings/HoldingsTable';
import { useAccountStore } from '../store/useAccountStore';
import { usePriceStore } from '../store/usePriceStore';
import { useLivePrices } from '../hooks/useLivePrices';

export function DashboardPage() {
  const roel64Loaded = useAccountStore((s) => s.roel64.loaded);
  const roelPensLoaded = useAccountStore((s) => s.roelPensioen64.loaded);
  const getSummary = useAccountStore((s) => s.getSummary);
  const prices = usePriceStore((s) => s.prices);
  const getAllHoldings = useAccountStore((s) => s.getAllHoldings);

  // Trigger live price fetching whenever holdings change
  useLivePrices();

  // Compute live portfolio values for summary cards
  const holdings = getAllHoldings();

  const roel64Summary = (() => {
    const base = getSummary('Roel64');
    if (!base) return null;
    const portfolioValue = holdings
      .filter((h) => h.account === 'Roel64')
      .reduce((s, h) => s + (prices[h.isin]?.currentPriceEUR ?? 0) * h.quantity, 0);
    return { ...base, currentPortfolioValue: portfolioValue };
  })();

  const roelPensSummary = (() => {
    const base = getSummary('RoelPensioen64');
    if (!base) return null;
    const portfolioValue = holdings
      .filter((h) => h.account === 'RoelPensioen64')
      .reduce((s, h) => s + (prices[h.isin]?.currentPriceEUR ?? 0) * h.quantity, 0);
    return { ...base, currentPortfolioValue: portfolioValue };
  })();

  const anyPricesLoading = Object.values(prices).some((p) => p.loading);
  const anyDataLoaded = roel64Loaded || roelPensLoaded;

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          CSV Bestanden Uploaden
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AccountUploader account="Roel64" label="Roel64" color="blue" />
          <AccountUploader account="RoelPensioen64" label="RoelPensioen64" color="violet" />
        </div>
      </section>

      {/* Summary cards */}
      {anyDataLoaded && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Overzicht rekeningen
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AccountSummaryCard
              summary={roel64Summary}
              pricesLoading={anyPricesLoading}
              color="blue"
            />
            <AccountSummaryCard
              summary={roelPensSummary}
              pricesLoading={anyPricesLoading}
              color="violet"
            />
          </div>
        </section>
      )}

      {/* Holdings table */}
      <section>
        <HoldingsTable />
      </section>
    </div>
  );
}
