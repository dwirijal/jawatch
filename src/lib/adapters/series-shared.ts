import 'server-only';

import { getComicDb, type ComicDbClient } from '../server/comic-db.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemKeySelection,
  buildCanonicalItemShadowCondition,
  buildCanonicalItemLateralSubquery,
  getComicDbSchemaCapabilities,
  type ComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import {
  buildVisibilityCondition,
  normalizeGenreList,
  normalizePosterUrl,
  readNumber,
  readRecord,
  readText,
  slugify,
  type JsonRecord,
  type VideoDownloadGroup,
  type VideoMirror,
  type VisibilityOptions,
} from './video-db-common';
import {
  buildSeriesItemSlug,
  buildSqlSlugifyExpression,
  buildSqlSeriesItemSlugExpression,
} from '../media-slugs.ts';
import { readArray, readStringArray } from './video-db';
import {
  getSeriesCanonicalFilters,
  getSeriesReleaseDayLabel,
  getSeriesReleaseDayOrder,
  type SeriesCardItem,
  type SeriesMediaType,
  type SeriesReleaseDay,
  type SeriesScheduleLane,
} from '../series-presentation.ts';
import {
  MEDIA_BACKGROUND_FIELD_CANDIDATES,
  MEDIA_LOGO_FIELD_CANDIDATES,
  pickAssetFromRecord,
  pickAssetUrl,
} from '../utils.ts';
import { selectSeriesRecommendations } from '../series-recommendations.ts';
import { resolveSeriesMediaType } from '../series-taxonomy.ts';
import {
  collapseCanonicalSeriesRows,
  selectPreferredLinkedSourceItem,
  selectPreferredLinkedSourceUnit,
} from './series-canonical-utils';

export type SeriesRow = {
  item_key: string;
  requested_item_key?: string | null;
  requested_source?: string | null;
  is_canonical?: boolean | null;
  linked_source_item_key?: string | null;
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
  fanart_payload?: JsonRecord | null;
  updated_at: string;
  episode_count?: number | null;
  release_day?: string | null;
  release_window?: string | null;
  release_timezone?: string | null;
  cadence?: string | null;
  next_release_at?: string | null;
};

export type SeriesCatalogRow = {
  item_key: string;
  canonical_item_key?: string | null;
  is_canonical?: boolean | null;
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
  background_url?: string | null;
  backdrop_url?: string | null;
  logo_url?: string | null;
  detail_year?: string | null;
  detail_rating?: string | null;
  latest_episode?: string | null;
  detail_country?: string | null;
  genres?: unknown;
  genre_names?: unknown;
  canonical_genre_names?: unknown;
  category_names?: unknown;
};

export type SeriesEpisodeRow = {
  item_key?: string | null;
  canonical_unit_key?: string | null;
  requested_unit_key?: string | null;
  requested_source?: string | null;
  linked_source_item_key?: string | null;
  media_type: SeriesMediaType;
  origin_type: string | null;
  release_country: string | null;
  item_slug: string;
  item_title: string;
  cover_url: string;
  release_year: number | null;
  item_detail: JsonRecord | null;
  item_tmdb_payload?: JsonRecord | null;
  item_fanart_payload?: JsonRecord | null;
  slug: string;
  title: string;
  label: string;
  number: number | null;
  detail: JsonRecord | null;
  source_detail?: JsonRecord | null;
};

export type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year' | 'status';

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
  background?: string;
  logo?: string;
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
  cast: Array<{ name: string; role?: string; voice?: string }>;
  productionTeam: string[];
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

export const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
export const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
export const SERIES_CACHE_NAMESPACE = 'series-v9';
const SERIES_CANDIDATE_MULTIPLIER = 4;

export function readSeriesBackground(detail: JsonRecord): string {
  return pickAssetUrl(
    pickAssetFromRecord(detail, MEDIA_BACKGROUND_FIELD_CANDIDATES),
    detail.backdrop,
    detail.poster,
  );
}

