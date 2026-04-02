import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb } from '@/lib/server/comic-db';
import { hasNsfwLabel } from '@/lib/media-safety';
import {
  buildVisibilityCondition,
  getVisibilityCacheSegment,
  normalizeGenreList,
  normalizePosterUrl,
  parseVideoDownloads,
  parseVideoMirrors,
  readNumber,
  readRecord,
  readText,
  resolvePrimaryVideoUrl,
  slugify,
  type JsonRecord,
  type VideoDownloadGroup,
  type VideoMirror,
  type VisibilityOptions,
} from './video-db-common';
import { readStringArray } from './video-db';
import {
  getSeriesCanonicalFilters,
  getSeriesReleaseDayLabel,
  getSeriesReleaseDayOrder,
  type SeriesCardItem,
  type SeriesMediaType,
  type SeriesReleaseDay,
  type SeriesScheduleLane,
} from '@/lib/series-presentation';
import { selectSeriesRecommendations } from '@/lib/series-recommendations';

type SeriesRow = {
  item_key: string;
  media_type: SeriesMediaType;
  surface_type: string | null;
  presentation_type: string | null;
  origin_type: string | null;
  release_country: string | null;
  is_nsfw: boolean | null;
  source: string;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number | null;
  detail: JsonRecord | null;
  tmdb_payload?: JsonRecord | null;
  updated_at: string;
  episode_count?: number | null;
  release_day?: string | null;
  release_window?: string | null;
  release_timezone?: string | null;
  cadence?: string | null;
  next_release_at?: string | null;
};

type SeriesCatalogRow = {
  item_key: string;
  media_type: SeriesMediaType;
  surface_type: string | null;
  presentation_type: string | null;
  origin_type: string | null;
  release_country: string | null;
  is_nsfw: boolean | null;
  source: string;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number | null;
  updated_at: string;
  episode_count?: number | null;
  release_day?: string | null;
  release_window?: string | null;
  release_timezone?: string | null;
  cadence?: string | null;
  next_release_at?: string | null;
  poster_url?: string | null;
  detail_year?: string | null;
  detail_rating?: string | null;
  latest_episode?: string | null;
  detail_country?: string | null;
  genres?: unknown;
  genre_names?: unknown;
  canonical_genre_names?: unknown;
  category_names?: unknown;
};

type SeriesEpisodeRow = {
  media_type: SeriesMediaType;
  origin_type: string | null;
  release_country: string | null;
  item_slug: string;
  item_title: string;
  cover_url: string;
  release_year: number | null;
  item_detail: JsonRecord | null;
  item_tmdb_payload?: JsonRecord | null;
  slug: string;
  title: string;
  label: string;
  number: number | null;
  prev_slug: string | null;
  next_slug: string | null;
  detail: JsonRecord | null;
};

type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year';

export type SeriesHubData = {
  popular: SeriesCardItem[];
  latest: SeriesCardItem[];
  dramaSpotlight: SeriesCardItem[];
  weeklySchedule: SeriesScheduleLane[];
  filters: string[];
};

export type SeriesDetailData = {
  slug: string;
  mediaType: SeriesMediaType;
  title: string;
  poster: string;
  backdrop: string;
  trailerUrl: string;
  year: string;
  rating: string;
  status: string;
  genres: string[];
  synopsis: string;
  country: string;
  seasonLabel: string;
  episodeCount: string;
  latestEpisode: string;
  studio: string;
  director: string;
  sourceLabel: string;
  episodes: Array<{ slug: string; title: string; label: string; number: number | null }>;
  recommendations: SeriesCardItem[];
};

export type SeriesDetailOptions = VisibilityOptions & {
  includeRecommendations?: boolean;
};

export type SeriesEpisodeData = {
  slug: string;
  mediaType: SeriesMediaType;
  seriesSlug: string;
  seriesTitle: string;
  poster: string;
  year: string;
  country: string;
  title: string;
  episodeLabel: string;
  episodeNumber: string;
  synopsis: string;
  detailHref: string;
  mirrors: VideoMirror[];
  defaultUrl: string;
  canInlinePlayback: boolean;
  externalUrl: string;
  downloadGroups: VideoDownloadGroup[];
  playlist: Array<{ slug: string; label: string; title: string; number: number | null }>;
  prevEpisodeSlug: string | null;
  nextEpisodeSlug: string | null;
};

