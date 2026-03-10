import { useState } from 'react';
import type { BankAccount } from '../../types/bank';
import { useBankStore } from '../../store/useBankStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface BankAccountFormProps {
  existing?: BankAccount;
  onClose: () => void;
}

type FormData = Omit<BankAccount, 'id'>;

export function BankAccountForm({ existing, onClose }: BankAccountFormProps) {
  const addAccount = useBankStore((s) => s.addAccount);
  const updateAccount = useBankStore((s) => s.updateAccount);

  const [form, setForm] = useState<FormData>({
    datum: existing?.datum ?? new Date().toISOString().split('T')[0],
    bank: existing?.bank ?? '',
    bankrekeningnummer: existing?.bankrekeningnummer ?? '',
    typeRekening: existing?.typeRekening ?? 'lopende',
    bedrag: existing?.bedrag ?? 0,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'bedrag' ? parseFloat(value) || 0 : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existing) {
      updateAccount(existing.id, form);
    } else {
      addAccount(form);
    }
    onClose();
  }

  const isEdit = !!existing;

  return (
    <Modal title={isEdit ? 'Bankrekening bewerken' : 'Bankrekening toevoegen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Datum</label>
            <input
              type="date"
              name="datum"
              value={form.datum}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bank</label>
            <input
              type="text"
              name="bank"
              value={form.bank}
              onChange={handleChange}
              placeholder="bijv. ING, Rabobank"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rekeningnummer</label>
          <input
            type="text"
            name="bankrekeningnummer"
            value={form.bankrekeningnummer}
            onChange={handleChange}
            placeholder="NL00 BANK 0000 0000 00"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type rekening</label>
            <select
              name="typeRekening"
              value={form.typeRekening}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="lopende">Lopende rekening</option>
              <option value="spaar">Spaarrekening</option>
              <option value="beleggersrekening">Beleggersrekening</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bedrag (€)</label>
            <input
              type="number"
              name="bedrag"
              value={form.bedrag}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Opslaan' : 'Toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
