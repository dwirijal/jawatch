import 'server-only';

import { unstable_cache } from 'next/cache';
import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { getComicDb } from '../server/comic-db.ts';
import {
  expandSeriesSearchTerms,
  shouldAllowPublicSeriesSearch,
} from '../search/series-query-aliases.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemKeySelection,
  buildCanonicalItemLateralSubquery,
  getComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import {
  buildVisibilityCondition,
  getVisibilityCacheSegment,
  slugify,
  type VisibilityOptions,
} from './video-db-common';
import {
  buildSeriesCanonicalShadowFilter,
  buildSeriesCountryMatchCondition,
  buildSeriesItemSlugExpression,
  buildSeriesGenreMatchCondition,
  buildSeriesScopeCondition,
  buildSeriesStatusMatchCondition,
  buildSeriesTypeMatchCondition,
  buildSeriesYearMatchCondition,
  getDramaPopularity,
  getSeriesType,
  getUpcomingScheduleDays,
  mapSeriesCard,
  normalizeBrowseToken,
  querySeriesCatalogRows,
  querySeriesFilterTokens,
  SEARCH_CACHE_TTL_SECONDS,
  SERIES_CACHE_NAMESPACE,
  type SeriesBrowseKind,
  type SeriesCatalogRow,
  type SeriesHubData,
} from './series-shared.ts';
import { type SeriesCardItem, type SeriesMediaType } from '../series-presentation.ts';
import {
  collapseCanonicalSeriesRows,
  getSeriesSearchCandidateLimit,
} from './series-canonical-utils';

function buildSearchTerms(query: string): string[] {
  return expandSeriesSearchTerms(query);
}

function buildTitleLikePatterns(terms: string[]): string[] {
  return terms.map((term) => `%${term}%`);
}

function buildSlugPatterns(terms: string[]): string[] {
  return terms.map((term) => `%${slugify(term)}%`);
}

