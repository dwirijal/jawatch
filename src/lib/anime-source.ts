import 'server-only';

import type { JikanEnrichment, KanataAnime } from '@/lib/api';
import { buildGatewayUrl, gatewayFetchJson, unwrapGatewayData } from '@/lib/gateway';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from '@/lib/runtime-snapshot';

type JSONRecord = Record<string, unknown>;

type AnimeCastItem = {
  id: string | number;
  name: string;
  role?: string;
  image?: string;
  secondary?: string;
  secondaryLabel?: string;
};

type AnimeEpisodeListItem = {
  episode_slug: string;
  title: string;
  episode_number: number;
  release_label: string;
};

export type AnimeEpisodeServerOption = {
  label: string;
  postId: string;
  number: string;
  type: string;
};

export type AnimeEpisodeDownloadGroup = {
  format: string;
  quality: string;
  links: Array<{ label: string; href: string }>;
};

export type AnimeDetailData = {
  slug: string;
  title: string;
  alternativeTitle: string;
  status: string;
  type: string;
  synopsis: string;
  poster: string;
  genres: string[];
  studio: string;
  rating: string;
  totalEpisodes: string;
  cast: AnimeCastItem[];
  episodes: AnimeEpisodeListItem[];
  externalUrl: string;
  trailerUrl: string | null;
  enrichment: JikanEnrichment | null;
};

export type AnimeEpisodeData = {
  episodeSlug: string;
  animeSlug: string;
  animeTitle: string;
  title: string;
  episodeNumber: string;
  releaseLabel: string;
  synopsis: string;
  genres: string[];
  poster: string;
  animeDetailHref: string;
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  serverOptions: AnimeEpisodeServerOption[];
  downloadGroups: AnimeEpisodeDownloadGroup[];
  playlist: AnimeEpisodeListItem[];
  prevEpisodeSlug: string | null;
  nextEpisodeSlug: string | null;
  externalUrl: string;
  animeExternalUrl: string;
  fetchStatus: string;
};

export type AnimeCatalogCard = KanataAnime & {
  synopsis_excerpt?: string;
  genres?: string[];
  score?: number;
};

// Backward-compatible aliases; prefer AnimeDetailData/AnimeEpisodeData in new code.
export type AnimeSupabaseDetail = AnimeDetailData;
export type AnimeSupabaseEpisode = AnimeEpisodeData;

export type AnimeIndexGroup = {
  letter: string;
  list: AnimeCatalogCard[];
};

type AnimeHomeSnapshot = {
  ongoing?: AnimeCatalogCard[];
  popular?: AnimeCatalogCard[];
  trending?: AnimeCatalogCard[];
  latest?: AnimeCatalogCard[];
  items?: AnimeCatalogCard[];
};

const HOME_REVALIDATE_SECONDS = 60 * 10;
const HUB_REVALIDATE_SECONDS = 60 * 10;
const DETAIL_REVALIDATE_SECONDS = 60 * 30;
const SEARCH_REVALIDATE_SECONDS = 60;

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

