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
  resolveSeriesEpisodeNavigation,
  selectCanonicalSeriesRow,
  selectSeriesPlaybackSources,
} from './series-canonical-utils';
import {
  resolveLk21MovieProviderUrl,
} from './movie-lk21-stream-resolver.ts';
import {
  buildPublicSeriesEpisodeSlug,
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
    const normalizedEpisodes = collapseCanonicalEpisodeEntries(episodes).map((episode) => ({
      ...episode,
      slug: buildPublicSeriesEpisodeSlug({
        seriesSlug: row.slug,
        episodeSlug: '',
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
}) {
  return querySeriesRecommendationItems({
    currentSlug,
    currentType,
    genres,
    country,
    includeNsfw,
    limit,
  });
}

export async function getSeriesEpisodeBySlug(
  slug: string,
  options: VisibilityOptions = {},
): Promise<SeriesEpisodeData | null> {
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

  if (shouldUseComicGateway()) {
    return fetchSeriesGatewayJson<SeriesEpisodeData | null>(
      `/api/series/episode/${encodeURIComponent(normalizedSlug)}`,
      {
        includeNsfw: Boolean(options.includeNsfw),
      },
    );
  }

  const visibility = getVisibilityCacheSegment(Boolean(options.includeNsfw));
  const key = buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'episode', normalizedSlug);

  return rememberComicCacheValue(key, DETAIL_CACHE_TTL_SECONDS, async () => {
    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const loadEpisodeRows = (query: string, params: unknown[]) => sql.unsafe<SeriesEpisodeRow[]>(query, params);

    const exactMatchQuery = `
      with matched_unit as (
        select
          u.unit_key as requested_unit_key,
          i.source as requested_source,
          ${buildCanonicalUnitKeyExpression('u', schemaCapabilities)} as canonical_unit_key
        from public.media_units u
        join public.media_items i on i.item_key = u.item_key
        where ${buildSeriesScopeCondition('i')}
          and ${buildSeriesEpisodeSlugExpression('i', 'u')} = $1
          and u.unit_type = 'episode'
          ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
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

    let rows = await loadEpisodeRows(exactMatchQuery, [normalizedSlug]);

    if (rows.length === 0) {
      const parsedPublicRequest = parsePublicSeriesEpisodeRequest(normalizedSlug);
      if (parsedPublicRequest) {
        rows = await loadEpisodeRows(`
          with matched_unit as (
            select
              u.unit_key as requested_unit_key,
              i.source as requested_source,
              ${buildCanonicalUnitKeyExpression('u', schemaCapabilities)} as canonical_unit_key
            from public.media_units u
            join public.media_items i on i.item_key = u.item_key
            where ${buildSeriesScopeCondition('i')}
              and ${buildSeriesItemSlugExpression('i')} = $1
              and u.number = $2
              and u.unit_type = 'episode'
              ${buildVisibilityCondition(Boolean(options.includeNsfw), 'i.detail', 'i.is_nsfw')}
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
        ${buildCanonicalEpisodeLateralSubquery('cu', 'u', schemaCapabilities.unitLinks)}
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
    const collapsedPlaylist = collapseCanonicalEpisodeEntries(playlist).map((entry) => ({
      ...entry,
      slug: buildPublicSeriesEpisodeSlug({
        seriesSlug: row.item_slug,
        episodeSlug: '',
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
      synopsis: readText(episodeDetail.synopsis) || readText(episodeDetail.overview) || readText(itemDetail.synopsis) || readText(itemDetail.overview) || 'Synopsis is still being prepared.',
      detailHref: `/series/${row.item_slug}`,
      mirrors: resolvedMirrors,
      defaultUrl: resolvedDefaultUrl,
      canInlinePlayback: Boolean(resolvedDefaultUrl),
      externalUrl: resolvedDefaultUrl,
      downloadGroups: playback.downloadGroups,
      playlist: collapsedPlaylist,
      prevEpisodeSlug: navigation.prevSlug,
      nextEpisodeSlug: navigation.nextSlug,
    };
  });
}