const HUB_CACHE_TTL_SECONDS = 60 * 10;
const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
const SERIES_CACHE_NAMESPACE = 'series-v8';

function formatRating(value: unknown): string {
  const numeric = readNumber(value);
  if (numeric == null || numeric <= 0) {
    return 'N/A';
  }
  return numeric.toFixed(1);
}

function formatDetailYear(primaryYear: number | null | undefined, detail: JsonRecord): string {
  if (primaryYear && primaryYear > 0) {
    return String(primaryYear);
  }
  const detailYear = readNumber(detail.release_year) ?? readNumber(detail.year);
  if (detailYear && detailYear > 0) {
    return String(Math.round(detailYear));
  }
  return readText(detail.release_year) || readText(detail.year);
}

function getSeriesDetailRecord(row: Pick<SeriesRow, 'detail' | 'tmdb_payload'>): JsonRecord {
  return {
    ...readRecord(row.detail),
    ...readRecord(row.tmdb_payload),
  };
}

function getSeriesItemDetailRecord(row: Pick<SeriesEpisodeRow, 'item_detail' | 'item_tmdb_payload'>): JsonRecord {
  return {
    ...readRecord(row.item_detail),
    ...readRecord(row.item_tmdb_payload),
  };
}

function normalizeCountry(detail: JsonRecord): string {
  const countryNames = Array.isArray(detail.country_names) ? detail.country_names : [];
  const raw = readText(detail.country) || readText(detail.region) || readText(countryNames[0]);
  if (!raw) {
    return '';
  }
  if (raw.toLowerCase() === 'korea') {
    return 'South Korea';
  }
  return raw;
}

function formatCountryCode(code: string | null | undefined): string {
  switch ((code || '').trim().toUpperCase()) {
    case 'JP':
      return 'Japan';
    case 'CN':
      return 'China';
    case 'KR':
      return 'South Korea';
    case 'US':
      return 'United States';
    default:
      return '';
  }
}

function collapseRepeatedSeriesTitle(value: string): string {
  let current = readText(value);
  if (!current) {
    return '';
  }

  while (true) {
    const parts = current.split(/\s+/).filter(Boolean);
    const maxChunkSize = Math.floor(parts.length / 2);
    let next = current;

    for (let size = maxChunkSize; size >= 1; size -= 1) {
      const left = parts.slice(0, size).join(' ').toLowerCase();
      const right = parts.slice(size, size * 2).join(' ').toLowerCase();

      if (left === right) {
        next = [...parts.slice(0, size), ...parts.slice(size * 2)].join(' ');
        break;
      }
    }

    if (next === current) {
      return current;
    }

    current = next;
  }
}

function getSeriesType(row: Pick<SeriesRow, 'origin_type' | 'media_type' | 'source'> | Pick<SeriesEpisodeRow, 'origin_type' | 'media_type'>): SeriesMediaType {
  const origin = readText(row.origin_type).toLowerCase();
  if (origin === 'donghua') {
    return 'donghua';
  }
  if (origin === 'drama') {
    return 'drama';
  }
  if (origin === 'anime') {
    return 'anime';
  }
  if ('source' in row && row.source === 'anichin') {
    return 'donghua';
  }
  return row.media_type === 'drama' ? 'drama' : 'anime';
}

function getSeriesGenres(detail: JsonRecord): string[] {
  return normalizeGenreList(detail);
}

