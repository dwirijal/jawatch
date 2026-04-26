import { filterMangaBySubtype, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import { buildSearchWarmDocuments, warmSearchIndexDocuments } from '@/domains/search/server/search-service';
import { shouldWarmSearchIndex } from '@/lib/server/build-phase';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

type LoadComicPageDataOptions = {
  includeNsfw?: boolean;
};

const COMIC_PAGE_PRELOAD_LIMIT = 24;

async function resolveIncludeNsfw(options: LoadComicPageDataOptions): Promise<boolean> {
  if (typeof options.includeNsfw === 'boolean') {
    return options.includeNsfw;
  }

  const { resolveViewerNsfwAccess } = await import('@/lib/server/viewer-nsfw-access');
  return resolveViewerNsfwAccess();
}

function deriveSubtypePosters(items: MangaSearchResult[]): Partial<Record<MangaSubtype, string>> {
  return items.reduce<Partial<Record<MangaSubtype, string>>>((posters, item) => {
    const subtype = item.subtype;
    if ((subtype === 'manga' || subtype === 'manhwa' || subtype === 'manhua') && !posters[subtype]) {
      posters[subtype] = item.background || item.image || item.thumbnail;
    }
    return posters;
  }, {});
}

export async function loadComicPageData(
  variant: MangaSubtype | 'all',
  options: LoadComicPageDataOptions = {},
): Promise<{
  popular: MangaSearchResult[];
  newest: MangaSearchResult[];
  subtypePosters: Partial<Record<MangaSubtype, string>>;
}> {
  const includeNsfw = await resolveIncludeNsfw(options);
  const [popular, newest] = await Promise.all([
    getPopularManga(COMIC_PAGE_PRELOAD_LIMIT, { includeNsfw }).catch(() => ({ comics: [] })),
    getNewManga(1, COMIC_PAGE_PRELOAD_LIMIT, { includeNsfw }).catch(() => ({ comics: [] })),
  ]);
  const popularComics = popular.comics || [];
  const newestComics = newest.comics || [];
  const subtypePosters = deriveSubtypePosters([
    ...popularComics,
    ...newestComics,
  ]);

  if (shouldWarmSearchIndex()) {
    void warmSearchIndexDocuments(buildSearchWarmDocuments({
      comics: [
        ...popularComics.slice(0, 18),
        ...newestComics.slice(0, 18),
      ],
    }));
  }

  if (variant === 'all') {
    return {
      popular: popularComics,
      newest: newestComics,
      subtypePosters,
    };
  }

  return {
    popular: filterMangaBySubtype(popularComics, variant),
    newest: filterMangaBySubtype(newestComics, variant),
    subtypePosters,
  };
}