export function readSeriesLogo(detail: JsonRecord): string {
  return pickAssetFromRecord(detail, MEDIA_LOGO_FIELD_CANDIDATES);
}

type LinkedSourceItemRow = {
  item_key: string | null;
  source: string | null;
  is_primary: boolean | null;
  priority: number | null;
};

type LinkedSourceUnitRow = LinkedSourceItemRow & {
  unit_key: string | null;
  detail: JsonRecord | null;
};

export function buildSeriesScopeCondition(alias: string): string {
  return `(
    ${alias}.surface_type = 'series'
    or (${alias}.surface_type = 'unknown' and ${alias}.media_type in ('anime', 'drama'))
  )`;
}

export function buildSeriesCanonicalShadowFilter(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return buildCanonicalItemShadowCondition(
    alias,
    buildSeriesScopeCondition,
    (slugAlias) => buildSqlSeriesItemSlugExpression(`${slugAlias}.title`, `${slugAlias}.item_key`),
    schemaCapabilities,
  );
}

export function buildSeriesItemSlugExpression(alias: string): string {
  return buildSqlSeriesItemSlugExpression(`${alias}.title`, `${alias}.item_key`);
}

export function buildSeriesEpisodeSlugExpression(itemAlias: string, unitAlias: string): string {
  const seriesSlugExpression = buildSeriesItemSlugExpression(itemAlias);
  const labelSlug = buildSqlSlugifyExpression(`coalesce(${unitAlias}.label, ${unitAlias}.title, '')`);
  const numberText = `nullif(regexp_replace(coalesce(${unitAlias}.number::text, ''), '[^0-9.]+', '', 'g'), '')`;
  const fallbackSlug = buildSqlSlugifyExpression(`${unitAlias}.unit_key`);

  return `(
    case
      when coalesce(${seriesSlugExpression}, '') <> '' and ${numberText} <> ''
        then ${seriesSlugExpression} || '-episode-' || ${numberText}
      when coalesce(${seriesSlugExpression}, '') <> '' and ${labelSlug} <> ''
        then ${seriesSlugExpression} || '-' || ${labelSlug}
      when ${labelSlug} <> '' then ${labelSlug}
      when coalesce(${seriesSlugExpression}, '') <> '' then ${seriesSlugExpression}
      when ${fallbackSlug} <> '' then 'episode-' || ${fallbackSlug}
      else 'episode'
    end
  )`;
}

export async function readPreferredLinkedSourceItemKey(
  sql: ComicDbClient,
  canonicalItemKey: string | null | undefined,
  {
    requestedItemKey,
    requestedSource,
    includeNsfw,
  }: {
    requestedItemKey?: string | null;
    requestedSource?: string | null;
    includeNsfw: boolean;
  },
): Promise<string | null> {
  const itemKey = readText(canonicalItemKey);
  if (!itemKey) {
    return null;
  }

  const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
  if (!schemaCapabilities.itemLinks) {
    return null;
  }

  const rows = await sql.unsafe<LinkedSourceItemRow[]>(`
    select
      si.item_key,
      si.source,
      mil.is_primary,
      mil.priority
    from public.media_item_links mil
    join public.media_items si on si.item_key = mil.source_item_key
    where mil.canonical_item_key = $1
      and ${buildSeriesScopeCondition('si')}
      ${buildVisibilityCondition(includeNsfw, 'si.detail', 'si.is_nsfw')}
  `, [itemKey]);

  return readText(selectPreferredLinkedSourceItem(rows, {
    requestedItemKey,
    requestedSource,
  })?.item_key) || null;
}