function normalizeBrowseToken(value: string): string {
  return readText(value).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getRowCountry(row: Pick<SeriesRow, 'detail' | 'release_country' | 'tmdb_payload'>): string {
  return normalizeCountry(getSeriesDetailRecord(row)) || formatCountryCode(row.release_country);
}

function getLatestEpisodeLabel(row: SeriesRow): string {
  const detail = getSeriesDetailRecord(row);
  return readText(detail.latest_episode) || readText(detail.latest_label) || readText(detail.latest_chapter_label);
}

function parseCompactMetric(value: string): number {
  const match = value.trim().match(/^([\d.]+)\s*([kKmM]?)\s*(?:views?|loves?)$/i);
  if (!match) {
    return 0;
  }

  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  const scale = match[2].toLowerCase();
  if (scale === 'm') return numeric * 1_000_000;
  if (scale === 'k') return numeric * 1_000;
  return numeric;
}

function getDramaPopularity(detail: JsonRecord): number {
  const categories = Array.isArray(detail.category_names) ? detail.category_names : [];
  let views = 0;
  let loves = 0;

  for (const entry of categories) {
    const text = readText(entry);
    if (/views?/i.test(text)) {
      views = Math.max(views, parseCompactMetric(text));
    }
    if (/loves?/i.test(text)) {
      loves = Math.max(loves, parseCompactMetric(text));
    }
  }

  return loves * 10 + views;
}

function readFirstString(value: unknown): string {
  if (!Array.isArray(value)) {
    return '';
  }
  for (const entry of value) {
    const text = readText(entry);
    if (text) {
      return text;
    }
  }
  return '';
}

function mergeCatalogLabels(...values: unknown[]): string[] {
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

function getSeriesCatalogGenres(row: Pick<SeriesCatalogRow, 'genres' | 'genre_names' | 'canonical_genre_names' | 'category_names'>): string[] {
  const labels = mergeCatalogLabels(row.genres, row.genre_names, row.canonical_genre_names, row.category_names);
  if (labels.length > 0) {
    return labels;
  }

  return normalizeGenreList({
    genres: row.genres,
    genre_names: row.genre_names,
    category_names: row.category_names,
  });
}

function isSeriesCatalogNsfw(row: Pick<SeriesCatalogRow, 'is_nsfw' | 'genres' | 'genre_names' | 'canonical_genre_names' | 'category_names'>): boolean {
  return Boolean(row.is_nsfw) || hasNsfwLabel(row.genres, row.genre_names, row.canonical_genre_names, row.category_names);
}

function formatCatalogYear(row: Pick<SeriesCatalogRow, 'release_year' | 'detail_year'>): string {
  if (row.release_year && row.release_year > 0) {
    return String(row.release_year);
  }
  const detailYear = readNumber(row.detail_year);
  if (detailYear && detailYear > 0) {
    return String(Math.round(detailYear));
  }
  return readText(row.detail_year);
}

function getCatalogCountry(row: Pick<SeriesCatalogRow, 'detail_country' | 'release_country'>): string {
  const raw = readText(row.detail_country);
  if (raw) {
    if (raw.toLowerCase() === 'korea') {
      return 'South Korea';
    }
    return raw;
  }
  return formatCountryCode(row.release_country);
}

function mapSeriesCard(row: SeriesCatalogRow): SeriesCardItem {
  const type = getSeriesType(row);
  return {
    slug: readText(row.slug),
    title: collapseRepeatedSeriesTitle(row.title),
    poster: normalizePosterUrl(row.poster_url, row.cover_url),
    year: formatCatalogYear(row),
    type,
    rating: formatRating((row.score && row.score > 0) ? row.score : row.detail_rating),
    status: readText(row.status),
    genres: getSeriesCatalogGenres(row).join(', '),
    latestEpisode: readText(row.latest_episode),
    country: getCatalogCountry(row),
    releaseWindow: readText(row.release_window),
    nextReleaseAt: readText(row.next_release_at),
  };
}

function normalizeReleaseDay(value: string | null | undefined): SeriesReleaseDay | null {
  const normalized = readText(value).toLowerCase();
  if (
    normalized === 'monday' ||
    normalized === 'tuesday' ||
    normalized === 'wednesday' ||
    normalized === 'thursday' ||
    normalized === 'friday' ||
    normalized === 'saturday' ||
    normalized === 'sunday'
  ) {
    return normalized;
  }
  return null;
}

function getScheduleReferenceDay(): SeriesReleaseDay {
  const dayIndex = new Date().getUTCDay();
  const days = getSeriesReleaseDayOrder();
  return days[(dayIndex + 6) % 7];
}

function getUpcomingScheduleDays(rows: SeriesCatalogRow[], dayCount: number, limitPerDay: number): SeriesScheduleLane[] {
  const grouped = new Map<SeriesReleaseDay, SeriesCatalogRow[]>();

  for (const row of rows) {
    const cadence = readText(row.cadence).toLowerCase();
    const releaseDay = normalizeReleaseDay(row.release_day);
    if (cadence !== 'weekly' || !releaseDay) {
      continue;
    }

    const bucket = grouped.get(releaseDay);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(releaseDay, [row]);
    }
  }

  const dayOrder = getSeriesReleaseDayOrder();
  const referenceDay = getScheduleReferenceDay();
  const referenceIndex = dayOrder.indexOf(referenceDay);
  const rotated = [...dayOrder.slice(referenceIndex), ...dayOrder.slice(0, referenceIndex)];

  return rotated
    .filter((day) => (grouped.get(day)?.length ?? 0) > 0)
    .slice(0, Math.max(1, dayCount))
    .map((day) => {
      const laneRows = grouped
        .get(day)!
        .slice()
        .sort((left, right) => {
          const leftNextReleaseAt = readText(left.next_release_at);
          const rightNextReleaseAt = readText(right.next_release_at);
          if (leftNextReleaseAt && rightNextReleaseAt && leftNextReleaseAt !== rightNextReleaseAt) {
            return leftNextReleaseAt.localeCompare(rightNextReleaseAt);
          }
          if (leftNextReleaseAt && !rightNextReleaseAt) {
            return -1;
          }
          if (!leftNextReleaseAt && rightNextReleaseAt) {
            return 1;
          }
          const leftScore = (readNumber(left.score) ?? 0) * 1000 + (left.episode_count ?? 0);
          const rightScore = (readNumber(right.score) ?? 0) * 1000 + (right.episode_count ?? 0);
          return rightScore - leftScore;
        })
        .slice(0, Math.max(1, limitPerDay));

      return {
        day,
        label: getSeriesReleaseDayLabel(day),
        timezone: readText(laneRows[0]?.release_timezone) || 'Local release timezone',
        items: laneRows.map(mapSeriesCard),
      };
    });
}

async function loadSeriesRows(includeNsfw: boolean): Promise<SeriesCatalogRow[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  return sql.unsafe<SeriesCatalogRow[]>(`
    select
      i.item_key,
      i.media_type,
      i.surface_type,
      i.presentation_type,
      i.origin_type,
      i.release_country,
      i.is_nsfw,
      i.source,
      i.slug,
      i.title,
      i.cover_url,
      i.status,
      i.release_year,
      i.score,
      i.updated_at,
      i.release_day,
      i.release_window,
      i.release_timezone,
      i.cadence,
      i.next_release_at,
      i.detail ->> 'poster_url' as poster_url,
      coalesce(i.detail ->> 'release_year', i.detail ->> 'year') as detail_year,
      i.detail ->> 'rating' as detail_rating,
      coalesce(
        i.detail ->> 'latest_episode',
        i.detail ->> 'latest_label',
        i.detail ->> 'latest_chapter_label'
      ) as latest_episode,
      coalesce(
        i.detail ->> 'country',
        i.detail ->> 'region',
        i.detail -> 'country_names' ->> 0
      ) as detail_country,
      i.detail -> 'genres' as genres,
      i.detail -> 'genre_names' as genre_names,
      to_jsonb(i.genre_names) as canonical_genre_names,
      i.detail -> 'category_names' as category_names,
      (
        select count(*)
        from public.media_units u
        where u.item_key = i.item_key
          and u.unit_type = 'episode'
      )::int as episode_count
    from public.media_items i
    where (
      i.surface_type = 'series'
      or (i.surface_type = 'unknown' and i.media_type in ('anime', 'drama'))
    )
      ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
    order by i.updated_at desc
  `);
}

function getSeriesCatalog(includeNsfw: boolean): Promise<SeriesCatalogRow[]> {
  const visibility = getVisibilityCacheSegment(includeNsfw);
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'catalog');
  return rememberComicCacheValue(key, HUB_CACHE_TTL_SECONDS, () => loadSeriesRows(includeNsfw));
}