async function loadSeriesBrowseItems(
  kind: SeriesBrowseKind,
  value: string | null,
  limit: number,
  includeNsfw: boolean,
): Promise<SeriesCardItem[]> {
  const normalizedLimit = Math.max(1, limit);
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

const getPublicSeriesBrowseItems = unstable_cache(
  async (kind: SeriesBrowseKind, value: string | null, limit: number) => loadSeriesBrowseItems(kind, value, limit, false),
  [SERIES_CACHE_NAMESPACE, 'browse', 'public'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

const getAuthenticatedSeriesBrowseItems = unstable_cache(
  async (kind: SeriesBrowseKind, value: string | null, limit: number) => loadSeriesBrowseItems(kind, value, limit, true),
  [SERIES_CACHE_NAMESPACE, 'browse', 'auth'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

export async function getSeriesBrowseItems(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 24,
  options: VisibilityOptions = {},
): Promise<SeriesCardItem[]> {
  const normalizedValue = normalizeBrowseToken(value ?? '');
  const normalizedLimit = Math.max(1, limit);
  return Boolean(options.includeNsfw)
    ? getAuthenticatedSeriesBrowseItems(kind, normalizedValue, normalizedLimit)
    : getPublicSeriesBrowseItems(kind, normalizedValue, normalizedLimit);
}

async function loadSeriesHubData(
  limit: number,
  includeNsfw: boolean,
  includeFilters: boolean,
): Promise<SeriesHubData> {
  const normalizedLimit = Math.max(1, limit);
  const scheduleCandidateLimit = Math.max(normalizedLimit * 2, 36);
  const [popularCandidates, latestRows, dramaCandidates, scheduleRows, filters] = await Promise.all([
    querySeriesCatalogRows({
      includeNsfw,
      orderBy: 'i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc',
      limit: normalizedLimit * 4,
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
      limit: normalizedLimit * 4,
    }),
    querySeriesCatalogRows({
      includeNsfw,
      extraWhere: `lower(coalesce(i.cadence, '')) = 'weekly' and coalesce(i.release_day, '') <> ''`,
      orderBy: `i.next_release_at asc nulls last, i.score desc nulls last, coalesce(episode_counts.episode_count, 0) desc, i.updated_at desc`,
      limit: scheduleCandidateLimit,
    }),
    includeFilters ? querySeriesFilterTokens(includeNsfw) : Promise.resolve([]),
  ]);

  const popularRows = [...popularCandidates].sort((left, right) => {
    const leftScore = getSeriesType(left) === 'drama'
      ? getDramaPopularity({ category_names: left.category_names })
      : ((left.score ?? 0) * 1000) + (left.episode_count ?? 0);
    const rightScore = getSeriesType(right) === 'drama'
      ? getDramaPopularity({ category_names: right.category_names })
      : ((right.score ?? 0) * 1000) + (right.episode_count ?? 0);
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

const getPublicSeriesHubData = unstable_cache(
  async (limit: number, includeFilters: boolean) => loadSeriesHubData(limit, false, includeFilters),
  [SERIES_CACHE_NAMESPACE, 'hub', 'public'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

const getAuthenticatedSeriesHubData = unstable_cache(
  async (limit: number, includeFilters: boolean) => loadSeriesHubData(limit, true, includeFilters),
  [SERIES_CACHE_NAMESPACE, 'hub', 'auth'],
  { revalidate: SEARCH_CACHE_TTL_SECONDS },
);

export async function getSeriesHubData(
  limit = 24,
  options: VisibilityOptions & { includeFilters?: boolean } = {},
): Promise<SeriesHubData> {
  const normalizedLimit = Math.max(1, limit);
  const includeFilters = options.includeFilters !== false;
  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const cacheKey = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'hub', normalizedLimit, includeFilters ? 'filters' : 'no-filters');
  return rememberComicCacheValue(cacheKey, SEARCH_CACHE_TTL_SECONDS, async () => (
    Boolean(options.includeNsfw)
      ? getAuthenticatedSeriesHubData(normalizedLimit, includeFilters)
      : getPublicSeriesHubData(normalizedLimit, includeFilters)
  ));
}

export async function getSeriesFilteredItems(
  filter: string,
  limit = 24,
  options: VisibilityOptions = {},
): Promise<SeriesCardItem[]> {
  const normalizedFilter = filter.trim().toLowerCase();
  if (!normalizedFilter) {
    return [];
  }

  if (normalizedFilter === 'anime' || normalizedFilter === 'drama' || normalizedFilter === 'donghua') {
    return getSeriesBrowseItems('type', normalizedFilter, limit, options);
  }

  return getSeriesBrowseItems('country', normalizedFilter, limit, options);
}

async function searchSeriesCatalogFallbackRows(
  sql: NonNullable<ReturnType<typeof getComicDb>>,
  schemaCapabilities: Awaited<ReturnType<typeof getComicDbSchemaCapabilities>>,
  terms: string[],
  includeNsfw: boolean,
  limit: number,
): Promise<SeriesCatalogRow[]> {
  return sql.unsafe<SeriesCatalogRow[]>(`
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
      i.detail ->> 'background_url' as background_url,
      i.detail ->> 'backdrop_url' as backdrop_url,
      i.detail ->> 'logo_url' as logo_url,
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
      0::int as episode_count
    from public.media_items i
    left join lateral (
      ${buildCanonicalItemLateralSubquery('cl', 'i', schemaCapabilities.itemLinks)}
    ) cl on true
    where ${buildSeriesScopeCondition('i')}
      ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
      ${buildSeriesCanonicalShadowFilter('i', schemaCapabilities)}
      and (
        lower(i.title) = any($1::text[])
        or ${buildSeriesItemSlugExpression('i')} = any($2::text[])
        or i.title ilike any($3::text[])
        or ${buildSeriesItemSlugExpression('i')} ilike any($4::text[])
      )
    order by
      case
        when lower(i.title) = any($1::text[]) then 0
        when ${buildSeriesItemSlugExpression('i')} = any($2::text[]) then 1
        else 2
      end,
      i.score desc nulls last,
      i.updated_at desc
    limit $5
  `, [
    terms.map((term) => term.toLowerCase()),
    terms.map((term) => slugify(term)),
    buildTitleLikePatterns(terms),
    buildSlugPatterns(terms),
    getSeriesSearchCandidateLimit(limit),
  ]);
}

export async function searchSeriesCatalog(
  query: string,
  limit = 8,
  options: VisibilityOptions = {},
): Promise<SeriesCardItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'search-v2', trimmed.toLowerCase(), limit);
  return rememberComicCacheValue(key, SEARCH_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return [];
    }

    const includeNsfw = Boolean(options.includeNsfw) || shouldAllowPublicSeriesSearch(trimmed);
    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const terms = buildSearchTerms(trimmed);

    let rows: SeriesCatalogRow[] = [];
    try {
      rows = await sql.unsafe<SeriesCatalogRow[]>(`
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
          i.release_window,
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
        left join public.media_item_enrichments f
          on f.item_key = i.item_key
         and f.provider = 'fanart'
         and f.match_status = 'matched'
        left join public.media_item_enrichments e
          on e.item_key = i.item_key
         and e.provider = 'tmdb'
         and e.match_status = 'matched'
        left join lateral (
          select
            count(*)::int as episode_count
          from public.media_units u
          where u.item_key = i.item_key
            and u.unit_type = 'episode'
        ) episode_counts on true
        where ${buildSeriesScopeCondition('i')}
          ${buildVisibilityCondition(includeNsfw, 'i.detail', 'i.is_nsfw')}
          ${buildSeriesCanonicalShadowFilter('i', schemaCapabilities)}
          and (
            search_vec @@ plainto_tsquery('simple', $1)
            or i.title ilike any($2::text[])
            or ${buildSeriesItemSlugExpression('i')} ilike any($3::text[])
          )
        order by
          case
            when lower(i.title) = any($4::text[]) then 0
            when ${buildSeriesItemSlugExpression('i')} = any($5::text[]) then 1
            else 2
          end,
          i.score desc nulls last,
          i.updated_at desc
        limit $6
      `, [
        trimmed,
        buildTitleLikePatterns(terms),
        buildSlugPatterns(terms),
        terms.map((term) => term.toLowerCase()),
        terms.map((term) => slugify(term)),
        getSeriesSearchCandidateLimit(limit),
      ]);
    } catch {
      rows = [];
    }

    if (rows.length === 0) {
      rows = await searchSeriesCatalogFallbackRows(
        sql,
        schemaCapabilities,
        terms,
        includeNsfw,
        limit,
      );
    }

    return collapseCanonicalSeriesRows(rows, { limit: Math.max(1, limit) }).map(mapSeriesCard);
  });
}

export function getSeriesFilterSlug(value: string): string {
  return slugify(value);
}