export async function readPreferredLinkedSourceUnitDetail(
  sql: ComicDbClient,
  canonicalUnitKey: string | null | undefined,
  {
    requestedUnitKey,
    linkedSourceItemKey,
    requestedSource,
    includeNsfw,
  }: {
    requestedUnitKey?: string | null;
    linkedSourceItemKey?: string | null;
    requestedSource?: string | null;
    includeNsfw: boolean;
  },
): Promise<JsonRecord> {
  const unitKey = readText(canonicalUnitKey);
  if (!unitKey) {
    return {};
  }

  const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
  if (!schemaCapabilities.unitLinks) {
    return {};
  }

  const rows = await sql.unsafe<LinkedSourceUnitRow[]>(`
    select
      su.unit_key,
      su.item_key,
      si.source,
      su.detail,
      mul.is_primary,
      mul.priority
    from public.media_unit_links mul
    join public.media_units su on su.unit_key = mul.source_unit_key
    join public.media_items si on si.item_key = su.item_key
    where mul.canonical_unit_key = $1
      and ${buildSeriesScopeCondition('si')}
      ${buildVisibilityCondition(includeNsfw, 'si.detail', 'si.is_nsfw')}
  `, [unitKey]);

  return readRecord(selectPreferredLinkedSourceUnit(rows, {
    requestedUnitKey,
    linkedSourceItemKey,
    requestedSource,
  })?.detail);
}

export function formatRating(value: unknown): string {
  const numeric = readNumber(value);
  if (numeric == null || numeric <= 0) {
    return 'N/A';
  }
  return numeric.toFixed(1);
}

export function formatDetailYear(primaryYear: number | null | undefined, detail: JsonRecord): string {
  if (primaryYear && primaryYear > 0) {
    return String(primaryYear);
  }
  const detailYear = readNumber(detail.release_year) ?? readNumber(detail.year);
  if (detailYear && detailYear > 0) {
    return String(Math.round(detailYear));
  }
  return readText(detail.release_year) || readText(detail.year);
}

export function getSeriesDetailRecord(row: Pick<SeriesRow, 'detail' | 'tmdb_payload' | 'fanart_payload'>): JsonRecord {
  return {
    ...readRecord(row.detail),
    ...readRecord(row.fanart_payload),
    ...readRecord(row.tmdb_payload),
  };
}

export function getSeriesItemDetailRecord(row: Pick<SeriesEpisodeRow, 'item_detail' | 'item_tmdb_payload' | 'item_fanart_payload'>): JsonRecord {
  return {
    ...readRecord(row.item_detail),
    ...readRecord(row.item_fanart_payload),
    ...readRecord(row.item_tmdb_payload),
  };
}

