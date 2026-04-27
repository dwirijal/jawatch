import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { getComicDb } from '../server/comic-db.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemKeyExpression,
  buildCanonicalItemOrdering,
  buildCanonicalUnitKeyExpression,
  buildCanonicalUnitOrdering,
  getComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import {
  buildComicGatewayUrl,
  readComicOriginSharedToken,
  shouldUseComicGateway,
} from '../server/comic-origin.ts';
import { fetchWithTimeout } from '../fetch-with-timeout.ts';
import { buildSeriesEpisodeHref, parseSeriesEpisodeNumberParam } from '../series-episode-paths.ts';
import {
  buildVisibilityCondition,
  getVisibilityCacheSegment,
  normalizePosterUrl,
  parseVideoDownloads,
  parseVideoMirrors,
  readCanonicalPlaybackOptions,
  readRecord,
  readText,
  type VisibilityOptions,
} from './video-db-common';
import { pickAssetUrl } from '../utils.ts';
import {
  buildCanonicalEpisodeLateralSubquery,
  collapseCanonicalEpisodeEntries,
  selectCanonicalSeriesRow,
  selectSeriesPlaybackSources,
} from './series-canonical-utils';
import { searchSeriesCatalog } from './series-browse.ts';
import { selectSeriesRecommendations } from '../series-recommendations.ts';
import { buildSeriesEpisodeRailState } from './series-episode-playlist.ts';
import {
  resolveLk21MovieProviderUrl,
} from './movie-lk21-stream-resolver.ts';
import {
  buildPublicSeriesEpisodeSlug,
  buildSeriesEpisodeSpecialSlugExpression,
  buildSeriesEpisodeSlugExpression,
  buildSeriesItemSlugExpression,
  buildSeriesScopeCondition,
  collapseRepeatedSeriesTitle,
  DETAIL_CACHE_TTL_SECONDS,
  formatCountryCode,
  formatDetailYear,
  formatRating,
  getLatestEpisodeLabel,
  getRowCountry,
  getSeriesDetailRecord,
  getSeriesGenres,
  getSeriesItemDetailRecord,
  getSeriesType,
  normalizeCountry,
  parsePublicSeriesEpisodeRequest,
  parseSeriesCast,
  parseSeriesProductionTeam,
  querySeriesRecommendationItems,
  readFirstString,
  readPreferredLinkedSourceItemKey,
  readPreferredLinkedSourceUnitDetail,
  readSeriesBackground,
  readSeriesLogo,
  SERIES_CACHE_NAMESPACE,
  type SeriesDetailData,
  type SeriesDetailOptions,
  type SeriesEpisodeData,
  type SeriesEpisodeRow,
  type SeriesRow,
} from './series-shared.ts';
import { type SeriesMediaType } from '../series-presentation.ts';
import { buildSeriesFranchiseSearchQuery } from '../series-franchise.ts';

type SeriesSqlClient = NonNullable<ReturnType<typeof getComicDb>>;
type SeriesDbSchemaCapabilities = Awaited<ReturnType<typeof getComicDbSchemaCapabilities>>;