function readImageUrl(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  const record = readRecord(value);
  return readText(record.image_url) || readText(record.original) || readText(record.url);
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

function buildAnimeGatewayUrl(path: string): string {
  return buildGatewayUrl(path);
}

function buildAnimePosterUrl(value: unknown): string {
  const poster = readText(value);
  return poster || '/favicon.ico';
}

function buildAnimeTypeLabel(value: unknown): string {
  const text = readText(value).toLowerCase();
  if (!text) {
    return 'Anime';
  }

  switch (text) {
    case 'tv':
    case 'movie':
    case 'ova':
    case 'ona':
    case 'special':
      return text.toUpperCase();
    default:
      return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

function buildAnimeStatusLabel(value: unknown): string {
  const text = readText(value).toLowerCase();
  if (!text) {
    return 'Unknown';
  }

  switch (text) {
    case 'ongoing':
    case 'airing':
    case 'currently airing':
      return 'Ongoing';
    case 'completed':
    case 'finished':
    case 'finished airing':
      return 'Completed';
    case 'upcoming':
      return 'Upcoming';
    default:
      return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

function buildEpisodeCountLabel(payload: JSONRecord): string {
  const candidates = [
    payload.totalEpisodes,
    payload.total_episodes,
    payload.episodeCount,
    payload.episode_count,
    payload.episodes,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      return String(candidate);
    }
    const text = readText(candidate);
    if (text) {
      return text;
    }
  }

  return 'Unknown';
}

function normalizeAnimeCard(item: unknown): AnimeCatalogCard | null {
  const record = readRecord(item);
  const slug = readText(record.slug);
  const title = readText(record.title) || readText(record.name) || slug;
  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    thumb: buildAnimePosterUrl(record.thumb ?? record.poster ?? record.image ?? record.poster_url),
    episode: readText(record.episode) || buildAnimeStatusLabel(record.status ?? record.status_label) || 'Unknown',
    type: buildAnimeTypeLabel(record.type ?? record.anime_type),
    status: buildAnimeStatusLabel(record.status ?? record.status_label),
    synopsis_excerpt: readText(record.synopsis_excerpt) || readText(record.synopsis) || '',
    genres: splitList(record.genres ?? record.genre_names),
    score: readNumber(record.score) ?? undefined,
  };
}

function normalizeAnimeCardList(payload: unknown): AnimeCatalogCard[] {
  const data = unwrapGatewayData(payload);
  if (Array.isArray(data)) {
    return data.map(normalizeAnimeCard).filter((item): item is AnimeCatalogCard => item !== null);
  }

  if (data && typeof data === 'object') {
    const record = data as JSONRecord;
    const candidateList = record.items ?? record.ongoing ?? record.list ?? record.results;
    if (Array.isArray(candidateList)) {
      return candidateList.map(normalizeAnimeCard).filter((item): item is AnimeCatalogCard => item !== null);
    }
  }

  return [];
}

function normalizeAnimeIndexGroups(payload: unknown): AnimeIndexGroup[] {
  const data = unwrapGatewayData(payload);
  if (Array.isArray(data) && data.length > 0 && data.every((item) => readRecord(item).letter)) {
    return data
      .map((group) => {
        const record = readRecord(group);
        const list = normalizeAnimeCardList(record.list ?? record.items ?? []);
        const letter = readText(record.letter) || '#';
        return { letter, list };
      })
      .filter((group) => group.list.length > 0);
  }

  const cards = normalizeAnimeCardList(data);
  const groups = new Map<string, AnimeCatalogCard[]>();
  for (const card of cards) {
    const letter = card.title.trim().charAt(0).toUpperCase();
    const key = /^[A-Z]$/.test(letter) ? letter : '#';
    const current = groups.get(key) ?? [];
    current.push(card);
    groups.set(key, current);
  }

  return ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]
    .map((letter) => ({
      letter,
      list: groups.get(letter) ?? [],
    }))
    .filter((group) => group.list.length > 0);
}

function normalizeAnimeCast(payload: unknown): AnimeCastItem[] {
  const castItems: AnimeCastItem[] = [];

  readArray(payload).forEach((item, index) => {
    const record = readRecord(item);
    const nested = readRecord(record.character);
    const voiceActors = readArray(record.voice_actors);
    const firstVoiceActor = readRecord(voiceActors[0]);
    const person = readRecord(firstVoiceActor.person);

    const name = readText(record.name) || readText(record.character_name) || readText(nested.name);
    if (!name) {
      return;
    }

    castItems.push({
      id:
        readNumber(record.id) ??
        readNumber(record.character_mal_id) ??
        readNumber(nested.mal_id) ??
        index,
      name,
      role: readText(record.role) || undefined,
      image:
        readText(record.image) ||
        readText(record.character_image_url) ||
        readImageUrl(readRecord(nested.images).webp) ||
        readImageUrl(readRecord(nested.images).jpg) ||
        undefined,
      secondary:
        readText(firstVoiceActor.name) ||
        readText(person.name) ||
        undefined,
      secondaryLabel: readText(firstVoiceActor.language)
        ? `${readText(firstVoiceActor.language)} Voice`
        : undefined,
    });
  });

  return castItems;
}

function normalizeAnimeEpisodes(payload: unknown): AnimeEpisodeListItem[] {
  return readArray(payload)
    .map((item) => {
      const record = readRecord(item);
      const slug = readText(record.episode_slug) || readText(record.slug);
      const title = readText(record.title) || slug;
      if (!slug || !title) {
        return null;
      }

      const episodeNumber = readNumber(record.episode_number);
      return {
        episode_slug: slug,
        title,
        episode_number: episodeNumber ?? 0,
        release_label: readText(record.release_label) || readText(record.release_at) || '',
      } satisfies AnimeEpisodeListItem;
    })
    .filter((item): item is AnimeEpisodeListItem => item !== null)
    .sort((left, right) => left.episode_number - right.episode_number);
}

function normalizeMirrors(payload: unknown): { defaultUrl: string; mirrors: Array<{ label: string; embed_url: string }> } {
  const record = readRecord(payload);
  const mirrorsSource = Array.isArray(record.mirrors) ? record.mirrors : [];
  const mirrors: Array<{ label: string; embed_url: string }> = [];
  const seen = new Set<string>();

  const primary = readText(record.defaultUrl) || readText(record.default_url) || readText(record.default_embed) || readText(record.primary);
  if (primary) {
    mirrors.push({ label: 'Primary Source', embed_url: primary });
    seen.add(primary);
  }

  for (const item of mirrorsSource) {
    const mirror = readRecord(item);
    const embedUrl = readText(mirror.embed_url) || readText(mirror.url) || readText(mirror.href);
    if (!embedUrl || seen.has(embedUrl)) {
      continue;
    }
    seen.add(embedUrl);
    mirrors.push({
      label: readText(mirror.label) || 'Mirror',
      embed_url: embedUrl,
    });
  }

  return {
    defaultUrl: primary || mirrors[0]?.embed_url || '',
    mirrors,
  };
}

function normalizeServerOptions(payload: unknown): AnimeEpisodeServerOption[] {
  const record = readRecord(payload);
  const source = Array.isArray(record.server_options) ? record.server_options : [];

  return source
    .map((item) => {
      const option = readRecord(item);
      const label = readText(option.label);
      if (!label) {
        return null;
      }
      return {
        label,
        postId: readText(option.postId) || readText(option.post_id),
        number: readText(option.number),
        type: readText(option.type),
      } satisfies AnimeEpisodeServerOption;
    })
    .filter((item): item is AnimeEpisodeServerOption => item !== null);
}

function normalizeDownloadGroups(payload: unknown): AnimeEpisodeDownloadGroup[] {
  const record = readRecord(payload);
  const source = Array.isArray(record.download_groups) ? record.download_groups : [];

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
      .filter((item): item is AnimeEpisodeDownloadGroup => item !== null);
  }

  const grouped: AnimeEpisodeDownloadGroup[] = [];
  const nested = readRecord(record.download_links_json ?? record.download_links ?? record.downloadLinks);

  for (const [format, qualityValue] of Object.entries(nested)) {
    const qualities = readRecord(qualityValue);
    for (const [quality, linksValue] of Object.entries(qualities)) {
      const linksRecord = readRecord(linksValue);
      const links = Object.entries(linksRecord)
        .map(([label, href]) => {
          const url = readText(href);
          return url ? { label, href: url } : null;
        })
        .filter((link): link is { label: string; href: string } => link !== null);

      if (links.length > 0) {
        grouped.push({
          format: readText(format),
          quality: readText(quality),
          links,
        });
      }
    }
  }

  return grouped;
}

function normalizeJikanEnrichment(payload: unknown): JikanEnrichment | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const record = payload as JSONRecord;
  const extractNames = (value: unknown): string[] =>
    readArray(value)
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }
        return readText(readRecord(entry).name);
      })
      .filter(Boolean);

  const malId = readNumber(record.malId) ?? readNumber(record.mal_id);
  const title = readText(record.title);

  if (!malId || !title) {
    return null;
  }

  return {
    malId,
    score: readNumber(record.score) ?? 0,
    rank: readNumber(record.rank) ?? 0,
    popularity: readNumber(record.popularity) ?? 0,
    synopsis: readText(record.synopsis),
    trailer_url: readText(record.trailer_url) || readText(readRecord(record.trailer).url),
    status: readText(record.status),
    source: readText(record.source),
    rating: readText(record.rating),
    year: readNumber(record.year),
    season: readText(record.season),
    genres: extractNames(record.genres),
    themes: extractNames(record.themes),
    studios: extractNames(record.studios),
    title,
    url: readText(record.url),
    mediaType: 'anime',
    chapters: readNumber(record.chapters),
    episodes: readNumber(record.episodes),
  };
}

