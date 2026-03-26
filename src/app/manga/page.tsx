import MangaPageClient from './MangaPageClient';
import { filterMangaBySubtype, getNewManga, getPopularManga, type MangaSubtype } from '@/lib/api';

const VARIANT: MangaSubtype = 'manga';

export default async function MangaPage() {
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