async function fetchSeriesGatewayJson<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const sharedToken = readComicOriginSharedToken();
  const url = buildComicGatewayUrl(path, params);
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      ...(sharedToken ? { 'x-comic-origin-token': sharedToken } : {}),
    },
    cache: 'no-store',
    timeoutMs: 10_000,
    retries: 1,
  });

  if (!response.ok) {
    throw new Error(`Series gateway request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getSeriesDetailBySlug(
  slug: string,
  options: SeriesDetailOptions = {},
): Promise<SeriesDetailData | null> {
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

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const rows = await sql.unsafe<SeriesRow[]>(`
      with matched_item as (
        select
          i.item_key as requested_item_key,
          i.source as requested_source,
          ${buildCanonicalItemKeyExpression('i', schemaCapabilities)} as canonical_item_key
        from public.media_items i
        where ${buildSeriesScopeCondition('i')}
          and ${buildSeriesItemSlugExpression('i')} = $1
          ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
        order by ${buildCanonicalItemOrdering('i', schemaCapabilities)}i.updated_at desc
        limit 1
      )
      select
        i.item_key,
        mi.requested_item_key,
        mi.requested_source,
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
        i.detail,
        f.payload as fanart_payload,
        e.payload as tmdb_payload,
        i.updated_at
      from matched_item mi
      join public.media_items i on i.item_key = mi.canonical_item_key
      left join public.media_item_enrichments f
        on f.item_key = i.item_key
       and f.provider = 'fanart'
       and f.match_status = 'matched'
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
      title: string;
      label: string;
      number: number | null;
    }>>(`
      select
        coalesce(cu.unit_key, u.unit_key) as canonical_unit_key,
        coalesce(cu.title, u.title) as title,
        coalesce(cu.label, u.label) as label,
        coalesce(cu.number, u.number) as number
      from public.media_units u
      left join lateral (
        ${buildCanonicalEpisodeLateralSubquery('cu', 'u', schemaCapabilities.unitLinks)}
      ) cu on true
      where u.item_key = $1
        and u.unit_type = 'episode'
      order by coalesce(cu.number, u.number) desc nulls last, coalesce(cu.updated_at, u.updated_at) desc
    `, [episodeItemKey]);
    const normalizedEpisodes = collapseCanonicalEpisodeEntries(episodes).map((episode) => {
      const episodeSlug = buildPublicSeriesEpisodeSlug({
        seriesSlug: row.slug,
        episodeSlug: '',
        label: episode.label,
        title: episode.title,
        number: episode.number,
      });

      return {
        ...episode,
        slug: episodeSlug,
        href: buildSeriesEpisodeHref({
          seriesSlug: row.slug,
          episodeSlug,
          label: episode.label,
          title: episode.title,
          number: episode.number,
        }),
        title: collapseRepeatedSeriesTitle(episode.title),
        label: readText(episode.label),
      };
    });

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
      background: readSeriesBackground(detail),
      logo: readSeriesLogo(detail),
      backdrop: pickAssetUrl(detail.backdrop_url, detail.backdrop, detail.poster_url, detail.poster, row.cover_url) || normalizePosterUrl(row.cover_url),
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
  currentTitle,
  currentType,
  genres,
  country,
  includeNsfw = false,
  limit = 8,
}: {
  currentSlug: string;
  currentTitle?: string;
  currentType?: SeriesMediaType;
  genres: string[];
  country: string;
  includeNsfw?: boolean;
  limit?: number;
}) {
  const expandedLimit = Math.max(limit * 3, 12);
  const familyQuery = buildSeriesFranchiseSearchQuery(currentTitle || currentSlug);
  const [relatedItems, familyItems] = await Promise.all([
    querySeriesRecommendationItems({
      currentSlug,
      currentType,
      genres,
      country,
      includeNsfw,
      limit: expandedLimit,
    }),
    familyQuery.length >= 2
      ? searchSeriesCatalog(familyQuery, expandedLimit, { includeNsfw })
      : Promise.resolve([]),
  ]);

  return selectSeriesRecommendations({
    currentSlug,
    currentTitle,
    currentType,
    genres,
    country,
    limit,
    items: [...familyItems, ...relatedItems],
  });
}

function normalizeEpisodeLookupValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function buildSeriesEpisodeMatchQuery(
  schemaCapabilities: Parameters<typeof buildCanonicalUnitKeyExpression>[1],
  matchCondition: string,
): string {
  return `
    with matched_unit as (
      select
        u.unit_key as requested_unit_key,
        i.source as requested_source,
        ${buildCanonicalUnitKeyExpression('u', schemaCapabilities)} as canonical_unit_key
      from public.media_units u
      join public.media_items i on i.item_key = u.item_key
      where ${buildSeriesScopeCondition('i')}
        and ${matchCondition}
        and u.unit_type = 'episode'
      order by ${buildCanonicalUnitOrdering('u', schemaCapabilities)}u.updated_at desc
      limit 1
    )
    select
      i.item_key,
      mu.requested_unit_key,
      mu.requested_source,
      i.media_type,
      i.origin_type,
      i.release_country,
      ${buildSeriesItemSlugExpression('i')} as item_slug,
      i.title as item_title,
      i.cover_url,
      i.release_year,
      i.detail as item_detail,
      f.payload as item_fanart_payload,
      e.payload as item_tmdb_payload,
      ${buildSeriesEpisodeSlugExpression('i', 'u')} as slug,
      u.title,
      u.label,
      u.number,
      u.detail,
      mu.canonical_unit_key
    from matched_unit mu
    join public.media_units u on u.unit_key = mu.canonical_unit_key
    join public.media_items i on i.item_key = u.item_key
    left join public.media_item_enrichments f
      on f.item_key = i.item_key
     and f.provider = 'fanart'
     and f.match_status = 'matched'
    left join public.media_item_enrichments e
      on e.item_key = i.item_key
     and e.provider = 'tmdb'
     and e.match_status = 'matched'
    limit 1
  `;
}