function formatEpisodeNumber(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
  const text = readText(value);
  return text || '?';
}

function buildPath(path: string): string {
  return buildAnimeGatewayUrl(path);
}

function buildAnimeSearchPath(query: string, limit: number): string {
  return `/v1/anime/search?q=${encodeURIComponent(query)}&limit=${limit}`;
}

export async function getAnimeHomeItems(limit = 6): Promise<AnimeCatalogCard[]> {
  const snapshot = await readSnapshotDomainFile<AnimeHomeSnapshot>('anime', 'home.json');
  if (snapshot) {
    const snapshotItems =
      snapshot.popular ||
      snapshot.trending ||
      snapshot.ongoing ||
      snapshot.latest ||
      snapshot.items ||
      [];
    if (snapshotItems.length > 0) {
      return snapshotItems.slice(0, Math.max(limit, 1));
    }
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/anime/home?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:anime:items:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HOME_REVALIDATE_SECONDS,
  });
  return normalizeAnimeCardList(payload).slice(0, Math.max(limit, 1));
}

export async function getAnimeHubData(limit = 36): Promise<{ ongoing: AnimeCatalogCard[] }> {
  const snapshot = await readSnapshotDomainFile<AnimeHomeSnapshot>('anime', 'home.json');
  if (snapshot?.ongoing?.length) {
    return {
      ongoing: snapshot.ongoing.slice(0, Math.max(limit, 1)),
    };
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/anime/hub?limit=${Math.max(limit, 1)}`, {
    edgeCacheKey: `home:anime:hub:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 900,
    revalidate: HUB_REVALIDATE_SECONDS,
  });
  const cards = normalizeAnimeCardList(payload);
  return { ongoing: cards.slice(0, Math.max(limit, 1)) };
}

