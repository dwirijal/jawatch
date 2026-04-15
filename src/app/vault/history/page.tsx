import type { Metadata } from 'next';
import { requireCompletedOnboarding } from '@/lib/auth/session';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { Link } from '@/components/atoms/Link';

export const metadata: Metadata = {
  title: 'Vault History',
  description: 'Recent watch and read history for your Vault on jawatch.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VaultHistoryPage() {
  await requireCompletedOnboarding('/vault/history');

  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400">Vault</p>
            <h1 className="font-[var(--font-heading)] text-4xl tracking-tight text-zinc-900">History</h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">
              Recent watch and read progress from this device.
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/vault/saved"
              className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition-colors hover:bg-surface-elevated"
            >
              Saved items
            </Link>
          </div>
        </section>

        <ContinueWatching title="Vault History" limit={20} />
      </div>
    </main>
  );
}

