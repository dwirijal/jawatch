import 'server-only';

import { getComicDb } from '../server/comic-db.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemKeySelection,
  buildCanonicalItemShadowCondition,
  buildCanonicalItemLateralSubquery,
  getComicDbSchemaCapabilities,
  type ComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import { fetchWithTimeout } from '../fetch-with-timeout.ts';
import {
  buildComicGatewayUrl,
  readComicOriginSharedToken,
} from '../server/comic-origin.ts';
import type { MovieCardItem } from '../types.ts';
import {
  MEDIA_BACKGROUND_FIELD_CANDIDATES,
  MEDIA_LOGO_FIELD_CANDIDATES,
  pickAssetFromRecord,
  pickAssetUrl,
} from '../utils.ts';
import {
  buildMovieItemSlug,
  buildSqlMovieItemSlugExpression,
} from '../media-slugs.ts';
import { compareMovieUpdatedAtDesc } from './movie-sort.ts';
import { buildVisibilityCondition } from './video-db-common.ts';
import {
  buildLk21ExternalPlayerUrl,
  extractLk21PlaybackId,
  resolveLk21MovieProviderUrl,
} from './movie-lk21-stream-resolver.ts';
import {
  extractPopularityScore,
  getVideoGenres,
  normalizePosterUrl,
  readArray,
  readNumber,
  readRecord,
  readStringArray,
  readText,
  type VideoItemRow,
  type VideoUnitRow,
  type VisibilityOptions,
} from './video-db.ts';
import { normalizeMovieRatingValue } from './movie-rating.ts';

type MovieCastItem = {
  id: string | number;
  name: string;
  role?: string;
};

export type MovieCatalogRow = {
  item_key: string;
  canonical_item_key?: string | null;
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
  background_url?: string | null;
  backdrop_url?: string | null;
  logo_url?: string | null;
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
  background?: string;
  logo?: string;
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
  background?: string;
  logo?: string;
  backdrop: string;
  year: string;
  rating: string;
  quality: string;
  duration: string;
  synopsis: string;
  mirrors: MovieMirror[];
  defaultUrl: string;
  canInlinePlayback: boolean;
  externalUrl: string | null;
  detailHref: string;
  downloadGroups: MovieDownloadGroup[];
};

export type MovieSupabaseDetail = MovieDetailData;
export type MovieSupabaseWatch = MovieWatchData;

export type MovieHubData = {
  popular: MovieCardItem[];
  latest: MovieCardItem[];
};

export const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
export const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
export const MOVIE_CACHE_NAMESPACE = 'video-movie-v9';
export const MOVIE_CANDIDATE_MULTIPLIER = 4;

export function readMovieBackground(detail: Record<string, unknown>): string {
  return pickAssetUrl(
    pickAssetFromRecord(detail, MEDIA_BACKGROUND_FIELD_CANDIDATES),
    detail.backdrop,
    detail.poster,
  );
}

export function readMovieLogo(detail: Record<string, unknown>): string {
  return pickAssetFromRecord(detail, MEDIA_LOGO_FIELD_CANDIDATES);
}