export async function getAnimeIndexData(): Promise<AnimeIndexGroup[]> {
  const payload = await gatewayFetchJson<unknown>('/v1/anime/index', {
    edgeCacheKey: 'home:anime:index',
    edgeCacheTtlSeconds: 1800,
    revalidate: HUB_REVALIDATE_SECONDS,
  });
  return normalizeAnimeIndexGroups(payload);
}

export async function searchAnimeCatalog(query: string, limit = 8): Promise<AnimeCatalogCard[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const snapshot = await searchSnapshotDomain<AnimeCatalogCard>('anime', trimmed, limit);
  if (snapshot.length > 0) {
    return snapshot.slice(0, Math.min(Math.max(limit, 1), 12));
  }

  const payload = await gatewayFetchJson<unknown>(buildAnimeSearchPath(trimmed, Math.max(limit, 1)), {
    edgeCacheKey: `search:anime:catalog:${trimmed.toLowerCase()}:${Math.max(limit, 1)}`,
    edgeCacheTtlSeconds: 300,
    revalidate: SEARCH_REVALIDATE_SECONDS,
  });
  return normalizeAnimeCardList(payload).slice(0, Math.min(Math.max(limit, 1), 12));
}

function normalizeAnimeDetail(payload: unknown, slugFallback = ''): AnimeDetailData | null {
  const record = readRecord(unwrapGatewayData(payload));
  const slug = readText(record.slug) || slugFallback;
  const title = readText(record.title) || slug;

  if (!slug || !title) {
    return null;
  }

  const episodes = normalizeAnimeEpisodes(record.episodes ?? record.playlist ?? record.chapter_list);
  const cast = normalizeAnimeCast(record.cast ?? record.cast_json);
  const enrichment = normalizeJikanEnrichment(record.enrichment);
  const status = buildAnimeStatusLabel(record.status ?? record.status_label);
  const type = buildAnimeTypeLabel(record.type ?? record.anime_type);
  const poster = buildAnimePosterUrl(record.poster ?? record.thumb ?? record.image ?? record.poster_url);
  const ratingValue = readText(record.rating) || (readNumber(record.score) != null ? String(readNumber(record.score)) : '');
  const totalEpisodes = buildEpisodeCountLabel(record);
  const genres = splitList(record.genres ?? record.genre_names);
  const studio = splitList(record.studio ?? record.studios).join(', ');

  return {
    slug,
    title,
    alternativeTitle:
      readText(record.alternativeTitle) ||
      readText(record.alternative_title) ||
      readText(record.alt_title) ||
      '',
    status,
    type,
    synopsis: readText(record.synopsis) || readText(record.synopsis_excerpt) || 'No synopsis available for this anime.',
    poster,
    genres,
    studio,
    rating: ratingValue || 'N/A',
    totalEpisodes,
    cast,
    episodes,
    externalUrl: readText(record.externalUrl) || buildPath(`/v1/anime/${slug}`),
    trailerUrl: readText(record.trailerUrl) || readText(record.trailer_url) || null,
    enrichment,
  };
}

