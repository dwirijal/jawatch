import MangaPageClient from '../manga/MangaPageClient';
import { filterMangaBySubtype, getNewManga, getPopularManga } from '@/lib/adapters/comic';
import type { MangaSubtype } from '@/lib/types';

const VARIANT: MangaSubtype = 'manhwa';

export default async function ManhwaPage() {
  const [popular, newest] = await Promise.all([
    getPopularManga().catch(() => ({ comics: [] })),
    getNewManga(1, 40).catch(() => ({ comics: [] })),
  ]);

  return (
    <MangaPageClient
      variant={VARIANT}
      initialPopular={filterMangaBySubtype(popular.comics || [], VARIANT)}
      initialNewest={filterMangaBySubtype(newest.comics || [], VARIANT)}
    />
  );
}
