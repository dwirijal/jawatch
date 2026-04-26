import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JsonLd } from '@/components/atoms/JsonLd';
import SeriesPageClient, { SeriesPageClientFromSearchParams } from './SeriesPageClient';
import { getSeriesHubData } from '@/lib/adapters/series';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Series Subtitle Indonesia',
  description: 'Jelajahi anime, donghua, dan drama episodik subtitle Indonesia dari rak nonton.',
  path: '/watch/series',
  keywords: ['watch series subtitle indonesia', 'anime terbaru', 'donghua terbaru', 'drama episodik'],
});

export default async function WatchSeriesPage() {
  const { popular, latest, dramaSpotlight, weeklySchedule } = await getSeriesHubData(24, {
    includeNsfw: false,
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
      <Suspense
        fallback={(
          <SeriesPageClient
            initialPopular={popular}
            initialLatest={latest}
            initialDramaSpotlight={dramaSpotlight}
            initialWeeklySchedule={weeklySchedule}
          />
        )}
      >
        <SeriesPageClientFromSearchParams
          initialPopular={popular}
          initialLatest={latest}
          initialDramaSpotlight={dramaSpotlight}
          initialWeeklySchedule={weeklySchedule}
        />
      </Suspense>
    </>
  );
}
