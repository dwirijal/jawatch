import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '@/lib/server/comic-cache';
import { getComicDb, type ComicDbClient } from '@/lib/server/comic-db';
import {
  buildVisibilityCondition,
  getVisibilityCacheSegment,
  normalizeGenreList,
  normalizePosterUrl,
  parseVideoDownloads,
  parseVideoMirrors,
  readCanonicalPlaybackOptions,
  readNumber,
  readRecord,
  readText,
  slugify,
  type JsonRecord,
  type VideoDownloadGroup,
  type VideoMirror,
  type VisibilityOptions,
} from './video-db-common';
import { readArray, readStringArray } from './video-db';
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
import { resolveSeriesMediaType } from '@/lib/series-taxonomy';
import {
  buildCanonicalEpisodeLateralSubquery,
  collapseCanonicalEpisodeEntries,
  collapseCanonicalSeriesRows,
  getSeriesSearchCandidateLimit,
  resolveSeriesEpisodeNavigation,
  selectCanonicalSeriesRow,
  selectPreferredLinkedSourceItem,
  selectPreferredLinkedSourceUnit,
  selectSeriesPlaybackSources,
} from './series-canonical-utils';

type SeriesRow = {
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
  slug: string;
  title: string;
  label: string;
  number: number | null;
  prev_slug: string | null;
  next_slug: string | null;
  detail: JsonRecord | null;
  source_detail?: JsonRecord | null;
};

type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year' | 'status';

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

const DETAIL_CACHE_TTL_SECONDS = 60 * 30;
const SEARCH_CACHE_TTL_SECONDS = 60 * 3;
const SERIES_CACHE_NAMESPACE = 'series-v8';
const SERIES_CANDIDATE_MULTIPLIER = 4;

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

function buildSeriesScopeCondition(alias: string): string {
  return `(
    ${alias}.surface_type = 'series'
    or (${alias}.surface_type = 'unknown' and ${alias}.media_type in ('anime', 'drama'))
  )`;
}

function buildSeriesCanonicalShadowCondition(alias: string): string {
  return `
    and (
      coalesce(${alias}.is_canonical, false) = true
      or not exists (
        select 1
        from public.media_items canonical_item
        where canonical_item.slug = ${alias}.slug
          and ${buildSeriesScopeCondition('canonical_item')}
          and coalesce(canonical_item.is_canonical, false) = true
      )
    )
  `;
}

