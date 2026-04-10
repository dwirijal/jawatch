import { filterMangaBySubtype, getComicSubtypePosters, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

export async function loadComicPageData(variant: MangaSubtype | 'all'): Promise<{
  popular: MangaSearchResult[];
  newest: MangaSearchResult[];
  subtypePosters: Partial<Record<MangaSubtype, string>>;
}> {
  const [popular, newest, subtypePosters] = await Promise.all([
    getPopularManga(40, { includeNsfw: false }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw: false }).catch(() => ({ comics: [] })),
    getComicSubtypePosters({ includeNsfw: false }).catch(() => ({})),
  ]);

  if (variant === 'all') {
    return {
      popular: popular.comics || [],
      newest: newest.comics || [],
      subtypePosters,
    };
  }

  return {
    popular: filterMangaBySubtype(popular.comics || [], variant),
    newest: filterMangaBySubtype(newest.comics || [], variant),
    subtypePosters,
  };
}
