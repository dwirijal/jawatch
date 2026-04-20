import 'server-only';

import { buildComicCacheKey, rememberComicCacheValue } from '../server/comic-cache.ts';
import { getComicDb } from '../server/comic-db.ts';
import {
  buildCanonicalItemFlagSelection,
  buildCanonicalItemOrdering,
  buildCanonicalUnitKeyExpression,
  buildCanonicalUnitOrdering,
  getComicDbSchemaCapabilities,
} from '../server/comic-db-schema.ts';
import { shouldUseComicGateway } from '../server/comic-origin.ts';
import { pickAssetUrl } from '../utils.ts';
import { readCanonicalPlaybackOptions } from './video-db-common.ts';
import {
  buildDownloadGroups,
  buildMirrorEntries,
  getVideoGenres,
  isVideoNsfw,
  normalizePosterUrl,
  readNumber,
  readRecord,
  readStringArray,
  readText,
  type VideoItemRow,
  type VideoUnitRow,
  type VisibilityOptions,
} from './video-db.ts';
import {
  applyLk21ExternalFallback,
  buildMovieGenreAnyMatchCondition,
  buildMovieItemSlugExpression,
  buildMovieScopeCondition,
  DETAIL_CACHE_TTL_SECONDS,
  fetchOptionalMovieGatewayJson,
  formatDuration,
  formatRating,
  formatYear,
  getMovieDetailRecord,
  getMovieItemDetailRecord,
  mapMovieCard,
  mapMovieCast,
  MOVIE_CACHE_NAMESPACE,
  normalizeMovieWatchPayload,
  queryMovieCatalogRows,
  readMovieBackground,
  readMovieLogo,
  resolveMovieDownloadGroups,
  resolveMovieMirrorEntries,
  sortMovieRows,
  type MovieDetailData,
  type MovieWatchData,
  visibilitySegment,
} from './movie-shared.ts';
import { resolveLk21MovieProviderUrl } from './movie-lk21-stream-resolver.ts';

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

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const rows = await sql.unsafe<VideoItemRow[]>(`
      select
        i.item_key,
        ${buildCanonicalItemFlagSelection('i', schemaCapabilities)},
        i.source,
        i.media_type,
        ${buildMovieItemSlugExpression('i')} as slug,
        i.title,
        i.cover_url,
        i.status,
        i.release_year,
        i.score,
        i.detail,
        f.payload as fanart_payload,
        e.payload as tmdb_payload,
        i.updated_at,
        0::int as unit_count
      from public.media_items i
      left join public.media_item_enrichments f
        on f.item_key = i.item_key
       and f.provider = 'fanart'
       and f.match_status = 'matched'
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where ${buildMovieScopeCondition('i')}
        and ${buildMovieItemSlugExpression('i')} = $1
      order by ${buildCanonicalItemOrdering('i', schemaCapabilities)}i.updated_at desc
      limit 1
    `, [normalizedSlug]);

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
          const clauses = [`${buildMovieItemSlugExpression('i')} <> $1`];
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
      background: readMovieBackground(detail),
      logo: readMovieLogo(detail),
      backdrop: pickAssetUrl(detail.backdrop_url, detail.backdrop, detail.poster_url, detail.poster, row.cover_url) || normalizePosterUrl(row.cover_url),
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
      const gatewayPayload = await fetchOptionalMovieGatewayJson<MovieWatchData>(`/api/movies/watch/${encodeURIComponent(normalizedSlug)}`, {
        includeNsfw: Boolean(options.includeNsfw),
      });
      return gatewayPayload ? normalizeMovieWatchPayload(gatewayPayload, true) : null;
    }

    const sql = getComicDb();
    if (!sql) {
      return null;
    }

    const schemaCapabilities = await getComicDbSchemaCapabilities(sql);
    const rows = await sql.unsafe<Array<VideoUnitRow & { canonical_unit_key?: string | null }>>(`
      with selected_item as (
        select
          i.item_key,
          exists (
            select 1
            from public.media_units candidate_units
            where candidate_units.item_key = i.item_key
              and candidate_units.unit_type in ('movie', 'episode')
          ) as has_units,
          ${buildMovieItemSlugExpression('i')} as item_slug,
          i.title as item_title,
          i.media_type,
          i.cover_url,
          i.detail as item_detail,
          f.payload as item_fanart_payload,
          e.payload as item_tmdb_payload
        from public.media_items i
        left join public.media_item_enrichments f
          on f.item_key = i.item_key
         and f.provider = 'fanart'
         and f.match_status = 'matched'
        left join public.media_item_enrichments e
          on e.item_key = i.item_key
         and e.provider = 'tmdb'
         and e.match_status = 'matched'
        where ${buildMovieScopeCondition('i')}
          and ${buildMovieItemSlugExpression('i')} = $1
        order by has_units desc, ${buildCanonicalItemOrdering('i', schemaCapabilities)}i.updated_at desc
        limit 1
      )
      select
        u.item_key,
        si.item_slug,
        si.item_title,
        si.media_type,
        si.cover_url,
        si.item_detail,
        si.item_fanart_payload,
        si.item_tmdb_payload,
        u.title,
        u.label,
        u.number,
        u.published_at,
        u.detail,
        ${buildCanonicalUnitKeyExpression('u', schemaCapabilities)} as canonical_unit_key
      from selected_item si
      join lateral (
        select
          u.item_key,
          u.unit_key,
          u.title,
          u.label,
          u.number,
          u.published_at,
          u.detail
        from public.media_units u
        where u.item_key = si.item_key
          and u.unit_type in ('movie', 'episode')
        order by ${buildCanonicalUnitOrdering('u', schemaCapabilities)}u.updated_at desc
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
    const mirrors = await resolveMovieMirrorEntries(
      canonicalPlayback.mirrors.length > 0 ? canonicalPlayback.mirrors : buildMirrorEntries(detail),
    );
    const defaultUrl = mirrors[0]?.embed_url || await resolveLk21MovieProviderUrl(readText(detail.stream_url));
    const downloadGroups = await resolveMovieDownloadGroups(
      canonicalPlayback.downloadGroups.length > 0
        ? canonicalPlayback.downloadGroups
        : buildDownloadGroups(detail),
    );

    return applyLk21ExternalFallback({
      slug: row.item_slug,
      title: row.item_title,
      poster: normalizePosterUrl(readText(itemDetail.poster_url) || readText(row.cover_url)),
      background: readMovieBackground(itemDetail),
      logo: readMovieLogo(itemDetail),
      backdrop: pickAssetUrl(itemDetail.backdrop_url, itemDetail.backdrop, itemDetail.poster_url, itemDetail.poster, row.cover_url) || normalizePosterUrl(row.cover_url),
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
      externalUrl: null,
      detailHref: `/movies/${row.item_slug}`,
      downloadGroups,
    });
  });
}
