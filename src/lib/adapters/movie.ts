import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import {
  buildComicGatewayUrl,
  readComicOriginSharedToken,
  shouldUseComicGateway,
} from '@/lib/server/comic-origin';
import type { MovieCardItem } from '@/lib/types';
import { compareMovieUpdatedAtDesc } from '@/lib/adapters/movie-sort';
import { buildVisibilityCondition } from '@/lib/adapters/video-db-common';
import {
  buildDownloadGroups,
  buildMirrorEntries,
  extractPopularityScore,
  getVideoGenres,
  isVideoNsfw,
  normalizePosterUrl,
  readArray,
  readNumber,
  readRecord,
  readStringArray,
  readText,
  type VideoItemRow,
  type VideoUnitRow,
  type VisibilityOptions,
} from '@/lib/adapters/video-db';
import { readCanonicalPlaybackOptions } from '@/lib/adapters/video-db-common';

type MovieCastItem = {
  id: string | number;
  name: string;
  role?: string;
};

type MovieCatalogRow = {
  item_key: string;
  is_canonical?: boolean | null;
  source: string;
  media_type: string;
  is_nsfw?: boolean | null;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number;
  updated_at: Date | string;
  unit_count?: number | null;
  poster_url?: string | null;
  detail_year?: string | null;
  detail_rating?: string | null;
  overview?: string | null;
  synopsis?: string | null;
  genres?: unknown;
  genre_names?: unknown;
  canonical_genre_names?: unknown;
  category_names?: unknown;
};

export type MovieMirror = {
  label: string;
  embed_url: string;
};

type MovieDownloadLink = {
  label: string;
  href: string;
};

export type MovieDownloadGroup = {
  format: string;
  quality: string;
  links: MovieDownloadLink[];
};

export type MovieDetailData = {
  slug: string;
  title: string;
  poster: string;
  backdrop: string;
  year: string;
  rating: string;
  genres: string[];
  quality: string;
  duration: string;
  synopsis: string;
  cast: MovieCastItem[];
  director: string;
  trailerUrl: string | null;
  externalUrl: string;
  recommendations: MovieCardItem[];
};

export type MovieWatchData = {
  slug: string;
  title: string;
  poster: string;
  backdrop: string;
  year: string;
  rating: string;
  quality: string;
  duration: string;
  synopsis: string;
  mirrors: MovieMirror[];
  defaultUrl: string;
  canInlinePlayback: boolean;
  externalUrl: string;
  detailHref: string;
  downloadGroups: MovieDownloadGroup[];
};

export type MovieSupabaseDetail = MovieDetailData;
export type MovieSupabaseWatch = MovieWatchData;

const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
const MOVIE_CACHE_NAMESPACE = 'video-movie-v6';
const MOVIE_CANDIDATE_MULTIPLIER = 4;

