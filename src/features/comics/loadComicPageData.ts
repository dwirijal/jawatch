import { filterMangaBySubtype, getComicSubtypePosters, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildSearchWarmDocuments, warmSearchIndexDocuments } from '@/domains/search/server/search-service';
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

  void warmSearchIndexDocuments(buildSearchWarmDocuments({
    comics: [
      ...(popular.comics || []).slice(0, 18),
      ...(newest.comics || []).slice(0, 18),
    ],
  }));

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
