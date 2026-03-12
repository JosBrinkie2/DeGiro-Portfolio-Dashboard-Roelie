import { AccountUploader } from '../components/upload/AccountUploader';

export function UploadPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          CSV Bestanden Uploaden
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AccountUploader account="Roel64" label="Roel64" color="blue" />
          <AccountUploader account="RoelPensioen64" label="RoelPensioen64" color="violet" />
        </div>
      </section>
    </div>
  );
}
