import type { Metadata } from 'next';
import { Bookmark, Clock4, History, UserRound } from 'lucide-react';
import { CollectionSections } from '@/app/_vault/CollectionSections';
import { DeferredAdSection } from '@/components/organisms/DeferredAdSection';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { Link } from '@/components/atoms/Link';
import { requireCompletedOnboarding } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Vault',
  description: 'Your saved content, history, and account surfaces on jawatch.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VaultPage() {
  await requireCompletedOnboarding('/vault');

  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <SectionHeader
            title="Vault"
            subtitle="Your personal area"
            leading={
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1">
                  <Bookmark className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1">
                  <Clock4 className="h-4.5 w-4.5 text-zinc-400" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1">
                  <UserRound className="h-4.5 w-4.5 text-zinc-300" />
                </span>
              </div>
            }
            contentClassName="max-w-3xl"
            className="border-0 pb-0"
          />
          <p className="max-w-2xl text-sm leading-6 text-zinc-500">
            Saved items, watch history, and account surfaces live here.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: '/vault/profile', label: 'Profile', icon: UserRound, copy: 'Identity, age access, theme, and language.' },
              { href: '/vault/history', label: 'History', icon: History, copy: 'Recent watch and read progress.' },
              { href: '/vault/saved', label: 'Saved', icon: Bookmark, copy: 'Bookmarks and favorites.' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-full flex-col gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-elevated"
              >
                <item.icon className="h-4.5 w-4.5 text-white" />
                <span className="text-sm font-black uppercase tracking-[0.16em] text-white">{item.label}</span>
                <span className="text-xs leading-5 text-zinc-500">{item.copy}</span>
              </Link>
            ))}
          </div>
        </section>

        <DeferredAdSection />

        <div className="app-section-stack">
          <CollectionSections />
        </div>
      </div>
    </main>
  );
}
