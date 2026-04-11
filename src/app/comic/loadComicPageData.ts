import { filterMangaBySubtype, getComicSubtypePosters, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

export async function loadComicPageData(variant: MangaSubtype | 'all'): Promise<{
  popular: MangaSearchResult[];
  newest: MangaSearchResult[];
  subtypePosters: Partial<Record<MangaSubtype, string>>;
}> {
  const includeNsfw = await resolveViewerNsfwAccess();
  const [popular, newest, subtypePosters] = await Promise.all([
    getPopularManga(40, { includeNsfw }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw }).catch(() => ({ comics: [] })),
    getComicSubtypePosters({ includeNsfw }).catch(() => ({})),
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
