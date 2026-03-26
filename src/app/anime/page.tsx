import AnimePageClient from './AnimePageClient';
import { getAnimeHubData } from '@/lib/anime-source';

export default async function AnimePage() {
  const { ongoing } = await getAnimeHubData(36).catch(() => ({ ongoing: [] }));

  return <AnimePageClient initialSchedule={[]} initialOngoing={ongoing} enableInfiniteScroll={false} />;
}