function getSeriesFilters(rows: SeriesCatalogRow[]): string[] {
  const available = new Set<string>();
  for (const row of rows) {
    switch (getSeriesType(row)) {
      case 'anime':
        available.add('Anime');
        break;
      case 'donghua':
        available.add('Donghua');
        break;
      case 'drama':
        available.add('Drama');
        break;
    }

    const country = getCatalogCountry(row);
    if (country) {
      available.add(country);
    }
  }

  return getSeriesCanonicalFilters(available);
}

function matchesBrowseToken(row: SeriesCatalogRow, kind: SeriesBrowseKind, rawValue: string): boolean {
  const value = normalizeBrowseToken(rawValue);
  if (!value) {
    return false;
  }

  const type = getSeriesType(row);
  const country = getCatalogCountry(row).toLowerCase();
  const year = formatCatalogYear(row).toLowerCase();
  const genres = getSeriesCatalogGenres(row).map((genre) => genre.toLowerCase());
  const slugValue = slugify(value);

  if (kind === 'type') {
    return type === value;
  }
  if (kind === 'genre') {
    return genres.some((genre) => genre === value || slugify(genre) === slugValue);
  }
  if (kind === 'country') {
    return country === value || slugify(country) === slugValue;
  }
  if (kind === 'year') {
    return year === value;
  }

  return true;
}

