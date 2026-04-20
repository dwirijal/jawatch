import 'server-only';

import { unstable_cache } from 'next/cache';
import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { getComicDb } from '../server/comic-db.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemKeySelection,
  buildCanonicalItemLateralSubquery,
  getComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import { shouldUseComicGateway } from '../server/comic-origin.ts';
import type { MovieCardItem } from '../types.ts';
import { buildVisibilityCondition } from './video-db-common.ts';
import type { VisibilityOptions } from './video-db.ts';
import {
  buildMovieCanonicalShadowFilter,
  buildMovieGenreMatchCondition,
  buildMovieItemSlugExpression,
  buildMovieScopeCondition,
  collapseCanonicalMovieRows,
  fetchMovieGatewayJson,
  mapMovieCard,
  MOVIE_CACHE_NAMESPACE,
  MOVIE_CANDIDATE_MULTIPLIER,
  queryMovieCatalogRows,
  SEARCH_CACHE_TTL_SECONDS,
  sortMovieRows,
  type MovieCatalogRow,
  type MovieHubData,
  visibilitySegment,
} from './movie-shared.ts';

export async function getMovieHomeItems(limit = 6): Promise<MovieCardItem[]> {
  return getMovieHomeItemsWithOptions(limit);
}

export async function getMovieHomeItemsWithOptions(limit = 6, options: VisibilityOptions = {}): Promise<MovieCardItem[]> {
  return getMovieHomeSection('popular', limit, options);
}

async function loadMovieHomeSection(
  section: 'popular' | 'latest' | 'trending',
  limit: number,
  includeNsfw: boolean,
): Promise<MovieCardItem[]> {
  const normalizedLimit = Math.max(1, limit);
  const candidateLimit = section === 'latest' ? normalizedLimit : normalizedLimit * MOVIE_CANDIDATE_MULTIPLIER;
  const candidateOrder = section === 'latest'
    ? 'i.updated_at desc'
    : 'i.score desc nulls last, coalesce(unit_counts.unit_count, 0) desc, i.updated_at desc';
  const rows = sortMovieRows(
    await queryMovieCatalogRows({
      includeNsfw,
      orderBy: candidateOrder,
      limit: candidateLimit,
    }),
    section,
  ).slice(0, normalizedLimit);
  return rows.map(mapMovieCard);
}

