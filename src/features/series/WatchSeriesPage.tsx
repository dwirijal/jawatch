import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import SeriesPageClient from './SeriesPageClient';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { getSeriesHubData } from '@/lib/adapters/series';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Series Subtitle Indonesia',
  description: 'Jelajahi anime, donghua, dan drama episodik subtitle Indonesia dari rak nonton.',
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
  const { popular, latest, dramaSpotlight, weeklySchedule } = await getSeriesHubData(24, {
    includeNsfw,
    includeFilters: false,
  }).catch(() => ({
    popular: [],
    latest: [],
    dramaSpotlight: [],
    weeklySchedule: [],
  }));

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Nonton Series Subtitle Indonesia',
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
        activeFilter={activeFilter}
      />
    </>
  );
}