export async function getAnimeDetailBySlug(slug: string): Promise<AnimeDetailData | null> {
  const snapshot = await readSnapshotTitle<AnimeDetailData>('anime', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/anime/${encodeURIComponent(slug)}`, {
    edgeCacheKey: `detail:anime:${slug}`,
    edgeCacheTtlSeconds: 1800,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeAnimeDetail(payload, slug);
}

function normalizeEpisodeDetail(payload: unknown, slugFallback = ''): AnimeEpisodeData | null {
  const record = readRecord(unwrapGatewayData(payload));
  const episodeSlug = readText(record.episodeSlug) || readText(record.episode_slug) || slugFallback;
  const animeSlug = readText(record.animeSlug) || readText(record.anime_slug);
  const title = readText(record.title) || episodeSlug;

  if (!episodeSlug || !animeSlug || !title) {
    return null;
  }

  const playlist = normalizeAnimeEpisodes(record.playlist ?? record.episodes ?? []);
  const mirrorState = normalizeMirrors(record);
  const genres = splitList(record.genres ?? record.genre_names);

  return {
    episodeSlug,
    animeSlug,
    animeTitle: readText(record.animeTitle) || readText(record.anime_title) || 'Anime',
    title,
    episodeNumber: formatEpisodeNumber(record.episodeNumber ?? record.episode_number),
    releaseLabel: readText(record.releaseLabel) || readText(record.release_label) || '',
    synopsis: readText(record.synopsis) || 'Episode synopsis is not available yet.',
    genres,
    poster: buildAnimePosterUrl(record.poster ?? record.thumb ?? record.image ?? record.poster_url),
    animeDetailHref: readText(record.animeDetailHref) || readText(record.anime_detail_href) || `/anime/${animeSlug}`,
    mirrors: mirrorState.mirrors,
    defaultUrl: mirrorState.defaultUrl,
    serverOptions: normalizeServerOptions(record),
    downloadGroups: normalizeDownloadGroups(record),
    playlist,
    prevEpisodeSlug: readText(record.prevEpisodeSlug) || readText(record.prev_episode_slug) || null,
    nextEpisodeSlug: readText(record.nextEpisodeSlug) || readText(record.next_episode_slug) || null,
    externalUrl: readText(record.externalUrl) || buildPath(`/v1/anime/episodes/${episodeSlug}`),
    animeExternalUrl: readText(record.animeExternalUrl) || buildPath(`/v1/anime/${animeSlug}`),
    fetchStatus: readText(record.fetchStatus) || readText(record.fetch_status) || 'Unknown',
  };
}

export async function getAnimeEpisodeBySlug(slug: string): Promise<AnimeEpisodeData | null> {
  const snapshot = await readSnapshotPlayback<AnimeEpisodeData>('anime', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await gatewayFetchJson<unknown>(`/v1/anime/episodes/${encodeURIComponent(slug)}`, {
    edgeCacheKey: `playback:anime:${slug}`,
    edgeCacheTtlSeconds: 300,
    revalidate: DETAIL_REVALIDATE_SECONDS,
  });
  return normalizeEpisodeDetail(payload, slug);
}
