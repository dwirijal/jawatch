import 'server-only';

import { buildGatewayUrl, gatewayFetchJson, unwrapGatewayData } from '@/lib/gateway';
import { resolveMovieVisuals } from '@/lib/enrichment';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from '@/lib/runtime-snapshot';
import type { MovieCardItem } from '@/lib/types';

type JSONRecord = Record<string, unknown>;

type MovieCastItem = {
  id: string | number;
  name: string;
  role?: string;
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

const HOME_REVALIDATE_SECONDS = 60 * 10;
const HUB_REVALIDATE_SECONDS = 60 * 10;
const DETAIL_REVALIDATE_SECONDS = 60 * 30;
const SEARCH_REVALIDATE_SECONDS = 60;

export type MovieSupabaseDetail = MovieDetailData;
export type MovieSupabaseWatch = MovieWatchData;

type MovieHomeSnapshot = {
  popular?: MovieCardItem[];
  latest?: MovieCardItem[];
  trending?: MovieCardItem[];
  items?: MovieCardItem[];
};

function readRecord(value: unknown): JSONRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JSONRecord) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object') {
          const record = entry as JSONRecord;
          return readText(record.name) || readText(record.title);
        }
        return '';
      })
    );
  }

  const text = readText(value);
  if (!text) {
    return [];
  }

  return uniqueStrings(
    text
      .split(',')
      .map((part) => part.trim())
  );
}

function buildMovieGatewayUrl(path: string): string {
  return buildGatewayUrl(path);
}

function formatRating(value: unknown): string {
  const numeric = readNumber(value);
  if (numeric == null || numeric <= 0) {
    return 'N/A';
  }
  return numeric.toFixed(1);
}

function formatDuration(value: unknown): string {
  const numeric = readNumber(value);
  if (numeric == null || numeric <= 0) {
    return 'N/A';
  }
  return `${Math.round(numeric)} min`;
}

function qualityLabelFromCode(value: unknown): string {
  const text = readText(value).toLowerCase();
  if (!text) {
    return 'STREAM';
  }
  switch (text) {
    case 'bluray':
    case 'b':
      return 'BLURAY';
    case 'web':
    case 'w':
      return 'WEB';
    case 'dvd':
    case 'd':
      return 'DVD';
    case '1080p':
    case '720p':
    case 'fullhd':
    case 'mp4hd':
    case 'h':
      return text === '720p' || text === 'mp4hd' ? '720P' : '1080P';
    case '480p':
    case 'm':
      return '480P';
    case '360p':
    case 'l':
      return '360P';
    default:
      return text.toUpperCase();
  }
}

function formatLabelFromCode(value: unknown): string {
  const text = readText(value).toLowerCase();
  switch (text) {
    case 'm':
      return 'MP4';
    case 'k':
      return 'MKV';
    case 'x':
      return 'x265';
    default:
      return 'LINK';
  }
}

function hostLabelFromCode(value: unknown): string {
  const text = readText(value).toLowerCase();
  switch (text) {
    case 'n':
      return 'Ngopi';
    case 'y':
      return 'YouTube';
    default:
      return 'Source';
  }
}

function normalizeMovieCard(item: unknown): MovieCardItem | null {
  const record = readRecord(item);
  const slug = readText(record.slug) || readText(record.provider_movie_slug);
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    poster: resolveMovieVisuals(record).poster,
    year: readText(record.year) || (readNumber(record.year) != null ? String(readNumber(record.year)) : '') || 'N/A',
    type: 'movie',
    rating: formatRating(record.rating ?? record.provider_rating),
    status: readText(record.status) || undefined,
    genres: splitList(record.genres).join(', '),
  };
}

function normalizeMovieList(payload: unknown): MovieCardItem[] {
  const data = unwrapGatewayData(payload);
  if (Array.isArray(data)) {
    return data.map(normalizeMovieCard).filter((item): item is MovieCardItem => item !== null);
  }

  if (data && typeof data === 'object') {
    const record = data as JSONRecord;
    const candidateList = record.items ?? record.latest ?? record.popular ?? record.results ?? record.data;
    if (Array.isArray(candidateList)) {
      return candidateList.map(normalizeMovieCard).filter((item): item is MovieCardItem => item !== null);
    }
  }

  return [];
}

function normalizeMovieCast(payload: unknown): MovieCastItem[] {
  const castItems: MovieCastItem[] = [];

  readArray(payload).forEach((item, index) => {
    const record = readRecord(item);
    const name = readText(record.name);
    if (!name) {
      return;
    }

    castItems.push({
      id: readNumber(record.id) ?? (readText(record.id) || index),
      name,
      role: readText(record.role) || undefined,
    });
  });

  return castItems;
}

