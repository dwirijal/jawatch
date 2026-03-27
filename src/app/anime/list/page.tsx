import AnimeIndexPageClient from './AnimeIndexPageClient';
import { getAnimeIndexData } from '@/lib/adapters/anime';

export default async function AnimeListPage() {
  const groups = await getAnimeIndexData().catch(() => []);

  return <AnimeIndexPageClient groups={groups} />;
}