export function normalizeCountry(detail: JsonRecord): string {
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

export function formatCountryCode(code: string | null | undefined): string {
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

export function collapseRepeatedSeriesTitle(value: string): string {
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

export function getSeriesType(row: Pick<SeriesRow, 'origin_type' | 'media_type' | 'source'> | Pick<SeriesEpisodeRow, 'origin_type' | 'media_type'>): SeriesMediaType {
  return resolveSeriesMediaType({
    originType: row.origin_type,
    mediaType: row.media_type,
    source: 'source' in row ? row.source : null,
  });
}

export function getSeriesGenres(detail: JsonRecord): string[] {
  return normalizeGenreList(detail);
}

export function normalizeBrowseToken(value: string): string {
  return readText(value).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function getRowCountry(row: Pick<SeriesRow, 'detail' | 'release_country' | 'tmdb_payload'>): string {
  return normalizeCountry(getSeriesDetailRecord(row)) || formatCountryCode(row.release_country);
}

export function getLatestEpisodeLabel(row: SeriesRow): string {
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

export function getDramaPopularity(detail: JsonRecord): number {
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

export function readFirstString(value: unknown): string {
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

function readStringList(...values: unknown[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const text = readText(entry);
        if (!text) {
          continue;
        }
        const normalized = text.trim();
        if (!normalized || seen.has(normalized.toLowerCase())) {
          continue;
        }
        seen.add(normalized.toLowerCase());
        output.push(normalized);
      }
      continue;
    }

    const text = readText(value);
    if (!text) {
      continue;
    }

    for (const token of text.split(',')) {
      const normalized = token.trim();
      if (!normalized || seen.has(normalized.toLowerCase())) {
        continue;
      }
      seen.add(normalized.toLowerCase());
      output.push(normalized);
    }
  }

  return output;
}

export function parseSeriesCast(detail: JsonRecord, mediaType: SeriesMediaType): Array<{ name: string; role?: string; voice?: string }> {
  const output: Array<{ name: string; role?: string; voice?: string }> = [];
  const seen = new Set<string>();
  const rawEntries = [
    ...readArray(detail.cast),
    ...readArray(detail.characters),
  ];

  for (const entry of rawEntries) {
    const record = readRecord(entry);
    const name = readText(record.name) || readText(record.character) || readText(record.title);
    if (!name) {
      continue;
    }

    const role = readText(record.role) || readText(record.character_name) || readText(record.character);
    const voice = mediaType === 'anime'
      ? readText(record.voice) || readText(record.voice_actor) || readText(record.seiyuu)
      : '';
    const dedupeKey = `${name.toLowerCase()}::${(role || '').toLowerCase()}::${(voice || '').toLowerCase()}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    output.push({
      name,
      role: role || undefined,
      voice: voice || undefined,
    });
  }

  return output.slice(0, 18);
}

export function parseSeriesProductionTeam(detail: JsonRecord): string[] {
  return readStringList(
    detail.production,
    detail.production_team,
    detail.producers,
    detail.staff,
    detail.studios,
    detail.network,
  ).slice(0, 12);
}

export function buildPublicSeriesEpisodeSlug({
  seriesSlug,
  episodeSlug,
  label,
  title,
  number,
}: {
  seriesSlug: string;
  episodeSlug: string;
  label?: string | null;
  title?: string | null;
  number?: number | null;
}): string {
  const normalizedSeriesSlug = readText(seriesSlug);
  const normalizedEpisodeSlug = readText(episodeSlug);

  if (normalizedEpisodeSlug && !normalizedEpisodeSlug.includes(':') && normalizedEpisodeSlug.startsWith(`${normalizedSeriesSlug}-`)) {
    return normalizedEpisodeSlug;
  }

  if (number != null && Number.isFinite(number)) {
    return `${normalizedSeriesSlug}-episode-${String(number)}`;
  }

  const labelSlug = slugify(readText(label) || readText(title));
  if (labelSlug) {
    return `${normalizedSeriesSlug}-${labelSlug}`;
  }

  return normalizedEpisodeSlug || normalizedSeriesSlug;
}

export function parsePublicSeriesEpisodeRequest(slug: string): { seriesSlug: string; episodeNumber: number } | null {
  const normalized = readText(slug);
  const match = normalized.match(/^(.*?)-(?:episode|ep)-(\d+(?:\.\d+)?)$/i);
  if (!match) {
    return null;
  }

  const episodeNumber = Number.parseFloat(match[2]);
  if (!Number.isFinite(episodeNumber)) {
    return null;
  }

  return {
    seriesSlug: match[1],
    episodeNumber,
  };
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

export function mapSeriesCard(row: SeriesCatalogRow): SeriesCardItem {
  const type = getSeriesType(row);
  return {
    slug: buildSeriesItemSlug({
      title: row.title,
      fallbackKey: row.item_key,
    }),
    title: collapseRepeatedSeriesTitle(row.title),
    poster: normalizePosterUrl(row.poster_url, row.cover_url),
    background: pickAssetUrl(row.background_url, row.backdrop_url, row.poster_url, row.cover_url),
    backdrop: pickAssetUrl(row.backdrop_url, row.background_url, row.poster_url, row.cover_url),
    logo: pickAssetUrl(row.logo_url),
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

export function getUpcomingScheduleDays(rows: SeriesCatalogRow[], dayCount: number, limitPerDay: number): SeriesScheduleLane[] {
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

function buildSeriesCatalogSelect(
  includeNsfw: boolean,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return `
    select
      i.item_key,
      ${buildCanonicalItemKeySelection('i', schemaCapabilities)} as canonical_item_key,
      ${buildCanonicalItemFlagSelection('i', schemaCapabilities)},
      i.media_type,
      i.surface_type,
      i.presentation_type,
      i.origin_type,
      i.release_country,
      i.is_nsfw,
      i.source,
      ${buildSeriesItemSlugExpression('i')} as slug,
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
      coalesce(episode_counts.episode_count, 0)::int as episode_count
    from public.media_items i
    left join lateral (
      ${buildCanonicalItemLateralSubquery('cl', 'i', schemaCapabilities.itemLinks)}
    ) cl on true
    left join lateral (
      select
        count(*)::int as episode_count
      from public.media_units u
      where u.item_key = i.item_key
        and u.unit_type = 'episode'
    ) episode_counts on true
    left join public.media_item_enrichments f
      on f.item_key = i.item_key
     and f.provider = 'fanart'
     and f.match_status = 'matched'
    left join public.media_item_enrichments e
      on e.item_key = i.item_key
     and e.provider = 'tmdb'
      and e.match_status = 'matched'
    where ${buildSeriesScopeCondition('i')}
      ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
      ${buildSeriesCanonicalShadowFilter('i', schemaCapabilities)}
  `;
}

export function buildSeriesGenreMatchCondition(alias: string, paramRef = '$1'): string {
  return `
    (
      ${alias}.detail -> 'genres' ? ${paramRef}
      or ${alias}.detail -> 'genre_names' ? ${paramRef}
      or ${alias}.detail -> 'category_names' ? ${paramRef}
      or coalesce(${alias}.genre_names, '{}'::text[]) @> array[${paramRef}]
    )
  `;
}

export function buildSeriesGenreAnyMatchCondition(alias: string, paramRef: string): string {
  return `
    (
      ${alias}.detail -> 'genres' ?| ${paramRef}
      or ${alias}.detail -> 'genre_names' ?| ${paramRef}
      or ${alias}.detail -> 'category_names' ?| ${paramRef}
      or coalesce(${alias}.genre_names, '{}'::text[]) && ${paramRef}
    )
  `;
}

export function buildSeriesTypeMatchCondition(type: SeriesMediaType): string {
  if (type === 'donghua') {
    return `(coalesce(i.origin_type, '') = 'donghua' or (coalesce(i.origin_type, '') = '' and i.source = 'anichin'))`;
  }
  if (type === 'drama') {
    return `(coalesce(i.origin_type, '') = 'drama' or i.media_type = 'drama' or i.source in ('drakorid', 'dracinly', 'dramabox'))`;
  }
  return `(coalesce(i.origin_type, '') = 'anime' or (coalesce(i.origin_type, '') not in ('donghua', 'drama') and i.source not in ('anichin', 'drakorid', 'dracinly', 'dramabox') and i.media_type = 'anime'))`;
}

export function buildSeriesCountryMatchCondition(): string {
  return `
    lower(
      coalesce(
        nullif(i.detail ->> 'country', ''),
        nullif(i.detail ->> 'region', ''),
        i.detail -> 'country_names' ->> 0,
        i.release_country,
        ''
      )
    ) = $1
  `;
}

export function buildSeriesYearMatchCondition(): string {
  return `
    coalesce(
      nullif(i.release_year::text, ''),
      nullif(i.detail ->> 'release_year', ''),
      nullif(i.detail ->> 'year', '')
    ) = $1
  `;
}

export function buildSeriesStatusMatchCondition(status: string): string {
  if (status === 'ongoing') {
    return `
      (
        lower(coalesce(i.status, '')) = 'ongoing'
        or lower(coalesce(i.status, '')) = 'airing'
        or lower(coalesce(i.status, '')) = 'currently airing'
        or lower(coalesce(i.status, '')) = 'on-going'
        or lower(coalesce(i.status, '')) like '%ongoing%'
        or lower(coalesce(i.status, '')) like '%airing%'
      )
    `;
  }

  return `lower(coalesce(i.status, '')) = $1`;
}

export async function querySeriesCatalogRows(
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
): Promise<SeriesCatalogRow[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.trunc(limit)) : null;
  const queryParams = [...params];
  let query = buildSeriesCatalogSelect(includeNsfw, schemaCapabilities);
  if (extraWhere.trim()) {
    query += ` and (${extraWhere})`;
  }
  query += ` order by ${orderBy}`;
  if (normalizedLimit != null) {
    queryParams.push(normalizedLimit);
    query += ` limit $${queryParams.length}`;
  }

  return sql.unsafe<SeriesCatalogRow[]>(query, queryParams).then(collapseCanonicalSeriesRows);
}

export async function querySeriesFilterTokens(includeNsfw: boolean): Promise<string[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

  const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
  const rows = await sql.unsafe<Array<{ type_label: string | null; country_label: string | null }>>(`
    select distinct
      case
        when coalesce(i.origin_type, '') = 'donghua' or (coalesce(i.origin_type, '') = '' and i.source = 'anichin') then 'Donghua'
        when coalesce(i.origin_type, '') = 'drama' or i.media_type = 'drama' or i.source in ('drakorid', 'dracinly', 'dramabox') then 'Drama'
        else 'Anime'
      end as type_label,
      coalesce(
        nullif(i.detail ->> 'country', ''),
        nullif(i.detail ->> 'region', ''),
        i.detail -> 'country_names' ->> 0,
        i.release_country,
        ''
      ) as country_label
    from public.media_items i
    where ${buildSeriesScopeCondition('i')}
      ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
      ${buildSeriesCanonicalShadowFilter('i', schemaCapabilities)}
  `);

  const available = new Set<string>();
  for (const row of rows) {
    const typeLabel = readText(row.type_label);
    if (typeLabel) {
      available.add(typeLabel);
    }
    const countryLabel = normalizeBrowseToken(readText(row.country_label));
    if (countryLabel === 'korea') {
      available.add('South Korea');
    } else if (countryLabel) {
      available.add(countryLabel);
    }
  }

  return getSeriesCanonicalFilters(available);
}

export async function querySeriesRecommendationItems(
  {
    currentSlug,
    currentType,
    genres,
    country,
    includeNsfw,
    limit,
  }: {
    currentSlug: string;
    currentType?: SeriesMediaType;
    genres: string[];
    country: string;
    includeNsfw: boolean;
    limit: number;
  },
): Promise<SeriesCardItem[]> {
  const normalizedLimit = Math.max(1, limit);
  const normalizedGenres = genres
    .map((entry) => normalizeBrowseToken(entry))
    .filter(Boolean);
  const normalizedCountry = normalizeBrowseToken(country);

  const queryParams: unknown[] = [currentSlug];
  const predicates = [`${buildSeriesItemSlugExpression('i')} <> $1`];

  if (currentType) {
    predicates.push(buildSeriesTypeMatchCondition(currentType));
  }

  if (normalizedGenres.length > 0) {
    queryParams.push(normalizedGenres);
    predicates.push(buildSeriesGenreAnyMatchCondition('i', `$${queryParams.length}`));
  }

  if (normalizedCountry) {
    queryParams.push(normalizedCountry === 'south korea' ? 'korea' : normalizedCountry);
    predicates.push(`
      lower(
        coalesce(
          nullif(i.detail ->> 'country', ''),
          nullif(i.detail ->> 'region', ''),
          i.detail -> 'country_names' ->> 0,
          i.release_country,
          ''
        )
      ) = $${queryParams.length}
    `);
  }

  const candidateRows = await querySeriesCatalogRows({
    includeNsfw,
    extraWhere: predicates.join(' and '),
    params: queryParams,
    orderBy: 'i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc',
    limit: normalizedLimit * SERIES_CANDIDATE_MULTIPLIER * 2,
  });

  return selectSeriesRecommendations({
    currentSlug,
    currentType,
    genres,
    country,
    limit: normalizedLimit,
    items: candidateRows.map(mapSeriesCard),
  });
}
