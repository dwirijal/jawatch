import type { Metadata } from 'next';
import { requireCompletedOnboarding } from '@/lib/auth/session';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { Link } from '@/components/atoms/Link';
import { getVaultTabCopy, resolveVaultMediaTypes, resolveVaultTab } from '@/lib/vault-tabs';

export const metadata: Metadata = {
  title: 'Simpanan Koleksi',
  description: 'Bookmark dan favorit yang tersimpan di koleksi jawatch kamu.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VaultSavedPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireCompletedOnboarding('/vault/saved');
  const params = searchParams ? await searchParams : undefined;
  const activeTab = resolveVaultTab(params?.tab);
  const activeTypes = resolveVaultMediaTypes(activeTab);
  const activeCopy = getVaultTabCopy(activeTab);
  const tabHrefBase = '/vault/saved';

  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400">Koleksi</p>
            <h1 className="font-[var(--font-heading)] text-4xl tracking-tight text-zinc-900">Simpanan</h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">
              Bookmark dan favorit yang tersimpan di perangkat ini.
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/vault/history"
              className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition-colors hover:bg-surface-elevated"
            >
              Lihat riwayat
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['all', 'watch', 'read'] as const).map((tab) => {
              const tabCopy = getVaultTabCopy(tab);
              const href = tab === 'all' ? tabHrefBase : `${tabHrefBase}${tabCopy.href}`;

              return (
                <Link
                  key={tab}
                  href={href}
                  className={`inline-flex items-center rounded-[var(--radius-sm)] border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
                    activeTab === tab
                      ? 'border-zinc-800 bg-zinc-900 text-white'
                      : 'border-border-subtle bg-surface-1 text-zinc-900 hover:bg-surface-elevated'
                  }`}
                >
                  {tabCopy.label}
                </Link>
              );
            })}
          </div>
        </section>

        <SavedContentSection title={activeCopy.emptyLabel} type={activeTypes ?? undefined} />
      </div>
    </main>
  );
}
