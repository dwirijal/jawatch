import AnimeIndexPageClient from './AnimeIndexPageClient';
import { getAnimeIndexData } from '@/lib/anime-source';

export default async function AnimeListPage() {
  const groups = await getAnimeIndexData().catch(() => []);

  return <AnimeIndexPageClient groups={groups} />;
}