function normalizeMovieMirrors(payload: unknown): MovieMirror[] {
  const record = readRecord(payload);
  const source = Array.isArray(record.mirrors) ? record.mirrors : [];
  const deduped = new Map<string, MovieMirror>();

  for (const item of source) {
    const mirror = readRecord(item);
    const embedUrl = readText(mirror.embed_url) || readText(mirror.url);
    if (!embedUrl) {
      continue;
    }
    deduped.set(embedUrl, {
      label: readText(mirror.label) || hostLabelFromCode(mirror.host_code),
      embed_url: embedUrl,
    });
  }

  const defaultUrl = readText(record.defaultUrl) || readText(record.default_url) || readText(record.default_embed);
  if (defaultUrl && !deduped.has(defaultUrl)) {
    deduped.set(defaultUrl, { label: 'Primary Source', embed_url: defaultUrl });
  }

  return [...deduped.values()];
}

function normalizeMovieDownloadGroups(payload: unknown): MovieDownloadGroup[] {
  const record = readRecord(payload);
  const source = Array.isArray(record.downloadGroups)
    ? record.downloadGroups
    : Array.isArray(record.download_groups)
      ? record.download_groups
      : [];

  if (source.length > 0) {
    return source
      .map((item) => {
        const group = readRecord(item);
        const format = readText(group.format);
        const quality = readText(group.quality);
        const links = readArray(group.links)
          .map((link) => {
            const itemLink = readRecord(link);
            const label = readText(itemLink.label);
            const href = readText(itemLink.href);
            return label && href ? { label, href } : null;
          })
          .filter((link): link is { label: string; href: string } => link !== null);
        return format && quality && links.length > 0 ? { format, quality, links } : null;
      })
      .filter((item): item is MovieDownloadGroup => item !== null);
  }

  const grouped = new Map<string, MovieDownloadLink[]>();
  const nested = readRecord(record.download_links_json ?? record.download_links ?? record.downloadLinks);

  for (const [format, qualityValue] of Object.entries(nested)) {
    const qualities = readRecord(qualityValue);
    for (const [quality, linksValue] of Object.entries(qualities)) {
      const linksRecord = readRecord(linksValue);
      const links = Object.entries(linksRecord)
        .map(([label, href]) => {
          const url = readText(href);
          return url ? { label: label.replace(/\s+/g, ' ').trim(), href: url } : null;
        })
        .filter((link): link is MovieDownloadLink => link !== null);

      if (links.length === 0) {
        continue;
      }

      grouped.set(`${format}::${quality}`, links);
    }
  }

  return [...grouped.entries()].map(([key, links]) => {
    const [format, quality] = key.split('::');
    return {
      format: formatLabelFromCode(format),
      quality: qualityLabelFromCode(quality),
      links,
    };
  });
}

function canInlinePlayback(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }
  return trimmed.includes('/embed/') || trimmed.includes('youtube.com/embed') || trimmed.includes('player');
}

function getMovieRoutePath(slug: string): string {
  return `/v1/film/${encodeURIComponent(slug)}`;
}

function getMovieWatchRoutePath(slug: string): string {
  return `/v1/film/watch/${encodeURIComponent(slug)}`;
}

export async function getMovieHomeItems(limit = 6): Promise<MovieCardItem[]> {
  const snapshot = await readSnapshotDomainFile<MovieHomeSnapshot>('movies', 'home.json');
  if (snapshot) {
    const snapshotItems = snapshot.trending || snapshot.popular || snapshot.latest || snapshot.items || [];
    if (snapshotItems.length > 0) {
      return snapshotItems.slice(0, Math.max(limit, 1));
    }
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/film/home?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:movie:items:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HOME_REVALIDATE_SECONDS,
  });
  return normalizeMovieList(payload).slice(0, Math.max(limit, 1));
}

export async function getMovieHomeSection(
  section: 'popular' | 'latest' | 'trending' = 'latest',
  limit = 24
): Promise<MovieCardItem[]> {
  const normalizedLimit = Math.max(limit, 1);
  const snapshot = await readSnapshotDomainFile<MovieHomeSnapshot>('movies', 'home.json');
  const snapshotItems = snapshot?.[section];
  if (snapshotItems && snapshotItems.length > 0) {
    return snapshotItems.slice(0, normalizedLimit);
  }

  const payload = await gatewayFetchJson<unknown>(`/v1/film/home?section=${section}&limit=${normalizedLimit}`, {
    edgeCacheKey: `home:movie:${section}:${normalizedLimit}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HOME_REVALIDATE_SECONDS,
  });
  return normalizeMovieList(payload).slice(0, normalizedLimit);
}

export async function getMovieHubData(limit = 24): Promise<{ popular: MovieCardItem[]; latest: MovieCardItem[] }> {
  const snapshot = await readSnapshotDomainFile<MovieHomeSnapshot>('movies', 'home.json');
  if (snapshot && ((snapshot.popular?.length ?? 0) > 0 || (snapshot.latest?.length ?? 0) > 0)) {
    return {
      popular: (snapshot.popular || snapshot.trending || []).slice(0, Math.max(limit, 1)),
      latest: (snapshot.latest || snapshot.items || snapshot.popular || []).slice(0, Math.max(limit, 1)),
    };
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/film/hub?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:movie:hub:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HUB_REVALIDATE_SECONDS,
  });
  const record = readRecord(unwrapGatewayData(payload));
  const latest = normalizeMovieList(record.latest ?? record.items ?? record.data ?? payload).slice(0, Math.max(limit, 1));
  const popular = normalizeMovieList(record.popular ?? record.trending ?? record.items ?? payload).slice(0, Math.max(limit, 1));
  return { popular, latest };
}

export async function getMovieGenreItems(genre: string, limit = 24): Promise<MovieCardItem[]> {
  const trimmed = genre.trim();
  if (!trimmed) {
    return [];
  }

  const payload = await gatewayFetchJson<unknown>(`/v1/film/genre/${encodeURIComponent(trimmed)}?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:movie:genre:${trimmed.toLowerCase()}:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HUB_REVALIDATE_SECONDS,
  });
  return normalizeMovieList(payload).slice(0, Math.max(limit, 1));
}

