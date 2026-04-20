import type { Metadata } from 'next';
import { Clock3, Play, Tv, Zap } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { HubLaneCard } from '@/components/molecules/HubLaneCard';
import { WATCH_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { SHORTS_HUB_ENABLED } from '@/lib/shorts-paths';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Subtitle Indonesia',
  description: SHORTS_HUB_ENABLED
    ? 'Jelajahi film, series, anime, donghua, drama Asia, dan shorts subtitle Indonesia dari satu halaman watch.'
    : 'Jelajahi film, series, anime, donghua, dan drama Asia subtitle Indonesia dari satu halaman watch.',
  path: '/watch',
  keywords: SHORTS_HUB_ENABLED
    ? ['watch subtitle indonesia', 'movies subtitle indonesia', 'series subtitle indonesia', 'shorts subtitle indonesia']
    : ['watch subtitle indonesia', 'movies subtitle indonesia', 'series subtitle indonesia'],
});

export default function WatchPage() {
  return (
    <main className="app-shell" data-theme="movie">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Nonton Subtitle Indonesia',
          description: SHORTS_HUB_ENABLED
            ? 'Halaman watch untuk film, series, anime, donghua, drama Asia, dan shorts subtitle Indonesia.'
            : 'Halaman watch untuk film, series, anime, donghua, dan drama Asia subtitle Indonesia.',
          path: '/watch',
          items: WATCH_PRIMARY_SEGMENTS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaHubHeader
        title="Nonton"
        description={
          SHORTS_HUB_ENABLED
            ? 'Pilih film, series, atau shorts tanpa pindah-pindah pola navigasi.'
            : 'Pilih film atau series tanpa pindah-pindah pola navigasi.'
        }
        iconName="clapperboard"
        theme="movie"
        eyebrow="Rak tontonan"
        footer={(
          <SegmentedNav
            ariaLabel="Watch segments"
            items={WATCH_PRIMARY_SEGMENTS.map((item) => ({
              href: item.href,
              label: item.label,
              title: item.description,
            }))}
          />
        )}
      >
        <Button variant="movie" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/watch/movies">Film</Link>
        </Button>
        <Button variant="drama" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/watch/series">Series</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/watch/series#latest">Terbaru</Link>
        </Button>
        {SHORTS_HUB_ENABLED ? (
          <Button variant="outline" size="sm" asChild className="rounded-full px-4 font-black">
            <Link href="/watch/shorts">Shorts</Link>
          </Button>
        ) : null}
      </MediaHubHeader>

      <div className="app-container-wide py-6 sm:py-7 md:py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <HubLaneCard
            href="/watch/series"
            title="Series"
            eyebrow="Episode berjalan"
            description="Anime, donghua, dan drama Asia dalam satu alur browse yang cepat untuk lanjut episode."
            theme="drama"
            icon={Tv}
            highlights={['Anime', 'Donghua', 'Drama']}
          />
          <HubLaneCard
            href="/watch/movies"
            title="Film"
            eyebrow="Film pilihan"
            description="Masuk ke film terbaru, populer, dan siap ditonton dari satu rak."
            theme="movie"
            icon={Play}
            highlights={['Populer', 'Terbaru', 'Tersimpan']}
          />
          {!SHORTS_HUB_ENABLED ? (
            <HubLaneCard
              href="/watch/series#latest"
              title="Terbaru"
              eyebrow="Update cepat"
              description="Masuk ke judul episodik yang baru diperbarui saat kamu ingin langsung lanjut."
              theme="drama"
              icon={Clock3}
              highlights={['Baru', 'Update', 'Cepat']}
            />
          ) : null}
          {SHORTS_HUB_ENABLED ? (
            <HubLaneCard
              href="/watch/shorts"
              title="Shorts"
              eyebrow="Cerita vertikal"
              description="Buka cerita pendek untuk sesi cepat, lanjut langsung, dan playback vertikal yang ringan."
              theme="drama"
              icon={Zap}
              highlights={['Vertikal', 'Cepat', 'Ringan']}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