export async function getSeriesBrowseItems(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 24,
  options: VisibilityOptions = {},
): Promise<SeriesCardItem[]> {
  const rows = await getSeriesCatalog(Boolean(options.includeNsfw));
  const normalizedLimit = Math.max(1, limit);
  const filteredRows = kind === 'list'
    ? rows
    : rows.filter((row) => value ? matchesBrowseToken(row, kind, value) : false);

  return filteredRows.slice(0, normalizedLimit).map(mapSeriesCard);
}

export async function getSeriesHubData(limit = 24, options: VisibilityOptions = {}): Promise<SeriesHubData> {
  const rows = await getSeriesCatalog(Boolean(options.includeNsfw));
  const normalizedLimit = Math.max(1, limit);
  const popularRows = [...rows].sort((left, right) => {
    const leftScore = getSeriesType(left) === 'drama'
      ? getDramaPopularity({ category_names: left.category_names })
      : (readNumber(left.score) ?? 0) * 1000 + (left.episode_count ?? 0);
    const rightScore = getSeriesType(right) === 'drama'
      ? getDramaPopularity({ category_names: right.category_names })
      : (readNumber(right.score) ?? 0) * 1000 + (right.episode_count ?? 0);
    return rightScore - leftScore;
  });

  const dramaSpotlight = rows
    .filter((row) => getSeriesType(row) === 'drama')
    .sort((left, right) => getDramaPopularity({ category_names: right.category_names }) - getDramaPopularity({ category_names: left.category_names }))
    .slice(0, normalizedLimit)
    .map(mapSeriesCard);

  return {
    popular: popularRows.slice(0, normalizedLimit).map(mapSeriesCard),
    latest: rows.slice(0, normalizedLimit).map(mapSeriesCard),
    dramaSpotlight,
    weeklySchedule: getUpcomingScheduleDays(rows, 3, 6),
    filters: getSeriesFilters(rows),
  };
}

export async function getSeriesFilteredItems(filter: string, limit = 24, options: VisibilityOptions = {}): Promise<SeriesCardItem[]> {
  const normalizedFilter = filter.trim().toLowerCase();
  if (!normalizedFilter) {
    return [];
  }

  const rows = await getSeriesCatalog(Boolean(options.includeNsfw));
  return rows
    .filter((row) => {
      if (normalizedFilter === 'anime' || normalizedFilter === 'drama' || normalizedFilter === 'donghua') {
        return getSeriesType(row) === normalizedFilter;
      }
      return getCatalogCountry(row).toLowerCase() === normalizedFilter;
    })
    .slice(0, Math.max(1, limit))
    .map(mapSeriesCard);
}

export async function getNsfwSeriesItems(limit = 24): Promise<SeriesCardItem[]> {
  const rows = await getSeriesCatalog(true);
  return rows
    .filter(isSeriesCatalogNsfw)
    .slice(0, Math.max(1, limit))
    .map(mapSeriesCard);
}

export async function getNsfwSeriesPage(page = 1, limit = 24): Promise<{
  items: SeriesCardItem[];
  hasNext: boolean;
}> {
  const safeLimit = Math.max(1, limit);
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit + 1;
  const rows = (await getSeriesCatalog(true)).filter(isSeriesCatalogNsfw);
  const slice = rows.slice(start, end);

  return {
    items: slice.slice(0, safeLimit).map(mapSeriesCard),
    hasNext: slice.length > safeLimit,
  };
}

