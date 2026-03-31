import { filterMangaBySubtype, getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import type { MangaSearchResult, MangaSubtype } from '@/lib/types';

export async function loadComicPageData(variant: MangaSubtype | 'all'): Promise<{
  popular: MangaSearchResult[];
  newest: MangaSearchResult[];
}> {
  const session = await getServerAuthStatus();
  const [popular, newest] = await Promise.all([
    getPopularManga(40, { includeNsfw: session.authenticated }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw: session.authenticated }).catch(() => ({ comics: [] })),
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
