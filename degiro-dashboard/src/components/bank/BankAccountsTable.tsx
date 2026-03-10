import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useBankStore } from '../../store/useBankStore';
import type { BankAccount } from '../../types/bank';
import { formatEuro } from '../../utils/currency';
import { Button } from '../ui/Button';
import { BankAccountForm } from './BankAccountForm';

const TYPE_LABELS: Record<string, string> = {
  lopende: 'Lopende rekening',
  spaar: 'Spaarrekening',
  beleggersrekening: 'Beleggersrekening',
};

export function BankAccountsTable() {
  const { accounts, deleteAccount } = useBankStore();
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const total = accounts.reduce((s, a) => s + a.bedrag, 0);

  const sorted = [...accounts].sort(
    (a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()
  );

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-800">Bankrekeningen</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Totaal: <span className="font-semibold text-slate-700">{formatEuro(total)}</span>
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Toevoegen
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rekeningnummer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Bedrag</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Geen bankrekeningen. Klik op "Toevoegen" om te beginnen.
                </td>
              </tr>
            ) : (
              sorted.map((account) => (
                <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">
                    {new Date(account.datum).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{account.bank}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{account.bankrekeningnummer || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {TYPE_LABELS[account.typeRekening] ?? account.typeRekening}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800 tabular-nums">
                    {formatEuro(account.bedrag)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === account.id ? (
                        <>
                          <span className="text-xs text-slate-500 mr-1">Zeker weten?</span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              deleteAccount(account.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Ja
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Nee
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditAccount(account)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(account.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {accounts.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Totaal ({accounts.length} rekeningen)
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-slate-800 tabular-nums">
                  {formatEuro(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {(showForm || editAccount) && (
        <BankAccountForm
          existing={editAccount ?? undefined}
          onClose={() => {
            setShowForm(false);
            setEditAccount(null);
          }}
        />
      )}
    </div>
  );
}
