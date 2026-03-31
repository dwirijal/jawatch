import SeriesPageClient from './SeriesPageClient';
import { getSeriesHubData } from '@/lib/adapters/series';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export default async function SeriesPage() {
  const session = await getServerAuthStatus();
  const { popular, latest, dramaSpotlight, weeklySchedule, filters } = await getSeriesHubData(24, {
    includeNsfw: session.authenticated,
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