export async function searchMovieCatalog(query: string, limit = 8): Promise<MovieCardItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const snapshot = await searchSnapshotDomain<MovieCardItem>('movies', trimmed, limit);
  if (snapshot.length > 0) {
    return snapshot.slice(0, Math.min(Math.max(limit, 1), 12));
  }

  const payload = await gatewayFetchJson<unknown>(`/v1/film/search?q=${encodeURIComponent(trimmed)}&limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `search:movie:catalog:${trimmed.toLowerCase()}:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 300,
    revalidate: SEARCH_REVALIDATE_SECONDS,
  });
  return normalizeMovieList(payload).slice(0, Math.min(Math.max(limit, 1), 12));
}

function normalizeMovieDetail(payload: unknown, slugFallback = ''): MovieDetailData | null {
  const record = readRecord(unwrapGatewayData(payload));
  const slug = readText(record.slug) || slugFallback;
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  const recommendations = normalizeMovieList(record.recommendations ?? record.related ?? record.similar_movies ?? []);
  const visuals = resolveMovieVisuals(record);

  return {
    slug,
    title,
    poster: visuals.poster,
    backdrop: visuals.backdrop,
    year: readText(record.year) || (readNumber(record.year) != null ? String(readNumber(record.year)) : '') || 'N/A',
    rating: formatRating(record.rating ?? record.provider_rating),
    genres: splitList(record.genres ?? record.genre_names),
    quality: readText(record.quality) || qualityLabelFromCode(record.quality_code),
    duration: readText(record.duration) || formatDuration(record.runtime_minutes),
    synopsis: readText(record.synopsis) || readText(record.overview) || 'No synopsis available for this movie.',
    cast: normalizeMovieCast(record.cast ?? record.cast_json),
    director: uniqueStrings(splitList(record.director ?? record.director_names)).join(', '),
    trailerUrl: readText(record.trailerUrl) || readText(record.trailer_url) || null,
    externalUrl: readText(record.externalUrl) || buildMovieGatewayUrl(getMovieRoutePath(slug)),
    recommendations,
  };
}

export async function getMovieDetailBySlug(slug: string): Promise<MovieDetailData | null> {
  const snapshot = await readSnapshotTitle<MovieDetailData>('movies', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await gatewayFetchJson<unknown>(getMovieRoutePath(slug), {
    edgeCacheKey: `detail:movie:${slug}`,
    edgeCacheTtlSeconds: 1800,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeMovieDetail(payload, slug);
}

function normalizeMovieWatch(payload: unknown, slugFallback = ''): MovieWatchData | null {
  const record = readRecord(unwrapGatewayData(payload));
  const slug = readText(record.slug) || slugFallback;
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  const mirrors = normalizeMovieMirrors(record);
  const defaultUrl = readText(record.defaultUrl) || readText(record.default_url) || mirrors[0]?.embed_url || '';
  const visuals = resolveMovieVisuals(record);

  return {
    slug,
    title,
    poster: visuals.poster,
    backdrop: visuals.backdrop,
    year: readText(record.year) || (readNumber(record.year) != null ? String(readNumber(record.year)) : '') || 'N/A',
    rating: formatRating(record.rating ?? record.provider_rating),
    quality: readText(record.quality) || qualityLabelFromCode(record.quality_code),
    duration: readText(record.duration) || formatDuration(record.runtime_minutes),
    synopsis: readText(record.synopsis) || readText(record.overview) || 'No synopsis available for this movie.',
    mirrors,
    defaultUrl,
    canInlinePlayback: canInlinePlayback(defaultUrl),
    externalUrl: readText(record.externalUrl) || defaultUrl || buildMovieGatewayUrl(getMovieWatchRoutePath(slug)),
    detailHref: readText(record.detailHref) || `/movies/${slug}`,
    downloadGroups: normalizeMovieDownloadGroups(record),
  };
}

export async function getMovieWatchBySlug(slug: string): Promise<MovieWatchData | null> {
  const snapshot = await readSnapshotPlayback<MovieWatchData>('movies', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await gatewayFetchJson<unknown>(getMovieWatchRoutePath(slug), {
    edgeCacheKey: `playback:movie:${slug}`,
    edgeCacheTtlSeconds: 300,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeMovieWatch(payload, slug);
}