async function readPreferredLinkedSourceItemKey(
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

async function readPreferredLinkedSourceUnitDetail(
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
  return resolveSeriesMediaType({
    originType: row.origin_type,
    mediaType: row.media_type,
    source: 'source' in row ? row.source : null,
  });
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

function parseSeriesCast(detail: JsonRecord, mediaType: SeriesMediaType): Array<{ name: string; role?: string; voice?: string }> {
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

function parseSeriesProductionTeam(detail: JsonRecord): string[] {
  return readStringList(
    detail.production,
    detail.production_team,
    detail.producers,
    detail.staff,
    detail.studios,
    detail.network,
  ).slice(0, 12);
}

function buildPublicSeriesEpisodeSlug({
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

function parsePublicSeriesEpisodeRequest(slug: string): { seriesSlug: string; episodeNumber: number } | null {
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

function buildSeriesCatalogSelect(includeNsfw: boolean): string {
  return `
    select
      i.item_key,
      coalesce(
        case when coalesce(i.is_canonical, false) then i.item_key end,
        (
          select mil.canonical_item_key
          from public.media_item_links mil
          where mil.source_item_key = i.item_key
          order by mil.is_primary desc, mil.priority desc, mil.updated_at desc
          limit 1
        ),
        i.item_key
      ) as canonical_item_key,
      i.is_canonical,
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
      coalesce(episode_counts.episode_count, 0)::int as episode_count
    from public.media_items i
    left join (
      select
        u.item_key,
        count(*)::int as episode_count
      from public.media_units u
      where u.unit_type = 'episode'
      group by u.item_key
    ) episode_counts on episode_counts.item_key = i.item_key
    where ${buildSeriesScopeCondition('i')}
      ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
      ${buildSeriesCanonicalShadowCondition('i')}
  `;
}

function buildSeriesGenreMatchCondition(alias: string, paramRef = '$1'): string {
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

function buildSeriesGenreAnyMatchCondition(alias: string, paramRef: string): string {
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

function buildSeriesTypeMatchCondition(type: SeriesMediaType): string {
  if (type === 'donghua') {
    return `(coalesce(i.origin_type, '') = 'donghua' or (coalesce(i.origin_type, '') = '' and i.source = 'anichin'))`;
  }
  if (type === 'drama') {
    return `(coalesce(i.origin_type, '') = 'drama' or i.media_type = 'drama' or i.source in ('drakorid', 'dracinly', 'dramabox'))`;
  }
  return `(coalesce(i.origin_type, '') = 'anime' or (coalesce(i.origin_type, '') not in ('donghua', 'drama') and i.source not in ('anichin', 'drakorid', 'dracinly', 'dramabox') and i.media_type = 'anime'))`;
}

function buildSeriesCountryMatchCondition(): string {
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

function buildSeriesYearMatchCondition(): string {
  return `
    coalesce(
      nullif(i.release_year::text, ''),
      nullif(i.detail ->> 'release_year', ''),
      nullif(i.detail ->> 'year', '')
    ) = $1
  `;
}

function buildSeriesStatusMatchCondition(status: string): string {
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

async function querySeriesCatalogRows(
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

  const normalizedLimit = typeof limit === 'number' ? Math.max(1, Math.trunc(limit)) : null;
  const queryParams = [...params];
  let query = buildSeriesCatalogSelect(includeNsfw);
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

async function querySeriesFilterTokens(includeNsfw: boolean): Promise<string[]> {
  const sql = getComicDb();
  if (!sql) {
    return [];
  }

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
      ${buildSeriesCanonicalShadowCondition('i')}
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

async function querySeriesRecommendationItems(
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
  const predicates = ['i.slug <> $1'];

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

export async function getSeriesBrowseItems(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 24,
  options: VisibilityOptions = {},
): Promise<SeriesCardItem[]> {
  const normalizedLimit = Math.max(1, limit);
  const includeNsfw = Boolean(options.includeNsfw);
  const normalizedValue = normalizeBrowseToken(value ?? '');
  let filteredRows: SeriesCatalogRow[] = [];

  if (kind === 'list') {
    filteredRows = await querySeriesCatalogRows({
      includeNsfw,
      orderBy: 'i.updated_at desc',
      limit: normalizedLimit,
    });
  } else if (normalizedValue) {
    switch (kind) {
      case 'type':
        filteredRows = await querySeriesCatalogRows({
          includeNsfw,
          extraWhere: buildSeriesTypeMatchCondition(normalizedValue as SeriesMediaType),
          orderBy: 'i.updated_at desc',
          limit: normalizedLimit,
        });
        break;
      case 'genre':
        filteredRows = await querySeriesCatalogRows({
          includeNsfw,
          extraWhere: buildSeriesGenreMatchCondition('i'),
          params: [normalizedValue],
          orderBy: 'i.updated_at desc',
          limit: normalizedLimit,
        });
        break;
      case 'country': {
        const countryValue = normalizedValue === 'south korea' ? 'korea' : normalizedValue;
        filteredRows = await querySeriesCatalogRows({
          includeNsfw,
          extraWhere: buildSeriesCountryMatchCondition(),
          params: [countryValue],
          orderBy: 'i.updated_at desc',
          limit: normalizedLimit,
        });
        break;
      }
      case 'year':
        filteredRows = await querySeriesCatalogRows({
          includeNsfw,
          extraWhere: buildSeriesYearMatchCondition(),
          params: [normalizedValue],
          orderBy: 'i.updated_at desc',
          limit: normalizedLimit,
        });
        break;
      case 'status':
        filteredRows = await querySeriesCatalogRows({
          includeNsfw,
          extraWhere: buildSeriesStatusMatchCondition(normalizedValue),
          params: normalizedValue === 'ongoing' ? [] : [normalizedValue],
          orderBy: 'i.updated_at desc',
          limit: normalizedLimit,
        });
        break;
      default:
        filteredRows = [];
        break;
    }
  }

  return filteredRows.slice(0, normalizedLimit).map(mapSeriesCard);
}

export async function getSeriesHubData(limit = 24, options: VisibilityOptions = {}): Promise<SeriesHubData> {
  const normalizedLimit = Math.max(1, limit);
  const includeNsfw = Boolean(options.includeNsfw);
  const [popularCandidates, latestRows, dramaCandidates, scheduleRows, filters] = await Promise.all([
    querySeriesCatalogRows({
      includeNsfw,
      orderBy: 'i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc',
      limit: normalizedLimit * SERIES_CANDIDATE_MULTIPLIER,
    }),
    querySeriesCatalogRows({
      includeNsfw,
      orderBy: 'i.updated_at desc',
      limit: normalizedLimit,
    }),
    querySeriesCatalogRows({
      includeNsfw,
      extraWhere: buildSeriesTypeMatchCondition('drama'),
      orderBy: 'i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc',
      limit: normalizedLimit * SERIES_CANDIDATE_MULTIPLIER,
    }),
    querySeriesCatalogRows({
      includeNsfw,
      extraWhere: `lower(coalesce(i.cadence, '')) = 'weekly' and coalesce(i.release_day, '') <> ''`,
      orderBy: `i.next_release_at asc nulls last, i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc`,
      limit: 120,
    }),
    querySeriesFilterTokens(includeNsfw),
  ]);

  const popularRows = [...popularCandidates].sort((left, right) => {
    const leftScore = getSeriesType(left) === 'drama'
      ? getDramaPopularity({ category_names: left.category_names })
      : (readNumber(left.score) ?? 0) * 1000 + (left.episode_count ?? 0);
    const rightScore = getSeriesType(right) === 'drama'
      ? getDramaPopularity({ category_names: right.category_names })
      : (readNumber(right.score) ?? 0) * 1000 + (right.episode_count ?? 0);
    return rightScore - leftScore;
  });

  const dramaSpotlight = dramaCandidates
    .filter((row) => getSeriesType(row) === 'drama')
    .sort((left, right) => getDramaPopularity({ category_names: right.category_names }) - getDramaPopularity({ category_names: left.category_names }))
    .slice(0, normalizedLimit)
    .map(mapSeriesCard);

  return {
    popular: popularRows.slice(0, normalizedLimit).map(mapSeriesCard),
    latest: latestRows.slice(0, normalizedLimit).map(mapSeriesCard),
    dramaSpotlight,
    weeklySchedule: getUpcomingScheduleDays(scheduleRows, 3, 6),
    filters,
  };
}

export async function getSeriesFilteredItems(filter: string, limit = 24, options: VisibilityOptions = {}): Promise<SeriesCardItem[]> {
  const normalizedFilter = filter.trim().toLowerCase();
  if (!normalizedFilter) {
    return [];
  }

  if (normalizedFilter === 'anime' || normalizedFilter === 'drama' || normalizedFilter === 'donghua') {
    return getSeriesBrowseItems('type', normalizedFilter, limit, options);
  }

  return getSeriesBrowseItems('country', normalizedFilter, limit, options);
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
        coalesce(
          case when coalesce(i.is_canonical, false) then i.item_key end,
          (
            select mil.canonical_item_key
            from public.media_item_links mil
            where mil.source_item_key = i.item_key
            order by mil.is_primary desc, mil.priority desc, mil.updated_at desc
            limit 1
          ),
          i.item_key
        ) as canonical_item_key,
        i.is_canonical,
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
      where ${buildSeriesScopeCondition('i')}
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        ${buildSeriesCanonicalShadowCondition('i')}
        and (
          search_vec @@ plainto_tsquery('simple', $1)
          or title ilike $2
        )
      order by score desc nulls last, updated_at desc
      limit $3
    `, [trimmed, `%${trimmed}%`, getSeriesSearchCandidateLimit(limit)]);

    return collapseCanonicalSeriesRows(rows, { limit: Math.max(1, limit) }).map(mapSeriesCard);
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
      with matched_item as (
        select
          i.item_key as requested_item_key,
          i.source as requested_source,
          coalesce(
            case when coalesce(i.is_canonical, false) then i.item_key end,
            (
              select mil.canonical_item_key
              from public.media_item_links mil
              where mil.source_item_key = i.item_key
              order by mil.is_primary desc, mil.priority desc, mil.updated_at desc
              limit 1
            ),
            i.item_key
          ) as canonical_item_key
        from public.media_items i
        where ${buildSeriesScopeCondition('i')}
          and i.slug = $1
          ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        order by coalesce(i.is_canonical, false) desc, i.updated_at desc
        limit 1
      )
      select
        i.item_key,
        mi.requested_item_key,
        mi.requested_source,
        i.is_canonical,
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
      from matched_item mi
      join public.media_items i on i.item_key = mi.canonical_item_key
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      limit 1
    `, [normalizedSlug]);

    const row = selectCanonicalSeriesRow(rows);
    if (!row) {
      return null;
    }

    const preferredSourceItemKey = await readPreferredLinkedSourceItemKey(sql, row.item_key, {
      requestedItemKey: row.requested_item_key,
      requestedSource: row.requested_source,
      includeNsfw: Boolean(options.includeNsfw),
    });
    const episodeItemKey = preferredSourceItemKey || row.item_key;
    const episodes = await sql.unsafe<Array<{
      canonical_unit_key: string | null;
      slug: string;
      title: string;
      label: string;
      number: number | null;
    }>>(`
      select
        coalesce(cu.unit_key, u.unit_key) as canonical_unit_key,
        coalesce(cu.slug, u.slug) as slug,
        coalesce(cu.title, u.title) as title,
        coalesce(cu.label, u.label) as label,
        coalesce(cu.number, u.number) as number
      from public.media_units u
      left join lateral (
        ${buildCanonicalEpisodeLateralSubquery('cu', 'u')}
      ) cu on true
      where u.item_key = $1
        and u.unit_type = 'episode'
      order by coalesce(cu.number, u.number) desc nulls last, coalesce(cu.updated_at, u.updated_at) desc
    `, [episodeItemKey]);
    const normalizedEpisodes = collapseCanonicalEpisodeEntries(episodes).map((episode) => ({
      ...episode,
      slug: buildPublicSeriesEpisodeSlug({
        seriesSlug: row.slug,
        episodeSlug: episode.slug,
        label: episode.label,
        title: episode.title,
        number: episode.number,
      }),
      title: collapseRepeatedSeriesTitle(episode.title),
      label: readText(episode.label),
    }));

    const detail = getSeriesDetailRecord(row);
    const genres = getSeriesGenres(detail);
    const country = getRowCountry(row);
    const mediaType = getSeriesType(row);
    const cast = parseSeriesCast(detail, mediaType);
    const productionTeam = parseSeriesProductionTeam(detail);
    const recommendations = options.includeRecommendations === false
      ? []
      : await querySeriesRecommendationItems({
          currentSlug: row.slug,
          currentType: mediaType,
          genres,
          country,
          includeNsfw: Boolean(options.includeNsfw),
          limit: 8,
        });

    return {
      slug: row.slug,
      mediaType,
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
        mediaType === 'donghua'
          ? 'Donghua Series'
          : mediaType === 'drama'
            ? 'Drama Series'
            : 'Anime Series'
      ),
      episodeCount: normalizedEpisodes.length ? String(normalizedEpisodes.length) : readText(detail.episodes_text),
      latestEpisode: getLatestEpisodeLabel(row),
      studio: readText(detail.studio) || readText(detail.studios) || readText(detail.network),
      director: readText(detail.director) || readFirstString(detail.directors),
      cast,
      productionTeam,
      sourceLabel: row.source,
      episodes: normalizedEpisodes,
      recommendations,
    };
  });
}

export async function getSeriesRecommendations({
  currentSlug,
  currentType,
  genres,
  country,
  includeNsfw = false,
  limit = 8,
}: {
  currentSlug: string;
  currentType?: SeriesMediaType;
  genres: string[];
  country: string;
  includeNsfw?: boolean;
  limit?: number;
}): Promise<SeriesCardItem[]> {
  return querySeriesRecommendationItems({
    currentSlug,
    currentType,
    genres,
    country,
    includeNsfw,
    limit,
  });
}

export async function getSeriesEpisodeBySlug(slug: string, options: VisibilityOptions = {}): Promise<SeriesEpisodeData | null> {
  const normalizedSlug = (() => {
    const trimmed = slug.trim();
    if (!trimmed) {
      return '';
    }

    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();
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

    const loadEpisodeRows = (query: string, params: unknown[]) => sql.unsafe<SeriesEpisodeRow[]>(query, params);

    const exactMatchQuery = `
      with matched_unit as (
        select
          u.unit_key as requested_unit_key,
          i.source as requested_source,
          coalesce(
            case when coalesce(u.is_canonical, false) then u.unit_key end,
            (
              select mul.canonical_unit_key
              from public.media_unit_links mul
              where mul.source_unit_key = u.unit_key
              order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
              limit 1
            ),
            u.unit_key
          ) as canonical_unit_key
        from public.media_units u
        join public.media_items i on i.item_key = u.item_key
        where ${buildSeriesScopeCondition('i')}
          and u.slug = $1
          and u.unit_type = 'episode'
          ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        order by coalesce(u.is_canonical, false) desc, u.updated_at desc
        limit 1
      )
      select
        i.item_key,
        mu.requested_unit_key,
        mu.requested_source,
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
        u.detail,
        mu.canonical_unit_key
      from matched_unit mu
      join public.media_units u on u.unit_key = mu.canonical_unit_key
      join public.media_items i on i.item_key = u.item_key
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      limit 1
    `;

    let rows = await loadEpisodeRows(exactMatchQuery, [normalizedSlug]);

    if (rows.length === 0) {
      const parsedPublicRequest = parsePublicSeriesEpisodeRequest(normalizedSlug);
      if (parsedPublicRequest) {
        rows = await loadEpisodeRows(`
          with matched_unit as (
            select
              u.unit_key as requested_unit_key,
              i.source as requested_source,
              coalesce(
                case when coalesce(u.is_canonical, false) then u.unit_key end,
                (
                  select mul.canonical_unit_key
                  from public.media_unit_links mul
                  where mul.source_unit_key = u.unit_key
                  order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
                  limit 1
                ),
                u.unit_key
              ) as canonical_unit_key
            from public.media_units u
            join public.media_items i on i.item_key = u.item_key
            where ${buildSeriesScopeCondition('i')}
              and i.slug = $1
              and u.number = $2
              and u.unit_type = 'episode'
              ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
            order by coalesce(u.is_canonical, false) desc, u.updated_at desc
            limit 1
          )
          select
            i.item_key,
            mu.requested_unit_key,
            mu.requested_source,
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
            u.detail,
            mu.canonical_unit_key
          from matched_unit mu
          join public.media_units u on u.unit_key = mu.canonical_unit_key
          join public.media_items i on i.item_key = u.item_key
          left join public.media_item_enrichments e
            on e.item_key = i.item_key
           and e.provider = 'tmdb'
           and e.match_status = 'matched'
          limit 1
        `, [parsedPublicRequest.seriesSlug, parsedPublicRequest.episodeNumber]);
      }
    }

    const row = selectCanonicalSeriesRow(rows);
    if (!row) {
      return null;
    }

    const preferredSourceItemKey = await readPreferredLinkedSourceItemKey(sql, row.item_key, {
      requestedSource: row.requested_source,
      includeNsfw: Boolean(options.includeNsfw),
    });
    const playlistItemKey = preferredSourceItemKey || readText(row.item_key);
    const playlist = await sql.unsafe<Array<{
      canonical_unit_key: string | null;
      slug: string;
      label: string;
      title: string;
      number: number | null;
    }>>(`
      select
        coalesce(cu.unit_key, u.unit_key) as canonical_unit_key,
        coalesce(cu.slug, u.slug) as slug,
        coalesce(cu.label, u.label) as label,
        coalesce(cu.title, u.title) as title,
        coalesce(cu.number, u.number) as number
      from public.media_units u
      left join lateral (
        ${buildCanonicalEpisodeLateralSubquery('cu', 'u')}
      ) cu on true
      where u.item_key = $1
        and u.unit_type = 'episode'
      order by coalesce(cu.number, u.number) desc nulls last, coalesce(cu.updated_at, u.updated_at) desc
    `, [playlistItemKey]);

    const itemDetail = getSeriesItemDetailRecord(row);
    const episodeDetail = readRecord(row.detail);
    const sourceDetail = await readPreferredLinkedSourceUnitDetail(sql, row.canonical_unit_key, {
      requestedUnitKey: row.requested_unit_key,
      linkedSourceItemKey: preferredSourceItemKey,
      requestedSource: row.requested_source,
      includeNsfw: Boolean(options.includeNsfw),
    });
    const sourceEpisodeDetail = {
      ...episodeDetail,
      ...sourceDetail,
    };
    const canonicalPlayback = await readCanonicalPlaybackOptions(sql, row.canonical_unit_key);
    const playback = selectSeriesPlaybackSources({
      requestedSlug: normalizedSlug,
      canonicalSlug: row.slug,
      sourceMirrors: parseVideoMirrors(sourceEpisodeDetail),
      canonicalMirrors: canonicalPlayback.mirrors,
      sourceDownloadGroups: parseVideoDownloads(sourceEpisodeDetail),
      canonicalDownloadGroups: canonicalPlayback.downloadGroups,
      sourceStreamUrl: readText(sourceEpisodeDetail.stream_url),
    });
    const publicSlug = buildPublicSeriesEpisodeSlug({
      seriesSlug: row.item_slug,
      episodeSlug: row.slug,
      label: row.label,
      title: row.title,
      number: row.number,
    });
    const collapsedPlaylist = collapseCanonicalEpisodeEntries(playlist).map((entry) => ({
      ...entry,
      slug: buildPublicSeriesEpisodeSlug({
        seriesSlug: row.item_slug,
        episodeSlug: entry.slug,
        label: entry.label,
        title: entry.title,
        number: entry.number,
      }),
    }));
    const navigation = resolveSeriesEpisodeNavigation({
      currentSlug: publicSlug,
      playlist: collapsedPlaylist,
    });

    return {
      slug: publicSlug,
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
      mirrors: playback.mirrors,
      defaultUrl: playback.defaultUrl,
      canInlinePlayback: Boolean(playback.defaultUrl),
      externalUrl: playback.defaultUrl,
      downloadGroups: playback.downloadGroups,
      playlist: collapsedPlaylist,
      prevEpisodeSlug: navigation.prevSlug,
      nextEpisodeSlug: navigation.nextSlug,
    };
  });
}

export function getSeriesFilterSlug(value: string): string {
  return slugify(value);
}