async function fetchMovieGatewayJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  const token = readComicOriginSharedToken();
  if (token) {
    headers.set('x-comic-origin-token', token);
  }

  const response = await fetchWithTimeout(buildComicGatewayUrl(path, params), {
    headers,
    cache: 'no-store',
    timeoutMs: 10_000,
    retries: 1,
  });

  if (!response.ok) {
    throw new Error(`Movie gateway ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchOptionalMovieGatewayJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  try {
    return await fetchMovieGatewayJson<T>(path, params);
  } catch (error) {
    if (error instanceof Error && error.message.endsWith(' 404')) {
      return null;
    }
    throw error;
  }
}

function buildMovieScopeCondition(alias: string): string {
  return `(
    ${alias}.surface_type = 'movie'
    or (${alias}.surface_type = 'unknown' and ${alias}.media_type = 'movie')
  )`;
}

function buildMovieCanonicalShadowCondition(alias: string): string {
  return `
    and (
      coalesce(${alias}.is_canonical, false) = true
      or not exists (
        select 1
        from public.media_items canonical_item
        where canonical_item.slug = ${alias}.slug
          and ${buildMovieScopeCondition('canonical_item')}
          and coalesce(canonical_item.is_canonical, false) = true
      )
    )
  `;
}

function visibilitySegment(options: VisibilityOptions): 'auth' | 'public' {
  return options.includeNsfw ? 'auth' : 'public';
}

function buildMovieCatalogSelect(includeNsfw: boolean): string {
  return `
      select
        i.item_key,
        i.is_canonical,
        i.source,
        i.media_type,
        i.is_nsfw,
        i.slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.updated_at,
        i.detail ->> 'poster_url' as poster_url,
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
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      left join (
        select
          u.item_key,
          count(*)::int as unit_count
        from public.media_units u
        where u.unit_type in ('movie', 'episode')
        group by u.item_key
      ) unit_counts on unit_counts.item_key = i.item_key
      where ${buildMovieScopeCondition('i')}
        ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
        ${buildMovieCanonicalShadowCondition('i')}
  `;
}

function buildMovieGenreMatchCondition(alias: string, paramRef = '$1'): string {
  return `
    (
      exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(${alias}.detail->'genres') = 'array' then ${alias}.detail->'genres'
            when jsonb_typeof(${alias}.detail->'genre_names') = 'array' then ${alias}.detail->'genre_names'
            when jsonb_typeof(${alias}.detail->'category_names') = 'array' then ${alias}.detail->'category_names'
            else '[]'::jsonb
          end
        ) as genre_name(value)
        where lower(genre_name.value) = ${paramRef}
      )
      or exists (
        select 1
        from unnest(coalesce(${alias}.genre_names, '{}'::text[])) as canonical_genre(value)
        where lower(canonical_genre.value) = ${paramRef}
      )
    )
  `;
}

function buildMovieGenreAnyMatchCondition(alias: string, paramRef: string): string {
  return `
    (
      exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(${alias}.detail->'genres') = 'array' then ${alias}.detail->'genres'
            when jsonb_typeof(${alias}.detail->'genre_names') = 'array' then ${alias}.detail->'genre_names'
            when jsonb_typeof(${alias}.detail->'category_names') = 'array' then ${alias}.detail->'category_names'
            else '[]'::jsonb
          end
        ) as genre_name(value)
        where lower(genre_name.value) = any(${paramRef})
      )
      or exists (
        select 1
        from unnest(coalesce(${alias}.genre_names, '{}'::text[])) as canonical_genre(value)
        where lower(canonical_genre.value) = any(${paramRef})
      )
    )
  `;
}

async function queryMovieCatalogRows(
  {
    includeNsfw,
    extraWhere = '',
    params = [],
    orderBy = 'i.updated_at desc',
    limit,
  }: {
    includeNsfw: boolean;
    extraWhere?: string;
    params?: unknown[];
    orderBy?: string;
    limit?: number;
  },
): Promise<MovieCatalogRow[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.trunc(limit)) : null;
  const queryParams = [...params];
  let query = buildMovieCatalogSelect(includeNsfw);
  if (extraWhere.trim()) {
    query += ` and (${extraWhere})`;
  }
  query += ` order by ${orderBy}`;
  if (normalizedLimit != null) {
    queryParams.push(normalizedLimit);
    query += ` limit $${queryParams.length}`;
  }

  return sql.unsafe<MovieCatalogRow[]>(query, queryParams);
}

function getMovieDetailRecord(row: Pick<VideoItemRow, 'detail' | 'tmdb_payload'>): Record<string, unknown> {
  return {
    ...readRecord(row.detail),
    ...readRecord(row.tmdb_payload),
  };
}

function getMovieItemDetailRecord(row: Pick<VideoUnitRow, 'item_detail' | 'item_tmdb_payload'>): Record<string, unknown> {
  return {
    ...readRecord(row.item_detail),
    ...readRecord(row.item_tmdb_payload),
  };
}

function mergeMovieCatalogLabels(...values: unknown[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const value of values) {
    for (const label of readStringArray(value)) {
      if (/\bviews?\b/i.test(label) || /\bloves?\b/i.test(label)) {
        continue;
      }

      const key = label.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      labels.push(label);
    }
  }

  return labels;
}

function getMovieCatalogGenres(row: Pick<MovieCatalogRow, 'genres' | 'genre_names' | 'canonical_genre_names' | 'category_names'>): string[] {
  const labels = mergeMovieCatalogLabels(row.genres, row.genre_names, row.canonical_genre_names, row.category_names);
  if (labels.length > 0) {
    return labels;
  }

  return getVideoGenres({
    genres: row.genres,
    genre_names: row.genre_names,
    category_names: row.category_names,
  });
}

function formatCatalogYear(row: Pick<MovieCatalogRow, 'release_year' | 'detail_year'>): string {
  if (row.release_year) {
    return String(row.release_year);
  }

  const detailYear = readNumber(row.detail_year);
  if (detailYear && detailYear > 0) {
    return String(Math.round(detailYear));
  }

  return readText(row.detail_year) || 'N/A';
}

function formatYear(row: VideoItemRow): string {
  const detail = getMovieDetailRecord(row);
  if (row.release_year) {
    return String(row.release_year);
  }

  const detailYear = readNumber(detail.release_year) ?? readNumber(detail.year);
  if (detailYear && detailYear > 0) {
    return String(Math.round(detailYear));
  }

  return readText(detail.year) || readText(detail.release_year) || 'N/A';
}

function formatDuration(detail: Record<string, unknown>): string {
  const runtime =
    readNumber(detail.runtime_minutes) ??
    readNumber(detail.duration_minutes) ??
    readNumber(detail.runtime);

  if (runtime && runtime > 0) {
    return `${Math.round(runtime)} min`;
  }

  return readText(detail.duration) || 'N/A';
}

function formatRating(row: VideoItemRow): string {
  const detail = getMovieDetailRecord(row);
  const rating =
    readNumber(detail.rating) ??
    readNumber(detail.score) ??
    (row.score > 0 ? row.score : null);

  return rating && rating > 0 ? rating.toFixed(1) : 'N/A';
}

function formatCatalogRating(row: Pick<MovieCatalogRow, 'detail_rating' | 'score'>): string {
  const rating = readNumber(row.detail_rating) ?? (row.score > 0 ? row.score : null);
  return rating && rating > 0 ? rating.toFixed(1) : 'N/A';
}

function mapMovieCard(row: MovieCatalogRow): MovieCardItem {
  return {
    slug: row.slug,
    title: row.title,
    poster: normalizePosterUrl(readText(row.poster_url) || readText(row.cover_url)),
    year: formatCatalogYear(row),
    type: 'movie',
    rating: formatCatalogRating(row),
    status: readText(row.status),
    genres: getMovieCatalogGenres(row).join(', '),
  };
}

function mapMovieCast(detail: Record<string, unknown>): MovieCastItem[] {
  const items: MovieCastItem[] = [];

  for (const [index, entry] of readArray(detail.cast).entries()) {
    const record = readRecord(entry);
    const name = readText(record.name) || readText(record.title);
    if (!name) {
      continue;
    }

    items.push({
      id: readText(record.id) || index,
      name,
      role: readText(record.role) || undefined,
    });
  }

  return items;
}

function sortMovieRows(rows: MovieCatalogRow[], section: 'popular' | 'latest' | 'trending'): MovieCatalogRow[] {
  const nextRows = [...rows];

  if (section === 'latest') {
    return nextRows.sort(compareMovieUpdatedAtDesc);
  }

  return nextRows.sort((left, right) => {
    const leftScore = extractPopularityScore({
      genres: left.genres,
      genre_names: left.genre_names,
      category_names: left.category_names,
    }) + (left.score || 0) * 100 + (left.unit_count || 0) * 10;
    const rightScore = extractPopularityScore({
      genres: right.genres,
      genre_names: right.genre_names,
      category_names: right.category_names,
    }) + (right.score || 0) * 100 + (right.unit_count || 0) * 10;
    return rightScore - leftScore || compareMovieUpdatedAtDesc(left, right);
  });
}

export async function getMovieHomeItems(limit = 6): Promise<MovieCardItem[]> {
  return getMovieHomeItemsWithOptions(limit);
}

export async function getMovieHomeItemsWithOptions(limit = 6, options: VisibilityOptions = {}): Promise<MovieCardItem[]> {
  return getMovieHomeSection('popular', limit, options);
}

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
  const candidateLimit = section === 'latest' ? normalizedLimit : normalizedLimit * MOVIE_CANDIDATE_MULTIPLIER;
  const candidateOrder = section === 'latest'
    ? 'i.updated_at desc'
    : 'i.score desc nulls last, coalesce(unit_counts.unit_count, 0) desc, i.updated_at desc';
  const rows = sortMovieRows(
    await queryMovieCatalogRows({
      includeNsfw: Boolean(options.includeNsfw),
      orderBy: candidateOrder,
      limit: candidateLimit,
    }),
    section,
  ).slice(0, normalizedLimit);
  return rows.map(mapMovieCard);
}

export async function getMovieHubData(
  limit = 24,
  options: VisibilityOptions = {},
): Promise<{ popular: MovieCardItem[]; latest: MovieCardItem[] }> {
  const [popular, latest] = await Promise.all([
    getMovieHomeSection('popular', limit, options),
    getMovieHomeSection('latest', limit, options),
  ]);

  return { popular, latest };
}

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

  const rows = sortMovieRows(
    await queryMovieCatalogRows({
      includeNsfw: Boolean(options.includeNsfw),
      extraWhere: buildMovieGenreMatchCondition('i'),
      params: [needle],
      orderBy: 'i.score desc nulls last, coalesce(unit_counts.unit_count, 0) desc, i.updated_at desc',
      limit: Math.max(1, limit) * MOVIE_CANDIDATE_MULTIPLIER,
    }),
    'popular',
  );

  return rows.slice(0, Math.max(1, limit)).map(mapMovieCard);
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

    const rows = await sql.unsafe<MovieCatalogRow[]>(`
      select
        i.item_key,
        i.is_canonical,
        i.source,
        i.media_type,
        i.is_nsfw,
        i.slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.updated_at,
        i.detail ->> 'poster_url' as poster_url,
        coalesce(i.detail ->> 'release_year', i.detail ->> 'year') as detail_year,
        i.detail ->> 'rating' as detail_rating,
        i.detail ->> 'overview' as overview,
        i.detail ->> 'synopsis' as synopsis,
        i.detail -> 'genres' as genres,
        i.detail -> 'genre_names' as genre_names,
        to_jsonb(i.genre_names) as canonical_genre_names,
        i.detail -> 'category_names' as category_names,
        coalesce(unit_counts.unit_count, 0)::int as unit_count
      from public.media_items i
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      left join (
        select
          u.item_key,
          count(*)::int as unit_count
        from public.media_units u
        where u.unit_type in ('movie', 'episode')
        group by u.item_key
      ) unit_counts on unit_counts.item_key = i.item_key
      where ${buildMovieScopeCondition('i')}
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        ${buildMovieCanonicalShadowCondition('i')}
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
    `, [normalizedQuery, `%${normalizedQuery}%`, Math.max(1, limit)]);

    return rows.map(mapMovieCard);
  });
}

export async function getMovieDetailBySlug(slug: string, options: VisibilityOptions = {}): Promise<MovieDetailData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const cacheKey = buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'detail', visibilitySegment(options), normalizedSlug);
  return rememberComicCacheValue(cacheKey, DETAIL_CACHE_TTL_SECONDS, async () => {
    if (shouldUseComicGateway()) {
      return fetchOptionalMovieGatewayJson<MovieDetailData>(`/api/movies/detail/${encodeURIComponent(normalizedSlug)}`, {
        includeNsfw: Boolean(options.includeNsfw),
      });
    }

    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql<VideoItemRow[]>`
      select
        i.item_key,
        i.is_canonical,
        i.source,
        i.media_type,
        i.slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.detail,
        e.payload as tmdb_payload,
        i.updated_at,
        0::int as unit_count
      from public.media_items i
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where ${buildMovieScopeCondition('i')}
        and i.slug = ${normalizedSlug}
      order by coalesce(i.is_canonical, false) desc, i.updated_at desc
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const detail = getMovieDetailRecord(row);
    if (!options.includeNsfw && isVideoNsfw(detail)) {
      return null;
    }

    const recommendationNeedles = getVideoGenres(detail)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    const recommendationCountry = readText(detail.country).trim().toLowerCase();
    const relatedRows = sortMovieRows(
      await queryMovieCatalogRows({
        includeNsfw: Boolean(options.includeNsfw),
        extraWhere: (() => {
          const clauses = ['i.slug <> $1'];
          if (recommendationNeedles.length > 0) {
            clauses.push(buildMovieGenreAnyMatchCondition('i', '$2'));
          }
          if (recommendationCountry) {
            clauses.push(`lower(coalesce(i.detail ->> 'country', i.detail ->> 'region', '')) = $${recommendationNeedles.length > 0 ? 3 : 2}`);
          }
          return clauses.join(' and ');
        })(),
        params: (() => {
          const queryParams: unknown[] = [row.slug];
          if (recommendationNeedles.length > 0) {
            queryParams.push(recommendationNeedles);
          }
          if (recommendationCountry) {
            queryParams.push(recommendationCountry);
          }
          return queryParams;
        })(),
        orderBy: 'i.score desc nulls last, coalesce(unit_counts.unit_count, 0) desc, i.updated_at desc',
        limit: 32,
      }),
      'popular',
    );

    return {
      slug: row.slug,
      title: row.title,
      poster: normalizePosterUrl(readText(detail.poster_url) || readText(row.cover_url)),
      backdrop: normalizePosterUrl(readText(detail.backdrop_url) || readText(detail.poster_url) || readText(row.cover_url)),
      year: formatYear(row),
      rating: formatRating(row),
      genres: getVideoGenres(detail),
      quality: readText(detail.quality) || 'STREAM',
      duration: formatDuration(detail),
      synopsis: readText(detail.overview) || readText(detail.synopsis) || 'Synopsis is not available yet.',
      cast: mapMovieCast(detail),
      director: readText(detail.director) || readStringArray(detail.directors)[0] || '',
      trailerUrl: readText(detail.trailer_url) || null,
      externalUrl: `/movies/${row.slug}`,
      recommendations: relatedRows.slice(0, 8).map(mapMovieCard),
    };
  });
}