async function buildSeriesEpisodePayload(
  row: SeriesEpisodeRow,
  options: VisibilityOptions,
  sql = getComicDb(),
  schemaCapabilities?: SeriesDbSchemaCapabilities | null,
): Promise<SeriesEpisodeData | null> {
  const resolvedSchemaCapabilities = schemaCapabilities ?? (sql ? await getComicDbSchemaCapabilities(sql) : null);
  if (!sql || !resolvedSchemaCapabilities) {
    return null;
  }

  const preferredSourceItemKey = await readPreferredLinkedSourceItemKey(sql, row.item_key, {
    requestedSource: row.requested_source,
    includeNsfw: Boolean(options.includeNsfw),
  });
  const playlistItemKey = preferredSourceItemKey || readText(row.item_key);
  const playlist = await sql.unsafe<Array<{
    canonical_unit_key: string | null;
    label: string;
    title: string;
    number: number | null;
  }>>(`
    select
      coalesce(cu.unit_key, u.unit_key) as canonical_unit_key,
      coalesce(cu.label, u.label) as label,
      coalesce(cu.title, u.title) as title,
      coalesce(cu.number, u.number) as number
    from public.media_units u
    left join lateral (
      ${buildCanonicalEpisodeLateralSubquery('cu', 'u', resolvedSchemaCapabilities.unitLinks)}
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
    requestedSlug: row.slug,
    canonicalSlug: row.slug,
    sourceMirrors: parseVideoMirrors(sourceEpisodeDetail),
    canonicalMirrors: canonicalPlayback.mirrors,
    sourceDownloadGroups: parseVideoDownloads(sourceEpisodeDetail),
    canonicalDownloadGroups: canonicalPlayback.downloadGroups,
    sourceStreamUrl: readText(sourceEpisodeDetail.stream_url),
  });

  const resolvedMirrors = await Promise.all(
    playback.mirrors.map(async (entry) => ({
      label: entry.label,
      embed_url: await resolveLk21MovieProviderUrl(entry.embed_url),
    })),
  );

  const resolvedDefaultUrl = resolvedMirrors[0]?.embed_url || await resolveLk21MovieProviderUrl(playback.defaultUrl);
  const publicSlug = buildPublicSeriesEpisodeSlug({
    seriesSlug: row.item_slug,
    episodeSlug: '',
    label: row.label,
    title: row.title,
    number: row.number,
  });
  const href = buildSeriesEpisodeHref({
    seriesSlug: row.item_slug,
    episodeSlug: publicSlug,
    label: row.label,
    title: row.title,
    number: row.number,
  });
  const railState = buildSeriesEpisodeRailState({
    entries: playlist,
    currentCanonicalUnitKey: row.canonical_unit_key || row.requested_unit_key || '',
    seriesSlug: row.item_slug,
  });

  return {
    slug: publicSlug,
    href,
    mediaType: getSeriesType(row),
    seriesSlug: row.item_slug,
    seriesTitle: collapseRepeatedSeriesTitle(row.item_title),
    poster: normalizePosterUrl(itemDetail.poster_url, row.cover_url),
    year: formatDetailYear(row.release_year, itemDetail),
    country: normalizeCountry(itemDetail) || formatCountryCode(row.release_country),
    title: collapseRepeatedSeriesTitle(readText(row.title) || `${row.item_title} ${row.label}`.trim()),
    episodeLabel: readText(row.label),
    episodeNumber: row.number == null ? '' : String(row.number),
    synopsis: readText(episodeDetail.synopsis) || readText(episodeDetail.overview) || readText(itemDetail.synopsis) || readText(itemDetail.overview) || 'Synopsis is still being prepared.',
    detailHref: `/series/${row.item_slug}`,
    mirrors: resolvedMirrors,
    defaultUrl: resolvedDefaultUrl,
    canInlinePlayback: Boolean(resolvedDefaultUrl),
    externalUrl: resolvedDefaultUrl,
    downloadGroups: playback.downloadGroups,
    playlist: railState.playlist,
    playlistTotal: railState.playlistTotal,
    prevEpisodeHref: railState.prevEpisodeHref,
    nextEpisodeHref: railState.nextEpisodeHref,
    prevEpisodeSlug: railState.prevEpisodeSlug,
    nextEpisodeSlug: railState.nextEpisodeSlug,
  };
}

async function loadSeriesEpisodeRowsByLegacySlug(
  normalizedSlug: string,
  options: VisibilityOptions,
  sql = getComicDb(),
  schemaCapabilities?: SeriesDbSchemaCapabilities | null,
): Promise<SeriesEpisodeRow[]> {
  const resolvedSchemaCapabilities = schemaCapabilities ?? (sql ? await getComicDbSchemaCapabilities(sql) : null);
  if (!sql || !resolvedSchemaCapabilities || !normalizedSlug) {
    return [];
  }

  const loadEpisodeRows = (query: string, params: unknown[]) => sql.unsafe<SeriesEpisodeRow[]>(query, params);
  const visibilityClause = buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw');

  const rows = await loadEpisodeRows(
    buildSeriesEpisodeMatchQuery(
      resolvedSchemaCapabilities,
      `${buildSeriesEpisodeSlugExpression('i', 'u')} = $1
        ${visibilityClause}`,
    ),
    [normalizedSlug],
  );

  if (rows.length > 0) {
    return rows;
  }

  const parsedPublicRequest = parsePublicSeriesEpisodeRequest(normalizedSlug);
  if (!parsedPublicRequest) {
    return [];
  }

  return loadEpisodeRows(
    buildSeriesEpisodeMatchQuery(
      resolvedSchemaCapabilities,
      `${buildSeriesItemSlugExpression('i')} = $1
        and u.number = $2
        ${visibilityClause}`,
    ),
    [parsedPublicRequest.seriesSlug, parsedPublicRequest.episodeNumber],
  );
}

async function loadSeriesEpisodeRowsByNumber(
  seriesSlug: string,
  episodeNumber: number,
  options: VisibilityOptions,
  sql = getComicDb(),
  schemaCapabilities?: SeriesDbSchemaCapabilities | null,
): Promise<SeriesEpisodeRow[]> {
  const resolvedSchemaCapabilities = schemaCapabilities ?? (sql ? await getComicDbSchemaCapabilities(sql) : null);
  if (!sql || !resolvedSchemaCapabilities || !readText(seriesSlug) || !Number.isFinite(episodeNumber)) {
    return [];
  }

  return sql.unsafe<SeriesEpisodeRow[]>(
    buildSeriesEpisodeMatchQuery(
      resolvedSchemaCapabilities,
      `${buildSeriesItemSlugExpression('i')} = $1
        and u.number = $2
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}`,
    ),
    [seriesSlug, episodeNumber],
  );
}

async function loadSeriesEpisodeRowsBySpecialSlug(
  seriesSlug: string,
  specialSlug: string,
  options: VisibilityOptions,
  sql = getComicDb(),
  schemaCapabilities?: SeriesDbSchemaCapabilities | null,
): Promise<SeriesEpisodeRow[]> {
  const resolvedSchemaCapabilities = schemaCapabilities ?? (sql ? await getComicDbSchemaCapabilities(sql) : null);
  if (!sql || !resolvedSchemaCapabilities || !readText(seriesSlug) || !readText(specialSlug)) {
    return [];
  }

  return sql.unsafe<SeriesEpisodeRow[]>(
    buildSeriesEpisodeMatchQuery(
      resolvedSchemaCapabilities,
      `${buildSeriesItemSlugExpression('i')} = $1
        and u.number is null
        and ${buildSeriesEpisodeSpecialSlugExpression('u')} = $2
        ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}`,
    ),
    [seriesSlug, specialSlug],
  );
}

async function rememberResolvedSeriesEpisode(
  cacheParts: Array<string | number>,
  options: VisibilityOptions,
  rowLoader: (sql: SeriesSqlClient, schemaCapabilities: SeriesDbSchemaCapabilities) => Promise<SeriesEpisodeRow[]>,
): Promise<SeriesEpisodeData | null> {
  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, ...cacheParts);

  return rememberComicCacheValue(key, DETAIL_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const rows = await rowLoader(sql, schemaCapabilities);
    const row = selectCanonicalSeriesRow(rows);
    if (!row) {
      return null;
    }

    return buildSeriesEpisodePayload(row, options, sql, schemaCapabilities);
  });
}

export async function getSeriesEpisodeBySlug(
  slug: string,
  options: VisibilityOptions = {},
): Promise<SeriesEpisodeData | null> {
  const normalizedSlug = normalizeEpisodeLookupValue(slug);
  if (!normalizedSlug) {
    return null;
  }

  if (shouldUseComicGateway()) {
    return fetchSeriesGatewayJson<SeriesEpisodeData | null>(
      `/api/series/episode/${encodeURIComponent(normalizedSlug)}`,
      {
        includeNsfw: Boolean(options.includeNsfw),
      },
    );
  }

  return rememberResolvedSeriesEpisode(
    ['episode-legacy', normalizedSlug],
    options,
    (sql, schemaCapabilities) => loadSeriesEpisodeRowsByLegacySlug(normalizedSlug, options, sql, schemaCapabilities),
  );
}

export async function getSeriesEpisodeByNumber(
  seriesSlug: string,
  episodeNumber: string | number,
  options: VisibilityOptions = {},
): Promise<SeriesEpisodeData | null> {
  const normalizedSeriesSlug = normalizeEpisodeLookupValue(seriesSlug);
  const normalizedEpisodeNumber = typeof episodeNumber === 'number'
    ? episodeNumber
    : parseSeriesEpisodeNumberParam(String(episodeNumber));

  if (!normalizedSeriesSlug || normalizedEpisodeNumber == null) {
    return null;
  }

  return rememberResolvedSeriesEpisode(
    ['episode-number', normalizedSeriesSlug, String(normalizedEpisodeNumber)],
    options,
    (sql, schemaCapabilities) => loadSeriesEpisodeRowsByNumber(normalizedSeriesSlug, normalizedEpisodeNumber, options, sql, schemaCapabilities),
  );
}

export async function getSeriesEpisodeBySpecialSlug(
  seriesSlug: string,
  specialSlug: string,
  options: VisibilityOptions = {},
): Promise<SeriesEpisodeData | null> {
  const normalizedSeriesSlug = normalizeEpisodeLookupValue(seriesSlug);
  const normalizedSpecialSlug = normalizeEpisodeLookupValue(specialSlug);

  if (!normalizedSeriesSlug || !normalizedSpecialSlug) {
    return null;
  }

  return rememberResolvedSeriesEpisode(
    ['episode-special', normalizedSeriesSlug, normalizedSpecialSlug],
    options,
    (sql, schemaCapabilities) => loadSeriesEpisodeRowsBySpecialSlug(normalizedSeriesSlug, normalizedSpecialSlug, options, sql, schemaCapabilities),
  );
}
