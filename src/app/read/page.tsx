import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

const READ_LINKS = [
  {
    href: '/read/comics',
    label: 'Comics',
    description: 'Manga, manhwa, and manhua on the reading shelf.',
  },
] as const;

export const metadata: Metadata = buildMetadata({
  title: 'Read Subtitle Indonesia',
  description: 'Browse comics from the reading hub.',
  path: '/read',
  keywords: ['read subtitle indonesia', 'comics subtitle indonesia', 'manga manhwa manhua'],
});

export default function ReadPage() {
  return (
    <main className="app-shell" data-theme="manga">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Read Subtitle Indonesia',
          description: 'Reading hub for comics and long-form stories.',
          path: '/read',
          items: READ_LINKS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaHubHeader
        title="Read"
        description="Jump into comics from the unified reading surface."
        icon={BookOpen}
        theme="manga"
        eyebrow="Reading Hub"
      />

      <div className="app-container-wide py-8 sm:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {READ_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-panel group flex min-h-40 flex-col justify-between rounded-[var(--radius-sm)] border border-border-subtle p-5 transition-colors hover:bg-surface-elevated"
            >
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
                <h2 className="text-2xl font-black tracking-tight text-white">{item.label}</h2>
                <p className="max-w-sm text-sm leading-6 text-zinc-500">{item.description}</p>
              </div>
              <span className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-zinc-400 transition-colors group-hover:text-white">
                Open {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
