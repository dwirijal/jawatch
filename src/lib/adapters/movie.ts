import 'server-only';

import { withCloudflareEdgeCache } from '@/lib/cloudflare-cache';
import { enrichMovieVisuals } from '@/lib/enrichment';
import { buildKanataMovieUrl } from '@/lib/media';
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
const KANATA_TYPE = 'movie';

export type MovieSupabaseDetail = MovieDetailData;
export type MovieSupabaseWatch = MovieWatchData;

async function fetchKanataMovieJson<T>(
  path: string,
  options: {
    revalidate?: number;
    timeoutMs?: number;
    edgeCacheKey?: string;
    edgeCacheTtlSeconds?: number;
  } = {}
): Promise<T> {
  const loader = async () => {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(buildKanataMovieUrl(path), {
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
        next: {
          revalidate: options.revalidate ?? 3600,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Kanata movie ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Kanata movie timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (options.edgeCacheKey && options.edgeCacheTtlSeconds) {
    return withCloudflareEdgeCache(options.edgeCacheKey, options.edgeCacheTtlSeconds, loader);
  }

  return loader();
}

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

function unwrapMoviePayload<T>(payload: T | { data?: T; result?: T } | null | undefined): T | null {
  if (payload == null) {
    return null;
  }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as { data?: T; result?: T };
    if (record.data !== undefined) {
      return record.data ?? null;
    }
    if (record.result !== undefined) {
      return record.result ?? null;
    }
  }
  return payload as T;
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

async function normalizeMovieCard(item: unknown): Promise<MovieCardItem | null> {
  const record = readRecord(item);
  const slug = readText(record.slug) || readText(record.provider_movie_slug);
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  const visuals = await enrichMovieVisuals(record, {
    title,
    year: record.year,
  });

  return {
    slug,
    title,
    poster: visuals.poster,
    year: readText(record.year) || (readNumber(record.year) != null ? String(readNumber(record.year)) : '') || 'N/A',
    type: 'movie',
    rating: formatRating(record.rating ?? record.provider_rating),
    status: readText(record.status) || undefined,
    genres: splitList(record.genres).join(', '),
  };
}

async function normalizeMovieList(payload: unknown): Promise<MovieCardItem[]> {
  const data = unwrapMoviePayload(payload);
  if (Array.isArray(data)) {
    const items = await Promise.all(data.map(normalizeMovieCard));
    return items.filter((item): item is MovieCardItem => item !== null);
  }

  if (data && typeof data === 'object') {
    const record = data as JSONRecord;
    const candidateList = record.items ?? record.latest ?? record.popular ?? record.results ?? record.data;
    if (Array.isArray(candidateList)) {
      const items = await Promise.all(candidateList.map(normalizeMovieCard));
      return items.filter((item): item is MovieCardItem => item !== null);
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
  return `/detail/${encodeURIComponent(slug)}?type=${KANATA_TYPE}`;
}

function getMovieWatchRoutePath(slug: string): string {
  return `/stream?id=${encodeURIComponent(slug)}&type=${KANATA_TYPE}`;
}

export async function getMovieHomeItems(limit = 6): Promise<MovieCardItem[]> {
  const payload = await fetchKanataMovieJson<unknown>(`/home?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:movie:items:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HOME_REVALIDATE_SECONDS,
  });
  const items = await normalizeMovieList(payload);
  return items.slice(0, Math.max(limit, 1));
}

export async function getMovieHomeSection(
  section: 'popular' | 'latest' | 'trending' = 'latest',
  limit = 24
): Promise<MovieCardItem[]> {
  const normalizedLimit = Math.max(limit, 1);
  const payload = await fetchKanataMovieJson<unknown>(`/home?section=${section}&limit=${normalizedLimit}`, {
    edgeCacheKey: `home:movie:${section}:${normalizedLimit}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HOME_REVALIDATE_SECONDS,
  });
  const items = await normalizeMovieList(payload);
  return items.slice(0, normalizedLimit);
}

export async function getMovieHubData(limit = 24): Promise<{ popular: MovieCardItem[]; latest: MovieCardItem[] }> {
  const normalizedLimit = Math.max(limit, 1);
  const [popular, latest] = await Promise.all([
    getMovieHomeSection('popular', normalizedLimit),
    getMovieHomeSection('latest', normalizedLimit),
  ]);
  return { popular, latest };
}

export async function getMovieGenreItems(genre: string, limit = 24): Promise<MovieCardItem[]> {
  const trimmed = genre.trim();
  if (!trimmed) {
    return [];
  }

  const payload = await fetchKanataMovieJson<unknown>(`/genre/${encodeURIComponent(trimmed)}?page=1&limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:movie:genre:${trimmed.toLowerCase()}:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HUB_REVALIDATE_SECONDS,
  });
  const items = await normalizeMovieList(payload);
  return items.slice(0, Math.max(limit, 1));
}

export async function searchMovieCatalog(query: string, limit = 8): Promise<MovieCardItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const payload = await fetchKanataMovieJson<unknown>(`/search?q=${encodeURIComponent(trimmed)}&page=1&limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `search:movie:catalog:${trimmed.toLowerCase()}:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 300,
    revalidate: SEARCH_REVALIDATE_SECONDS,
  });
  const items = await normalizeMovieList(payload);
  return items.slice(0, Math.min(Math.max(limit, 1), 12));
}

async function normalizeMovieDetail(payload: unknown, slugFallback = ''): Promise<MovieDetailData | null> {
  const record = readRecord(unwrapMoviePayload(payload));
  const slug = readText(record.slug) || slugFallback;
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  const [recommendations, visuals] = await Promise.all([
    normalizeMovieList(record.recommendations ?? record.related ?? record.similar_movies ?? []),
    enrichMovieVisuals(record, {
      title,
      year: record.year,
    }),
  ]);

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
    externalUrl: readText(record.externalUrl) || buildKanataMovieUrl(getMovieRoutePath(slug)),
    recommendations,
  };
}

export async function getMovieDetailBySlug(slug: string): Promise<MovieDetailData | null> {
  const payload = await fetchKanataMovieJson<unknown>(getMovieRoutePath(slug), {
    edgeCacheKey: `detail:movie:${slug}`,
    edgeCacheTtlSeconds: 1800,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeMovieDetail(payload, slug);
}

async function normalizeMovieWatch(payload: unknown, slugFallback = ''): Promise<MovieWatchData | null> {
  const record = readRecord(unwrapMoviePayload(payload));
  const slug = readText(record.slug) || slugFallback;
  const title = readText(record.title) || readText(record.provider_title) || slug;
  if (!slug || !title) {
    return null;
  }

  const mirrors = normalizeMovieMirrors(record);
  const defaultUrl = readText(record.defaultUrl) || readText(record.default_url) || mirrors[0]?.embed_url || '';
  const visuals = await enrichMovieVisuals(record, {
    title,
    year: record.year,
  });

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
    externalUrl: readText(record.externalUrl) || defaultUrl || buildKanataMovieUrl(getMovieWatchRoutePath(slug)),
    detailHref: readText(record.detailHref) || `/movies/${slug}`,
    downloadGroups: normalizeMovieDownloadGroups(record),
  };
}

export async function getMovieWatchBySlug(slug: string): Promise<MovieWatchData | null> {
  const payload = await fetchKanataMovieJson<unknown>(getMovieWatchRoutePath(slug), {
    edgeCacheKey: `playback:movie:${slug}`,
    edgeCacheTtlSeconds: 300,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeMovieWatch(payload, slug);
}
