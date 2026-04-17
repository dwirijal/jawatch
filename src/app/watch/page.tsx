import type { Metadata } from 'next';
import { Play, Tv, Zap } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { HubLaneCard } from '@/components/molecules/HubLaneCard';
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
        iconName="clapperboard"
        theme="movie"
        eyebrow="Media Hub"
        footer={(
          <div className="flex flex-wrap gap-2">
            {WATCH_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-tv rounded-full border border-border-subtle bg-surface-1 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      />

      <div className="app-container-wide py-6 sm:py-7 md:py-8">
        <div className="grid gap-4 xl:grid-cols-3">
          <HubLaneCard
            href="/watch/movies"
            title="Movies"
            eyebrow="Feature films"
            description="Jump straight into full-length titles, recent catalog movement, and playback entry without leaving the watch shell."
            theme="movie"
            icon={Play}
            highlights={['Popular', 'Latest', 'Saved']}
          />
          <HubLaneCard
            href="/watch/series"
            title="Series"
            eyebrow="Episodic lanes"
            description="Anime, donghua, and live-action series stay inside one browse rhythm with faster continuation and cleaner scanning."
            theme="drama"
            icon={Tv}
            highlights={['Anime', 'Donghua', 'Drama']}
          />
          <HubLaneCard
            href="/watch/shorts"
            title="Shorts"
            eyebrow="Vertical stories"
            description="Open short-form stories built for quick sessions, direct continuation, and immersive swipe-first playback."
            theme="drama"
            icon={Zap}
            highlights={['Vertical', 'Fast start', 'Immersive']}
          />
        </div>
      </div>
    </main>
  );
}