export async function searchSeriesCatalog(query: string, limit = 8, options: VisibilityOptions = {}): Promise<SeriesCardItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'search', trimmed.toLowerCase(), limit);
  return rememberComicCacheValue(key, SEARCH_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return [];
    }

    const rows = await sql.unsafe<SeriesCatalogRow[]>(`
      select
        i.item_key,
        i.media_type,
        i.surface_type,
        i.presentation_type,
        i.origin_type,
        i.release_country,
        i.is_nsfw,
        i.source,
        i.slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.updated_at,
        i.release_window,
        i.next_release_at,
        i.detail ->> 'poster_url' as poster_url,
        coalesce(i.detail ->> 'release_year', i.detail ->> 'year') as detail_year,
        i.detail ->> 'rating' as detail_rating,
        coalesce(
          i.detail ->> 'latest_episode',
          i.detail ->> 'latest_label',
          i.detail ->> 'latest_chapter_label'
        ) as latest_episode,
        coalesce(
          i.detail ->> 'country',
          i.detail ->> 'region',
          i.detail -> 'country_names' ->> 0
        ) as detail_country,
        i.detail -> 'genres' as genres,
        i.detail -> 'genre_names' as genre_names,
        to_jsonb(i.genre_names) as canonical_genre_names,
        i.detail -> 'category_names' as category_names
      from public.media_items i
      where (
        i.surface_type = 'series'
        or (i.surface_type = 'unknown' and i.media_type in ('anime', 'drama'))
      )
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        and (
          search_vec @@ plainto_tsquery('simple', $1)
          or title ilike $2
        )
      order by score desc nulls last, updated_at desc
      limit $3
    `, [trimmed, `%${trimmed}%`, Math.max(1, limit)]);

    return rows.map(mapSeriesCard);
  });
}

export async function getSeriesDetailBySlug(slug: string, options: SeriesDetailOptions = {}): Promise<SeriesDetailData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'detail', normalizedSlug);

  return rememberComicCacheValue(key, DETAIL_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql.unsafe<SeriesRow[]>(`
      select
        i.item_key,
        i.media_type,
        i.surface_type,
        i.presentation_type,
        i.origin_type,
        i.release_country,
        i.is_nsfw,
        i.source,
        i.slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.detail,
        e.payload as tmdb_payload,
        i.updated_at
      from public.media_items i
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where (
        i.surface_type = 'series'
        or (i.surface_type = 'unknown' and i.media_type in ('anime', 'drama'))
      )
        and i.slug = $1
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
      limit 1
    `, [normalizedSlug]);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const episodes = await sql.unsafe<Array<{
      slug: string;
      title: string;
      label: string;
      number: number | null;
    }>>(`
      select u.slug, u.title, u.label, u.number
      from public.media_units u
      where u.item_key = $1
        and u.unit_type = 'episode'
      order by u.number desc nulls last, u.updated_at desc
    `, [row.item_key]);
    const normalizedEpisodes = episodes.map((episode) => ({
      ...episode,
      title: collapseRepeatedSeriesTitle(episode.title),
      label: readText(episode.label),
    }));

    const detail = getSeriesDetailRecord(row);
    const genres = getSeriesGenres(detail);
    const country = getRowCountry(row);
    const recommendations = options.includeRecommendations === false
      ? []
      : selectSeriesRecommendations({
          currentSlug: row.slug,
          genres,
          country,
          items: (await getSeriesCatalog(Boolean(options.includeNsfw))).map(mapSeriesCard),
        });

    return {
      slug: row.slug,
      mediaType: getSeriesType(row),
      title: collapseRepeatedSeriesTitle(row.title),
      poster: normalizePosterUrl(detail.poster_url, row.cover_url),
      backdrop: normalizePosterUrl(detail.backdrop_url, detail.poster_url, row.cover_url),
      trailerUrl: readText(detail.trailer_url) || readText(detail.trailer) || readText(detail.trailerUrl),
      year: formatDetailYear(row.release_year, detail),
      rating: formatRating((row.score && row.score > 0) ? row.score : detail.rating),
      status: readText(row.status),
      genres,
      synopsis: readText(detail.synopsis) || readText(detail.overview) || 'Synopsis is still being prepared.',
      country,
      seasonLabel: readText(detail.type) || (
        getSeriesType(row) === 'donghua'
          ? 'Donghua Series'
          : getSeriesType(row) === 'drama'
            ? 'Drama Series'
            : 'Anime Series'
      ),
      episodeCount: normalizedEpisodes.length ? String(normalizedEpisodes.length) : readText(detail.episodes_text),
      latestEpisode: getLatestEpisodeLabel(row),
      studio: readText(detail.studio) || readText(detail.studios) || readText(detail.network),
      director: readText(detail.director) || readFirstString(detail.directors),
      sourceLabel: row.source,
      episodes: normalizedEpisodes,
      recommendations,
    };
  });
}

