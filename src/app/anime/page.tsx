import AnimePageClient from './AnimePageClient';
import { getAnimeHubData } from '@/lib/anime-source';
import { getAnimeSchedule } from '@/lib/api';

export default async function AnimePage() {
  const [{ ongoing }, schedule] = await Promise.all([
    getAnimeHubData(36).catch(() => ({ ongoing: [] })),
    getAnimeSchedule().catch(() => []),
  ]);

  return <AnimePageClient initialSchedule={schedule} initialOngoing={ongoing} enableInfiniteScroll={false} />;
}
