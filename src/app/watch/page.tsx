import type { Metadata } from 'next';
import { Clapperboard } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

const WATCH_LINKS = [
  {
    href: '/watch/movies',
    label: 'Movies',
    description: 'Film catalog and playback entry.',
  },
  {
    href: '/watch/series',
    label: 'Series',
    description: 'Anime, donghua, and drama on the same watch surface.',
  },
  {
    href: '/watch/shorts',
    label: 'Shorts',
    description: 'Vertical short-form stories with direct playback.',
  },
] as const;

export const metadata: Metadata = buildMetadata({
  title: 'Watch Subtitle Indonesia',
  description: 'Browse movies, series, and shorts from the watch hub.',
  path: '/watch',
  keywords: ['watch subtitle indonesia', 'movies subtitle indonesia', 'series subtitle indonesia', 'shorts subtitle indonesia'],
});

export default function WatchPage() {
  return (
    <main className="app-shell" data-theme="movie">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Watch Subtitle Indonesia',
          description: 'Watch hub for movies, series, and shorts.',
          path: '/watch',
          items: WATCH_LINKS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaHubHeader
        title="Watch"
        description="Jump into movies, series, or shorts without leaving the unified watch surface."
        icon={Clapperboard}
        theme="movie"
        eyebrow="Media Hub"
      />

      <div className="app-container-wide py-8 sm:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {WATCH_LINKS.map((item) => (
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
