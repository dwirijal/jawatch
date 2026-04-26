import 'server-only';

import { normalizeChapterDetailPayload } from './comic-chapter-normalization.ts';
import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { shouldUseComicGateway } from '../server/comic-origin.ts';
import type {
  ChapterDetail,
  JikanEnrichment,
  MangaDetail,
  MangaSearchResult,
} from '../types.ts';
import {
  CHAPTER_CACHE_TTL_SECONDS,
  DETAIL_CACHE_TTL_SECONDS,
  fetchComicGatewayJson,
  getMangaSubtype,
  getVisibilityCacheSegment,
  queryComicChapter,
  queryComicDetail,
  queryComicJikanEnrichment,
  recordComicAccess,
} from './comic-server-shared.ts';

export async function getMangaDetail(
  slug: string,
  options: { includeNsfw?: boolean; recordAccess?: boolean } = {},
): Promise<MangaDetail> {
  const includeNsfw = options.includeNsfw === true;
  if (shouldUseComicGateway()) {
    return rememberComicCacheValue(
      buildComicCacheKey('detail', getVisibilityCacheSegment(includeNsfw), slug),
      DETAIL_CACHE_TTL_SECONDS,
      () => fetchComicGatewayJson<MangaDetail>(`/api/comic/title/${encodeURIComponent(slug)}`, {
        includeNsfw,
        recordAccess: options.recordAccess === true,
      }),
    );
  }

  const detail = await rememberComicCacheValue<MangaDetail>(
    buildComicCacheKey('detail', getVisibilityCacheSegment(includeNsfw), slug),
    DETAIL_CACHE_TTL_SECONDS,
    () => queryComicDetail(slug, includeNsfw),
  );

  if (options.recordAccess) {
    void recordComicAccess({
      slug: detail.slug,
      subtype: detail.subtype ?? getMangaSubtype(detail),
      eventName: 'detail_view',
      weight: 1,
    });
  }

  return detail;
}

export async function getComicJikanEnrichment(
  slug: string,
  options: { includeNsfw?: boolean } = {},
): Promise<JikanEnrichment | null> {
  const includeNsfw = options.includeNsfw === true;
  if (shouldUseComicGateway()) {
    return rememberComicCacheValue(
      buildComicCacheKey('detail', 'jikan', getVisibilityCacheSegment(includeNsfw), slug),
      DETAIL_CACHE_TTL_SECONDS,
      () => fetchComicGatewayJson<JikanEnrichment | null>(`/api/comic/jikan/${encodeURIComponent(slug)}`, {
        includeNsfw,
      }),
    );
  }

  return rememberComicCacheValue(
    buildComicCacheKey('detail', 'jikan', getVisibilityCacheSegment(includeNsfw), slug),
    DETAIL_CACHE_TTL_SECONDS,
    () => queryComicJikanEnrichment(slug, includeNsfw),
  );
}

export async function getMangaChapter(
  slug: string,
  options: { includeNsfw?: boolean; recordAccess?: boolean; comicSlug?: string } = {},
): Promise<ChapterDetail> {
  const includeNsfw = 'includeNsfw' in options && options.includeNsfw === true;
  const comicSlug = options.comicSlug?.trim() || '';
  const cacheKey = comicSlug
    ? buildComicCacheKey('chapter', getVisibilityCacheSegment(includeNsfw), comicSlug, slug)
    : buildComicCacheKey('chapter', getVisibilityCacheSegment(includeNsfw), slug);

  if (shouldUseComicGateway()) {
    return rememberComicCacheValue(
      cacheKey,
      CHAPTER_CACHE_TTL_SECONDS,
      async () => normalizeChapterDetailPayload(
        await fetchComicGatewayJson<ChapterDetail>(`/api/comic/chapter/${encodeURIComponent(slug)}`, {
          includeNsfw,
          recordAccess: options.recordAccess === true,
        }),
      ),
    );
  }

  const normalizedChapter = await rememberComicCacheValue(
    cacheKey,
    CHAPTER_CACHE_TTL_SECONDS,
    async () => normalizeChapterDetailPayload(await queryComicChapter(slug, includeNsfw, comicSlug)),
  );

  if (options.recordAccess) {
    void recordComicAccess({
      slug: normalizedChapter.manga_slug || slug,
      subtype: normalizedChapter.subtype ?? 'manga',
      eventName: 'chapter_view',
      weight: 3,
    });
  }

  return normalizedChapter;
}

export async function getMangaRecommendations(slug: string): Promise<{ recommendations: MangaSearchResult[] }> {
  const detail = await getMangaDetail(slug);
  return {
    recommendations: detail.similar_manga.map((item) => ({
      title: item.title,
      altTitle: null,
      slug: item.slug,
      href: item.link,
      thumbnail: item.image,
      type: item.type || 'Manga',
      subtype: getMangaSubtype(item),
      genre: '',
      description: item.description || '',
      link: item.link,
      image: item.image,
    })),
  };
}
