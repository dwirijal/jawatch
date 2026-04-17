import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import SeriesPageClient from '@/app/series/SeriesPageClient';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getSeriesHubData } from '@/lib/adapters/series';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Watch Series Subtitle Indonesia',
  description: 'Jelajahi anime, donghua, dan drama episodik subtitle Indonesia dari hub watch.',
  path: '/watch/series',
  keywords: ['watch series subtitle indonesia', 'anime terbaru', 'donghua terbaru', 'drama episodik'],
});

export const dynamic = 'force-dynamic';

type WatchSeriesPageProps = {
  searchParams?: Promise<{ type?: string }>;
};

function normalizeSeriesType(value?: string): 'anime' | 'donghua' | 'drama' | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'anime':
      return 'anime';
    case 'donghua':
      return 'donghua';
    case 'drama':
      return 'drama';
    default:
      return null;
  }
}

export default async function WatchSeriesPage({ searchParams }: WatchSeriesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const activeFilter = normalizeSeriesType(params?.type);
  const includeNsfw = await resolveViewerNsfwAccess();
  const { popular, latest, dramaSpotlight, weeklySchedule, filters } = await getSeriesHubData(24, {
    includeNsfw,
  }).catch(() => ({
    popular: [],
    latest: [],
    dramaSpotlight: [],
    weeklySchedule: [],
    filters: ['Anime', 'Donghua', 'Drama'],
  }));

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Watch Series Subtitle Indonesia',
          description: 'Katalog series untuk anime, donghua, dan drama subtitle Indonesia.',
          path: '/watch/series',
          items: popular.map((item) => ({
            name: item.title,
            url: `/series/${item.slug}`,
            image: item.poster,
          })),
        })}
      />
      <SeriesPageClient
        initialPopular={popular}
        initialLatest={latest}
        initialDramaSpotlight={dramaSpotlight}
        initialWeeklySchedule={weeklySchedule}
        filters={filters}
        activeFilter={activeFilter}
      />
    </>
  );
}