export async function getSeriesRecommendations({
  currentSlug,
  genres,
  country,
  includeNsfw = false,
  limit = 8,
}: {
  currentSlug: string;
  genres: string[];
  country: string;
  includeNsfw?: boolean;
  limit?: number;
}): Promise<SeriesCardItem[]> {
  const rows = await getSeriesCatalog(includeNsfw);
  return selectSeriesRecommendations({
    currentSlug,
    genres,
    country,
    limit,
    items: rows.map(mapSeriesCard),
  });
}

export async function getSeriesEpisodeBySlug(slug: string, options: VisibilityOptions = {}): Promise<SeriesEpisodeData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'episode', normalizedSlug);

  return rememberComicCacheValue(key, DETAIL_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const rows = await sql.unsafe<SeriesEpisodeRow[]>(`
      select
        i.media_type,
        i.origin_type,
        i.release_country,
        i.slug as item_slug,
        i.title as item_title,
        i.cover_url,
        i.release_year,
        i.detail as item_detail,
        e.payload as item_tmdb_payload,
        u.slug,
        u.title,
        u.label,
        u.number,
        u.prev_slug,
        u.next_slug,
        u.detail
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where (
        i.surface_type = 'series'
        or (i.surface_type = 'unknown' and i.media_type in ('anime', 'drama'))
      )
        and u.slug = $1
        and u.unit_type = 'episode'
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
      limit 1
    `, [normalizedSlug]);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const playlist = await sql.unsafe<Array<{ slug: string; label: string; title: string; number: number | null }>>(`
      select u.slug, u.label, u.title, u.number
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      where i.slug = $1
        and (
          i.surface_type = 'series'
          or (i.surface_type = 'unknown' and i.media_type in ('anime', 'drama'))
        )
        and u.unit_type = 'episode'
      order by u.number desc nulls last, u.updated_at desc
    `, [row.item_slug]);

    const itemDetail = getSeriesItemDetailRecord(row);
    const episodeDetail = readRecord(row.detail);
    const mirrors = parseVideoMirrors(episodeDetail);
    const defaultUrl = resolvePrimaryVideoUrl(episodeDetail, mirrors);

    return {
      slug: row.slug,
      mediaType: getSeriesType(row),
      seriesSlug: row.item_slug,
      seriesTitle: collapseRepeatedSeriesTitle(row.item_title),
      poster: normalizePosterUrl(itemDetail.poster_url, row.cover_url),
      year: formatDetailYear(row.release_year, itemDetail),
      country: normalizeCountry(itemDetail) || formatCountryCode(row.release_country),
      title: collapseRepeatedSeriesTitle(readText(row.title) || `${row.item_title} ${row.label}`.trim()),
      episodeLabel: readText(row.label),
      episodeNumber: row.number == null ? '' : String(row.number),
      synopsis: readText(itemDetail.synopsis) || readText(itemDetail.overview) || 'Synopsis is still being prepared.',
      detailHref: `/series/${row.item_slug}`,
      mirrors,
      defaultUrl,
      canInlinePlayback: Boolean(defaultUrl),
      externalUrl: defaultUrl,
      downloadGroups: parseVideoDownloads(episodeDetail),
      playlist,
      prevEpisodeSlug: readText(row.prev_slug) || null,
      nextEpisodeSlug: readText(row.next_slug) || null,
    };
  });
}

export function getSeriesFilterSlug(value: string): string {
  return slugify(value);
}
