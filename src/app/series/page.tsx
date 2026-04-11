import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import SeriesPageClient from './SeriesPageClient';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getSeriesHubData } from '@/lib/adapters/series';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Series Subtitle Indonesia',
  description: 'Jelajahi anime, donghua, dan drama episodik subtitle Indonesia dalam satu katalog series yang cepat dan rapi.',
  path: '/series',
  keywords: ['series subtitle indonesia', 'anime terbaru', 'donghua terbaru', 'drama episodik'],
});

export default async function SeriesPage() {
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
          title: 'Series Subtitle Indonesia',
          description: 'Katalog series untuk anime, donghua, dan drama subtitle Indonesia.',
          path: '/series',
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
      />
    </>
  );
}
