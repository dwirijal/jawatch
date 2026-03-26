import type { Metadata } from 'next';
import { Bookmark, Clock4 } from 'lucide-react';
import { AdSection } from '@/components/organisms/AdSection';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { SavedContentSection } from '@/components/organisms/SavedContentSection';
import { SectionHeader } from '@/components/molecules/SectionHeader';

export const metadata: Metadata = {
  title: 'Bookmarks',
  description: 'Your saved content and recent watch progress on dwizzyWEEB.',
};

export default function CollectionPage() {
  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <SectionHeader
            title="Your saved shelf and playback trail"
            subtitle="A lean landing page for bookmarks and continue-watching. Sync stays local-only for now, but the route is ready for account-backed upgrades later."
            leading={
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1">
                  <Bookmark className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1">
                  <Clock4 className="h-4.5 w-4.5 text-zinc-400" />
                </span>
              </div>
            }
            contentClassName="max-w-3xl"
            className="border-0 pb-0"
          />
        </section>

        <AdSection />

        <div className="app-section-stack">
          <ContinueWatching />
          <SavedContentSection title="Saved Favorites" />
        </div>
      </div>
    </main>
  );
}