export async function fetchMovieGatewayJson<T>(
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

export async function fetchOptionalMovieGatewayJson<T>(
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

export function buildMovieScopeCondition(alias: string): string {
  return `(
    ${alias}.surface_type = 'movie'
    or (${alias}.surface_type = 'unknown' and ${alias}.media_type = 'movie')
  )`;
}

export function buildMovieCanonicalShadowFilter(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return buildCanonicalItemShadowCondition(
    alias,
    buildMovieScopeCondition,
    (slugAlias) => buildSqlMovieItemSlugExpression(
      `${slugAlias}.title`,
      `coalesce(${slugAlias}.release_year::text, ${slugAlias}.detail ->> 'release_year', ${slugAlias}.detail ->> 'year', '')`,
      `${slugAlias}.item_key`,
    ),
    schemaCapabilities,
  );
}

export function buildMovieItemSlugExpression(alias: string): string {
  return buildSqlMovieItemSlugExpression(
    `${alias}.title`,
    `coalesce(${alias}.release_year::text, ${alias}.detail ->> 'release_year', ${alias}.detail ->> 'year', '')`,
    `${alias}.item_key`,
  );
}

export async function resolveMovieMirrorEntries(mirrors: MovieMirror[]): Promise<MovieMirror[]> {
  if (mirrors.length === 0) {
    return mirrors;
  }

  const resolvedEntries = await Promise.all(
    mirrors.map(async (entry) => ({
      label: entry.label,
      embed_url: await resolveLk21MovieProviderUrl(entry.embed_url),
    })),
  );

  const seen = new Set<string>();
  return resolvedEntries.filter((entry) => {
    const embedUrl = entry.embed_url.trim();
    if (!embedUrl || seen.has(embedUrl)) {
      return false;
    }
    seen.add(embedUrl);
    return true;
  });
}

export async function resolveMovieDownloadGroups(groups: MovieDownloadGroup[]): Promise<MovieDownloadGroup[]> {
  if (groups.length === 0) {
    return groups;
  }

  return Promise.all(
    groups.map(async (group) => ({
      format: group.format,
      quality: group.quality,
      links: (await Promise.all(
        group.links.map(async (link) => ({
          label: link.label,
          href: await resolveLk21MovieProviderUrl(link.href),
        })),
      )).filter((link, index, links) => {
        if (!link.href.trim()) {
          return false;
        }
        return links.findIndex((candidate) => candidate.href === link.href) === index;
      }),
    })),
  );
}

export function applyLk21ExternalFallback(payload: MovieWatchData, preferExternalFallback = false): MovieWatchData {
  const playbackId = extractLk21PlaybackId(payload.defaultUrl || '')
    || payload.mirrors.map((mirror) => extractLk21PlaybackId(mirror.embed_url)).find(Boolean)
    || payload.downloadGroups.flatMap((group) => group.links).map((link) => extractLk21PlaybackId(link.href)).find(Boolean);
  const hasLocalLk21Proxy = (payload.defaultUrl || '').startsWith('/api/lk21/')
    || payload.mirrors.some((mirror) => mirror.embed_url.startsWith('/api/lk21/'))
    || payload.downloadGroups.flatMap((group) => group.links).some((link) => link.href.startsWith('/api/lk21/'));

  if (!(playbackId && (preferExternalFallback || hasLocalLk21Proxy))) {
    return payload;
  }

  const externalUrl = buildLk21ExternalPlayerUrl(playbackId);
  return {
    ...payload,
    mirrors: payload.mirrors.length > 0
      ? payload.mirrors.map((mirror) => ({ ...mirror, embed_url: externalUrl }))
      : [{ label: 'LK21 Official', embed_url: externalUrl }],
    defaultUrl: '',
    canInlinePlayback: false,
    externalUrl,
    downloadGroups: payload.downloadGroups.length > 0
      ? payload.downloadGroups.map((group) => ({
          ...group,
          links: group.links.length > 0
            ? group.links.map((link) => ({ ...link, href: externalUrl }))
            : [{ label: 'LK21 Official', href: externalUrl }],
        }))
      : [{
          format: 'STREAM',
          quality: 'SOURCE',
          links: [{ label: 'LK21 Official', href: externalUrl }],
        }],
  };
}

export async function normalizeMovieWatchPayload(payload: MovieWatchData, preferExternalFallback = false): Promise<MovieWatchData> {
  const mirrors = await resolveMovieMirrorEntries(payload.mirrors || []);
  const defaultUrl = mirrors[0]?.embed_url || await resolveLk21MovieProviderUrl(payload.defaultUrl || '');
  const downloadGroups = await resolveMovieDownloadGroups(payload.downloadGroups || []);
  return applyLk21ExternalFallback({
    ...payload,
    mirrors,
    defaultUrl,
    canInlinePlayback: Boolean(defaultUrl),
    downloadGroups,
  }, preferExternalFallback);
}

export function visibilitySegment(options: VisibilityOptions): 'auth' | 'public' {
  return options.includeNsfw ? 'auth' : 'public';
}

function buildMovieCatalogSelect(
  includeNsfw: boolean,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return `
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
        ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
        ${buildMovieCanonicalShadowFilter('i', schemaCapabilities)}
  `;
}

export function buildMovieGenreMatchCondition(alias: string, paramRef = '$1'): string {
  return `
    (
      ${alias}.detail -> 'genres' ? ${paramRef}
      or ${alias}.detail -> 'genre_names' ? ${paramRef}
      or ${alias}.detail -> 'category_names' ? ${paramRef}
      or coalesce(${alias}.genre_names, '{}'::text[]) @> array[${paramRef}]
    )
  `;
}

export function buildMovieGenreAnyMatchCondition(alias: string, paramRef: string): string {
  return `
    (
      ${alias}.detail -> 'genres' ?| ${paramRef}
      or ${alias}.detail -> 'genre_names' ?| ${paramRef}
      or ${alias}.detail -> 'category_names' ?| ${paramRef}
      or coalesce(${alias}.genre_names, '{}'::text[]) && ${paramRef}
    )
  `;
}

function getMovieCanonicalGroupKey(row: MovieCatalogRow): string {
  return readText(row.canonical_item_key) || readText(row.item_key) || readText(row.slug);
}

function getMovieUpdatedAtTime(row: MovieCatalogRow): number {
  const value = Date.parse(readText(row.updated_at));
  return Number.isFinite(value) ? value : 0;
}

export function collapseCanonicalMovieRows(
  rows: MovieCatalogRow[],
  options: { limit?: number } = {},
): MovieCatalogRow[] {
  const grouped = new Map<string, MovieCatalogRow>();

  for (const row of rows) {
    const key = getMovieCanonicalGroupKey(row);
    if (!key) {
      continue;
    }

    const existing = grouped.get(key);
    const isPreferred = !existing || 
      (Boolean(row.is_canonical) && !Boolean(existing.is_canonical)) ||
      (Boolean(row.is_canonical) === Boolean(existing.is_canonical) && getMovieUpdatedAtTime(row) > getMovieUpdatedAtTime(existing));

    if (isPreferred) {
      grouped.set(key, row);
    }
  }

  const emitted = new Set<string>();
  const collapsed: MovieCatalogRow[] = [];

  for (const row of rows) {
    const key = getMovieCanonicalGroupKey(row);
    if (!key || emitted.has(key)) {
      continue;
    }

    const representative = grouped.get(key);
    if (!representative) {
      continue;
    }

    emitted.add(key);
    collapsed.push(representative);

    if (options.limit != null && collapsed.length >= Math.max(1, options.limit)) {
      break;
    }
  }

  return collapsed;
}

export async function queryMovieCatalogRows(
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

  const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.trunc(limit)) : null;
  const queryParams = [...params];
  let query = buildMovieCatalogSelect(includeNsfw, schemaCapabilities);
  if (extraWhere.trim()) {
    query += ` and (${extraWhere})`;
  }
  query += ` order by ${orderBy}`;
  if (normalizedLimit != null) {
    queryParams.push(normalizedLimit);
    query += ` limit $${queryParams.length}`;
  }

  return sql.unsafe<MovieCatalogRow[]>(query, queryParams).then((rows) => 
    collapseCanonicalMovieRows(rows, normalizedLimit != null ? { limit: normalizedLimit } : {})
  );
}

export function getMovieDetailRecord(row: Pick<VideoItemRow, 'detail' | 'tmdb_payload' | 'fanart_payload'>): Record<string, unknown> {
  return {
    ...readRecord(row.detail),
    ...readRecord(row.fanart_payload),
    ...readRecord(row.tmdb_payload),
  };
}

export function getMovieItemDetailRecord(row: Pick<VideoUnitRow, 'item_detail' | 'item_tmdb_payload' | 'item_fanart_payload'>): Record<string, unknown> {
  return {
    ...readRecord(row.item_detail),
    ...readRecord(row.item_fanart_payload),
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

export function formatYear(row: VideoItemRow): string {
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

export function formatDuration(detail: Record<string, unknown>): string {
  const runtime =
    readNumber(detail.runtime_minutes) ??
    readNumber(detail.duration_minutes) ??
    readNumber(detail.runtime);

  if (runtime && runtime > 0) {
    return `${Math.round(runtime)} min`;
  }

  return readText(detail.duration) || 'N/A';
}

export function formatRating(row: VideoItemRow): string {
  const detail = getMovieDetailRecord(row);
  const rating =
    readNumber(detail.rating) ??
    readNumber(detail.score) ??
    (row.score > 0 ? row.score : null);

  return normalizeMovieRatingValue(rating);
}

function formatCatalogRating(row: Pick<MovieCatalogRow, 'detail_rating' | 'score'>): string {
  return normalizeMovieRatingValue(readNumber(row.detail_rating) ?? (row.score > 0 ? row.score : null));
}

export function mapMovieCard(row: MovieCatalogRow): MovieCardItem {
  return {
    slug: buildMovieItemSlug({
      title: row.title,
      releaseYear: row.release_year ?? row.detail_year,
      fallbackKey: row.item_key,
    }),
    title: row.title,
    poster: normalizePosterUrl(readText(row.poster_url) || readText(row.cover_url)),
    background: pickAssetUrl(row.background_url, row.backdrop_url, row.poster_url, row.cover_url),
    backdrop: pickAssetUrl(row.backdrop_url, row.background_url, row.poster_url, row.cover_url),
    logo: pickAssetUrl(row.logo_url),
    year: formatCatalogYear(row),
    type: 'movie',
    rating: formatCatalogRating(row),
    status: readText(row.status),
    genres: getMovieCatalogGenres(row).join(', '),
  };
}

export function mapMovieCast(detail: Record<string, unknown>): MovieCastItem[] {
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

export function sortMovieRows(rows: MovieCatalogRow[], section: 'popular' | 'latest' | 'trending'): MovieCatalogRow[] {
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
