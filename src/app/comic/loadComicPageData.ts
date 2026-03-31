import { filterMangaBySubtype, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

export async function loadComicPageData(variant: MangaSubtype | 'all'): Promise<{
  popular: MangaSearchResult[];
  newest: MangaSearchResult[];
}> {
  const [popular, newest] = await Promise.all([
    getPopularManga(40, { includeNsfw: false }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw: false }).catch(() => ({ comics: [] })),
  ]);

  if (variant === 'all') {
    return {
      popular: popular.comics || [],
      newest: newest.comics || [],
    };
  }

  return {
    popular: filterMangaBySubtype(popular.comics || [], variant),
    newest: filterMangaBySubtype(newest.comics || [], variant),
  };
}