const getPublicMovieHomeSection = unstable_cache(
  async (section: 'popular' | 'latest' | 'trending', limit: number) => loadMovieHomeSection(section, limit, false),
  [MOVIE_CACHE_NAMESPACE, 'section', 'public'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

const getAuthenticatedMovieHomeSection = unstable_cache(
  async (section: 'popular' | 'latest' | 'trending', limit: number) => loadMovieHomeSection(section, limit, true),
  [MOVIE_CACHE_NAMESPACE, 'section', 'auth'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

export async function getMovieHomeSection(
  section: 'popular' | 'latest' | 'trending',
  limit = 24,
  options: VisibilityOptions = {},
): Promise<MovieCardItem[]> {
  if (shouldUseComicGateway()) {
    const includeNsfw = Boolean(options.includeNsfw);
    const path = section === 'latest' ? '/api/movies/latest' : '/api/movies/popular';
    return rememberComicCacheValue(
      buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'section', section, visibilitySegment(options), limit),
      SEARCH_CACHE_TTL_SECONDS,
      () => fetchMovieGatewayJson<MovieCardItem[]>(path, { limit, includeNsfw }),
    );
  }

  const normalizedLimit = Math.max(1, limit);
  return Boolean(options.includeNsfw)
    ? getAuthenticatedMovieHomeSection(section, normalizedLimit)
    : getPublicMovieHomeSection(section, normalizedLimit);
}

export async function getMovieHubData(
  limit = 24,
  options: VisibilityOptions = {},
): Promise<MovieHubData> {
  const [popular, latest] = await Promise.all([
    getMovieHomeSection('popular', limit, options),
    getMovieHomeSection('latest', limit, options),
  ]);

  return { popular, latest };
}

async function loadMovieGenreItems(
  genre: string,
  limit: number,
  includeNsfw: boolean,
): Promise<MovieCardItem[]> {
  const needle = genre.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const rows = sortMovieRows(
    await queryMovieCatalogRows({
      includeNsfw,
      extraWhere: buildMovieGenreMatchCondition('i'),
      params: [needle],
      orderBy: 'i.score desc nulls last, coalesce(unit_counts.unit_count, 0) desc, i.updated_at desc',
      limit: Math.max(1, limit) * MOVIE_CANDIDATE_MULTIPLIER,
    }),
    'popular',
  );

  return rows.slice(0, Math.max(1, limit)).map(mapMovieCard);
}

const getPublicMovieGenreItems = unstable_cache(
  async (genre: string, limit: number) => loadMovieGenreItems(genre, limit, false),
  [MOVIE_CACHE_NAMESPACE, 'genre', 'public'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

const getAuthenticatedMovieGenreItems = unstable_cache(
  async (genre: string, limit: number) => loadMovieGenreItems(genre, limit, true),
  [MOVIE_CACHE_NAMESPACE, 'genre', 'auth'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

export async function getMovieGenreItems(
  genre: string,
  limit = 24,
  options: VisibilityOptions = {},
): Promise<MovieCardItem[]> {
  const needle = genre.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  if (shouldUseComicGateway()) {
    return rememberComicCacheValue(
      buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'genre', visibilitySegment(options), needle, limit),
      SEARCH_CACHE_TTL_SECONDS,
      () => fetchMovieGatewayJson<MovieCardItem[]>('/api/movies/genre', {
        genre: needle,
        limit,
        includeNsfw: Boolean(options.includeNsfw),
      }),
    );
  }

  const normalizedLimit = Math.max(1, limit);
  return Boolean(options.includeNsfw)
    ? getAuthenticatedMovieGenreItems(needle, normalizedLimit)
    : getPublicMovieGenreItems(needle, normalizedLimit);
}

export async function searchMovieCatalog(
  query: string,
  limit = 8,
  options: VisibilityOptions = {},
): Promise<MovieCardItem[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const cacheKey = buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'search', visibilitySegment(options), normalizedQuery, limit);
  return rememberComicCacheValue(cacheKey, SEARCH_CACHE_TTL_SECONDS, async () => {
    if (shouldUseComicGateway()) {
      return fetchMovieGatewayJson<MovieCardItem[]>('/api/search/movies', {
        q: normalizedQuery,
        limit,
        includeNsfw: Boolean(options.includeNsfw),
      });
    }

    const sql = getComicDb();
    if (!sql) {
      return [];
    }

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const rows = await sql.unsafe<MovieCatalogRow[]>(`
      select
        i.item_key,
        ${buildCanonicalItemKeySelection('i', schemaCapabilities)} as canonical_item_key,
        ${buildCanonicalItemFlagSelection('i', schemaCapabilities)},
        i.source,
        i.media_type,
        i.is_nsfw,
        ${buildMovieItemSlugExpression('i')} as slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.updated_at,
        i.detail ->> 'poster_url' as poster_url,
        coalesce(
          i.detail ->> 'background_url',
          i.detail ->> 'background',
          i.detail ->> 'background_image',
          i.detail ->> 'backdrop_url',
          i.detail ->> 'backdrop',
          f.payload ->> 'background_url',
          f.payload ->> 'background',
          f.payload ->> 'backdrop_url',
          f.payload ->> 'backdrop',
          e.payload ->> 'background_url',
          e.payload ->> 'background',
          e.payload ->> 'backdrop_url',
          e.payload ->> 'backdrop'
        ) as background_url,
        coalesce(
          i.detail ->> 'backdrop_url',
          i.detail ->> 'backdrop',
          f.payload ->> 'backdrop_url',
          f.payload ->> 'backdrop',
          e.payload ->> 'backdrop_url',
          e.payload ->> 'backdrop',
          i.detail ->> 'background_url',
          i.detail ->> 'background'
        ) as backdrop_url,
        coalesce(
          i.detail ->> 'logo_url',
          i.detail ->> 'logo',
          i.detail ->> 'title_logo',
          i.detail ->> 'title_logo_url',
          f.payload ->> 'logo_url',
          f.payload ->> 'logo',
          f.payload ->> 'clearlogo',
          f.payload ->> 'clearlogo_url',
          e.payload ->> 'logo_url',
          e.payload ->> 'logo'
        ) as logo_url,
        coalesce(i.detail ->> 'release_year', i.detail ->> 'year') as detail_year,
        i.detail ->> 'rating' as detail_rating,
        coalesce(i.detail ->> 'overview', e.payload ->> 'overview') as overview,
        coalesce(i.detail ->> 'synopsis', e.payload ->> 'synopsis') as synopsis,
        i.detail -> 'genres' as genres,
        i.detail -> 'genre_names' as genre_names,
        to_jsonb(i.genre_names) as canonical_genre_names,
        i.detail -> 'category_names' as category_names,
        coalesce(unit_counts.unit_count, 0)::int as unit_count
      from public.media_items i
      left join lateral (
        ${buildCanonicalItemLateralSubquery('cl', 'i', schemaCapabilities.itemLinks)}
      ) cl on true
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      left join public.media_item_enrichments f
        on f.item_key = i.item_key
       and f.provider = 'fanart'
       and f.match_status = 'matched'
      left join lateral (
        select
          count(*)::int as unit_count
        from public.media_units u
        where u.item_key = i.item_key
          and u.unit_type in ('movie', 'episode')
      ) unit_counts on true
      where ${buildMovieScopeCondition('i')}
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        ${buildMovieCanonicalShadowFilter('i', schemaCapabilities)}
        and (
          search_vec @@ plainto_tsquery('simple', $1)
          or title ilike $2
          or coalesce(i.detail ->> 'overview', i.detail ->> 'synopsis', e.payload ->> 'overview', e.payload ->> 'synopsis', '') ilike $2
        )
      order by
        ts_rank_cd(search_vec, plainto_tsquery('simple', $1)) desc,
        score desc nulls last,
        updated_at desc
      limit $3
    `, [normalizedQuery, `%${normalizedQuery}%`, Math.max(1, limit) * 4]);

    return collapseCanonicalMovieRows(rows, { limit: Math.max(1, limit) }).map(mapMovieCard);
  });
}