export async function getMovieWatchBySlug(slug: string, options: VisibilityOptions = {}): Promise<MovieWatchData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const cacheKey = buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'watch', visibilitySegment(options), normalizedSlug);
  return rememberComicCacheValue(cacheKey, DETAIL_CACHE_TTL_SECONDS, async () => {
    if (shouldUseComicGateway()) {
      return fetchOptionalMovieGatewayJson<MovieWatchData>(`/api/movies/watch/${encodeURIComponent(normalizedSlug)}`, {
        includeNsfw: Boolean(options.includeNsfw),
      });
    }

    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql.unsafe<Array<VideoUnitRow & { canonical_unit_key?: string | null }>>(`
      with selected_item as (
        select
          i.item_key,
          coalesce(i.is_canonical, false) as is_canonical,
          exists (
            select 1
            from public.media_units candidate_units
            where candidate_units.item_key = i.item_key
              and candidate_units.unit_type in ('movie', 'episode')
          ) as has_units,
          i.slug as item_slug,
          i.title as item_title,
          i.media_type,
          i.cover_url,
          i.detail as item_detail,
          e.payload as item_tmdb_payload
        from public.media_items i
        left join public.media_item_enrichments e
          on e.item_key = i.item_key
         and e.provider = 'tmdb'
         and e.match_status = 'matched'
        where ${buildMovieScopeCondition('i')}
          and i.slug = $1
        order by has_units desc, coalesce(i.is_canonical, false) desc, i.updated_at desc
        limit 1
      )
      select
        u.item_key,
        si.item_slug,
        si.item_title,
        si.media_type,
        si.cover_url,
        si.item_detail,
        si.item_tmdb_payload,
        u.slug,
        u.title,
        u.label,
        u.number,
        u.prev_slug,
        u.next_slug,
        u.published_at,
        u.detail,
        coalesce(
          case when coalesce(u.is_canonical, false) then u.unit_key end,
          (
            select mul.canonical_unit_key
            from public.media_unit_links mul
            where mul.source_unit_key = u.unit_key
            order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
            limit 1
          )
        ) as canonical_unit_key
      from selected_item si
      join lateral (
        select
          u.item_key,
          u.unit_key,
          u.slug,
          u.title,
          u.label,
          u.number,
          u.prev_slug,
          u.next_slug,
          u.published_at,
          u.detail,
          u.is_canonical
        from public.media_units u
        where u.item_key = si.item_key
          and u.unit_type in ('movie', 'episode')
        order by coalesce(u.is_canonical, false) desc, u.updated_at desc
        limit 1
      ) u on true
      limit 1
    `, [normalizedSlug]);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const detail = readRecord(row.detail);
    const itemDetail = getMovieItemDetailRecord(row);
    if (!options.includeNsfw && isVideoNsfw(itemDetail)) {
      return null;
    }

    const canonicalPlayback = await readCanonicalPlaybackOptions(sql, row.canonical_unit_key);
    const mirrors = canonicalPlayback.mirrors.length > 0
      ? canonicalPlayback.mirrors
      : buildMirrorEntries(detail);
    const defaultUrl = mirrors[0]?.embed_url || readText(detail.stream_url);

    return {
      slug: row.item_slug,
      title: row.item_title,
      poster: normalizePosterUrl(readText(itemDetail.poster_url) || readText(row.cover_url)),
      backdrop: normalizePosterUrl(readText(itemDetail.backdrop_url) || readText(itemDetail.poster_url) || readText(row.cover_url)),
      year: (
        readNumber(itemDetail.release_year) ??
        readNumber(itemDetail.year)
      )?.toFixed(0) || readText(itemDetail.release_year) || readText(itemDetail.year) || 'N/A',
      rating: readNumber(itemDetail.rating)?.toFixed(1) || 'N/A',
      quality: readText(itemDetail.quality) || 'STREAM',
      duration: formatDuration(itemDetail),
      synopsis: readText(itemDetail.overview) || readText(itemDetail.synopsis) || 'Synopsis is not available yet.',
      mirrors,
      defaultUrl,
      canInlinePlayback: Boolean(defaultUrl),
      externalUrl: defaultUrl || `/movies/${row.item_slug}`,
      detailHref: `/movies/${row.item_slug}`,
      downloadGroups: canonicalPlayback.downloadGroups.length > 0
        ? canonicalPlayback.downloadGroups
        : buildDownloadGroups(detail),
    };
  });
}
