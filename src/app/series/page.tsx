import SeriesPageClient from './SeriesPageClient';
import { getSeriesHubData } from '@/lib/adapters/series';

export default async function SeriesPage() {
  const { popular, latest, dramaSpotlight, weeklySchedule, filters } = await getSeriesHubData(24, {
    includeNsfw: false,
  }).catch(() => ({
    popular: [],
    latest: [],
    dramaSpotlight: [],
    weeklySchedule: [],
    filters: ['Anime', 'Donghua', 'Drama'],
  }));

  return (
    <SeriesPageClient
      initialPopular={popular}
      initialLatest={latest}
      initialDramaSpotlight={dramaSpotlight}
      initialWeeklySchedule={weeklySchedule}
      filters={filters}
    />
  );
}
