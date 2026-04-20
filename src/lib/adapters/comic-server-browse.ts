import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { shouldUseComicGateway } from '../server/comic-origin.ts';
import type { MangaSearchResult, MangaSubtype } from '../types.ts';
import {
  fetchComicGatewayJson,
  getVisibilityCacheSegment,
  LIST_CACHE_TTL_SECONDS,
  queryGenreComics,
  queryLatestComics,
  queryOngoingComics,
  queryPopularComics,
  queryComicSearch,
  querySubtypePosterMap,
  rememberComicListPayload,
  rememberComicSearchPayload,
  SEARCH_CACHE_TTL_SECONDS,
} from './comic-server-shared.ts';

export async function getPopularManga(
  limit = 40,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const key = buildComicCacheKey('list', 'popular', getVisibilityCacheSegment(includeNsfw), limit);

  return rememberComicListPayload(
    key,
    LIST_CACHE_TTL_SECONDS,
    () => (
      shouldUseComicGateway()
        ? fetchComicGatewayJson<unknown>('/api/comic/popular', {
            limit,
            includeNsfw,
          })
        : queryPopularComics(limit, includeNsfw)
    ),
  );
}

export async function getNewManga(
  page = 1,
  limit = 10,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const key = buildComicCacheKey('list', 'latest', getVisibilityCacheSegment(includeNsfw), page, limit);

  return rememberComicListPayload(
    key,
    LIST_CACHE_TTL_SECONDS,
    () => (
      shouldUseComicGateway()
        ? fetchComicGatewayJson<unknown>('/api/comic/latest', {
            page,
            limit,
            includeNsfw,
          })
        : queryLatestComics(page, limit, includeNsfw)
    ),
  );
}

export async function getOngoingManga(
  limit = 40,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const key = buildComicCacheKey('list', 'ongoing', getVisibilityCacheSegment(includeNsfw), limit);

  return rememberComicListPayload(
    key,
    LIST_CACHE_TTL_SECONDS,
    () => (
      shouldUseComicGateway()
        ? fetchComicGatewayJson<unknown>('/api/comic/ongoing', {
            limit,
            includeNsfw,
          })
        : queryOngoingComics(limit, includeNsfw)
    ),
  );
}

export async function searchManga(
  query: string,
  page = 1,
  limit = 24,
  options: { includeNsfw?: boolean } = {},
): Promise<{ data: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const key = buildComicCacheKey('search', getVisibilityCacheSegment(includeNsfw), query.toLowerCase(), page, limit);

  return rememberComicSearchPayload(
    key,
    SEARCH_CACHE_TTL_SECONDS,
    () => (
      shouldUseComicGateway()
        ? fetchComicGatewayJson<unknown>('/api/search/comic', {
            q: query,
            page,
            limit,
            includeNsfw,
          })
        : queryComicSearch(query, page, limit, includeNsfw)
    ),
  );
}

export async function getMangaByGenre(
  genre: string,
  page = 1,
  limit = 24,
  options: { includeNsfw?: boolean } = {},
): Promise<{ comics: MangaSearchResult[] }> {
  const includeNsfw = options.includeNsfw === true;
  const key = buildComicCacheKey('genre', getVisibilityCacheSegment(includeNsfw), genre.toLowerCase(), page, limit);

  return rememberComicListPayload(
    key,
    LIST_CACHE_TTL_SECONDS,
    () => (
      shouldUseComicGateway()
        ? fetchComicGatewayJson<unknown>('/api/comic/genre', {
            genre,
            page,
            limit,
            includeNsfw,
          })
        : queryGenreComics(genre, page, limit, includeNsfw)
    ),
  );
}

export async function getComicSubtypePosters(
  options: { includeNsfw?: boolean } = {},
): Promise<Partial<Record<MangaSubtype, string>>> {
  const includeNsfw = options.includeNsfw === true;
  if (shouldUseComicGateway()) {
    return rememberComicCacheValue(
      buildComicCacheKey('subtype-posters', getVisibilityCacheSegment(includeNsfw)),
      LIST_CACHE_TTL_SECONDS,
      () => fetchComicGatewayJson<Partial<Record<MangaSubtype, string>>>('/api/comic/subtype-posters', {
        includeNsfw,
      }),
    );
  }

  return rememberComicCacheValue(
    buildComicCacheKey('subtype-posters', getVisibilityCacheSegment(includeNsfw)),
    LIST_CACHE_TTL_SECONDS,
    () => querySubtypePosterMap(includeNsfw),
  );
}
