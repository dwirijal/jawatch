import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';
import { hasNsfwLabel } from '@/lib/media-safety';
import type { MovieCardItem } from '@/lib/types';
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

type MovieCastItem = {
  id: string | number;
  name: string;
  role?: string;
};

type MovieCatalogRow = {
  item_key: string;
  source: string;
  media_type: string;
  is_nsfw?: boolean | null;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number;
  updated_at: string;
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

const LIST_CACHE_TTL_SECONDS = 60 * 10;
const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
const MOVIE_CACHE_NAMESPACE = 'video-movie-v6';

function visibilitySegment(options: VisibilityOptions): 'auth' | 'public' {
  return options.includeNsfw ? 'auth' : 'public';
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

function isMovieCatalogNsfw(row: Pick<MovieCatalogRow, 'is_nsfw' | 'genres' | 'genre_names' | 'canonical_genre_names' | 'category_names'>): boolean {
  return Boolean(row.is_nsfw) || hasNsfwLabel(row.genres, row.genre_names, row.canonical_genre_names, row.category_names);
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

async function getMovieCatalogRows(options: VisibilityOptions = {}): Promise<MovieCatalogRow[]> {
  const cacheKey = buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'catalog', visibilitySegment(options));
  return rememberComicCacheValue(cacheKey, LIST_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return [];
    }

    const rows = await sql.unsafe<MovieCatalogRow[]>(`
      select
        i.item_key,
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
        (
          select count(*)
          from public.media_units u
          where u.item_key = i.item_key
            and u.unit_type = 'episode'
        )::int as unit_count
      from public.media_items i
      where (
        i.surface_type = 'movie'
        or (i.surface_type = 'unknown' and i.media_type = 'movie')
      )
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
      order by i.updated_at desc
    `);

    return rows;
  });
}

function sortMovieRows(rows: MovieCatalogRow[], section: 'popular' | 'latest' | 'trending'): MovieCatalogRow[] {
  const nextRows = [...rows];

  if (section === 'latest') {
    return nextRows.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
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
    return rightScore - leftScore || right.updated_at.localeCompare(left.updated_at);
  });
}

export async function getMovieHomeItems(limit = 6): Promise<MovieCardItem[]> {
  return getMovieHomeItemsWithOptions(limit);
}

export async function getMovieHomeItemsWithOptions(limit = 6, options: VisibilityOptions = {}): Promise<MovieCardItem[]> {
  const rows = sortMovieRows(await getMovieCatalogRows(options), 'popular').slice(0, Math.max(1, limit));
  return rows.map(mapMovieCard);
}

export async function getMovieHomeSection(
  section: 'popular' | 'latest' | 'trending',
  limit = 24,
  options: VisibilityOptions = {},
): Promise<MovieCardItem[]> {
  const rows = sortMovieRows(await getMovieCatalogRows(options), section).slice(0, Math.max(1, limit));
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

  const rows = sortMovieRows(
    (await getMovieCatalogRows(options)).filter((row) =>
      getMovieCatalogGenres(row).some((entry) => entry.toLowerCase() === needle)
    ),
    'popular',
  );

  return rows.slice(0, Math.max(1, limit)).map(mapMovieCard);
}

export async function getNsfwMovieItems(limit = 24): Promise<MovieCardItem[]> {
  const rows = await getMovieCatalogRows({ includeNsfw: true });
  return sortMovieRows(rows.filter(isMovieCatalogNsfw), 'popular')
    .slice(0, Math.max(1, limit))
    .map(mapMovieCard);
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
    const sql = getComicDb();
    if (!sql) {
      return [];
    }

    const rows = await sql.unsafe<MovieCatalogRow[]>(`
      select
        i.item_key,
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
        (
          select count(*)
          from public.media_units u
          where u.item_key = i.item_key
            and u.unit_type = 'episode'
        )::int as unit_count
      from public.media_items i
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where (
        i.surface_type = 'movie'
        or (i.surface_type = 'unknown' and i.media_type = 'movie')
      )
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
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
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql<VideoItemRow[]>`
      select
        i.item_key,
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
      where (
        i.surface_type = 'movie'
        or (i.surface_type = 'unknown' and i.media_type = 'movie')
      )
        and i.slug = ${normalizedSlug}
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

    const relatedRows = sortMovieRows(
      (await getMovieCatalogRows(options)).filter((entry) => entry.slug !== row.slug),
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
      externalUrl: `/movies/watch/${row.slug}`,
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
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql<VideoUnitRow[]>`
      select
        u.item_key,
        i.slug as item_slug,
        i.title as item_title,
        i.media_type,
        i.cover_url,
        i.detail as item_detail,
        e.payload as item_tmdb_payload,
        u.slug,
        u.title,
        u.label,
        u.number,
        u.prev_slug,
        u.next_slug,
        u.published_at,
        u.detail
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where (
        i.surface_type = 'movie'
        or (i.surface_type = 'unknown' and i.media_type = 'movie')
      )
        and u.unit_type = 'episode'
        and i.slug = ${normalizedSlug}
      order by u.updated_at desc
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const detail = readRecord(row.detail);
    const itemDetail = getMovieItemDetailRecord(row);
    if (!options.includeNsfw && isVideoNsfw(itemDetail)) {
      return null;
    }

    const mirrors = buildMirrorEntries(detail);
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
      downloadGroups: buildDownloadGroups(detail),
    };
  });
}
