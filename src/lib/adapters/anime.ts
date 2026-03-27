import { buildSankaUrl, fetchSankaJson } from '@/lib/media';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from '@/lib/runtime-snapshot';
import type {
  AnimePaginationResult,
  AnimeSchedule,
  JikanEnrichment,
  KanataAnime,
  KanataAnimeBatch,
  KanataCompletedAnime,
  KanataGenre,
} from '@/lib/types';

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

function readRecord(value: unknown): JSONRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JSONRecord) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unwrapAnimePayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const record = value as JSONRecord;
  return record.data ?? value;
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

function buildAnimeSlug(value: unknown): string {
  const record = readRecord(value);
  return (
    readText(value) ||
    readText(record.slug) ||
    readText(record.animeId) ||
    readText(record.episode_slug) ||
    readText(record.episodeId)
  );
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
  const slug = buildAnimeSlug(record);
  const title = readText(record.title) || readText(record.name) || slug;
  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    thumb: buildAnimePosterUrl(record.thumb ?? record.poster ?? record.image ?? record.poster_url),
    episode:
      readText(record.episode) ||
      readText(record.episodes) ||
      readText(record.releasedOn) ||
      buildAnimeStatusLabel(record.status ?? record.status_label) ||
      'Unknown',
    type: buildAnimeTypeLabel(record.type ?? record.anime_type),
    status: buildAnimeStatusLabel(record.status ?? record.status_label),
    synopsis_excerpt: readText(record.synopsis_excerpt) || readText(record.synopsis) || '',
    genres: splitList(record.genres ?? record.genre_names),
    score: readNumber(record.score) ?? undefined,
  };
}

function normalizeAnimeCardList(payload: unknown): AnimeCatalogCard[] {
  const data = unwrapAnimePayload(payload);
  if (Array.isArray(data)) {
    return data.map(normalizeAnimeCard).filter((item): item is AnimeCatalogCard => item !== null);
  }

  if (data && typeof data === 'object') {
    const record = data as JSONRecord;
    const homeSections = ['recent', 'batch', 'movie', 'top10']
      .flatMap((key) => readArray(readRecord(record[key]).animeList));
    const candidateList =
      record.items ??
      record.ongoing ??
      record.list ??
      record.results ??
      record.animeList ??
      (homeSections.length > 0 ? homeSections : undefined);
    if (Array.isArray(candidateList)) {
      return candidateList.map(normalizeAnimeCard).filter((item): item is AnimeCatalogCard => item !== null);
    }
  }

  return [];
}

function normalizeAnimeIndexGroups(payload: unknown): AnimeIndexGroup[] {
  const data = unwrapAnimePayload(payload);
  if (data && typeof data === 'object') {
    const record = data as JSONRecord;
    const groups = readArray(record.list);
    if (groups.length > 0) {
      return groups
        .map((group) => {
          const groupRecord = readRecord(group);
          return {
            letter: readText(groupRecord.startWith) || '#',
            list: normalizeAnimeCardList(groupRecord.animeList),
          };
        })
        .filter((group) => group.list.length > 0);
    }
  }

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
      const slug = readText(record.episode_slug) || readText(record.episodeId) || readText(record.slug);
      const title = readText(record.title) || slug;
      if (!slug || !title) {
        return null;
      }

      const episodeNumber = readNumber(record.episode_number);
      const fallbackEpisodeNumber = Number.parseFloat(slug.match(/episode-(\d+(?:\.\d+)?)/i)?.[1] || '');
      return {
        episode_slug: slug,
        title,
        episode_number:
          episodeNumber ??
          (Number.isFinite(fallbackEpisodeNumber) ? fallbackEpisodeNumber : 0),
        release_label:
          readText(record.release_label) ||
          readText(record.release_at) ||
          readText(record.releasedOn) ||
          '',
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

  const serverQualities = readArray(readRecord(record.server).qualities);
  for (const quality of serverQualities) {
    const qualityRecord = readRecord(quality);
    const qualityTitle = readText(qualityRecord.title);
    const serverList = readArray(qualityRecord.serverList);

    for (const server of serverList) {
      const serverRecord = readRecord(server);
      const href = readText(serverRecord.href);
      if (!href) {
        continue;
      }

      const embedUrl = buildSankaUrl(href);
      if (seen.has(embedUrl)) {
        continue;
      }

      seen.add(embedUrl);
      mirrors.push({
        label: readText(serverRecord.title) || qualityTitle || 'Mirror',
        embed_url: embedUrl,
      });
    }
  }

  return {
    defaultUrl: primary || readText(record.defaultStreamingUrl) || mirrors[0]?.embed_url || '',
    mirrors,
  };
}

function normalizeServerOptions(payload: unknown): AnimeEpisodeServerOption[] {
  const record = readRecord(payload);
  const source = Array.isArray(record.server_options) ? record.server_options : [];

  if (source.length === 0) {
    return readArray(readRecord(record.server).qualities)
      .flatMap((quality) => {
        const qualityRecord = readRecord(quality);
        const qualityTitle = readText(qualityRecord.title);
        return readArray(qualityRecord.serverList)
          .map((item) => {
            const option = readRecord(item);
            const label = readText(option.title);
            const postId = readText(option.serverId);
            if (!label || !postId) {
              return null;
            }

            return {
              label,
              postId,
              number: qualityTitle,
              type: 'samehadaku',
            } satisfies AnimeEpisodeServerOption;
          })
          .filter((item): item is AnimeEpisodeServerOption => item !== null);
      });
  }

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

  const sankaFormats = readArray(readRecord(record.downloadUrl).formats);
  if (sankaFormats.length > 0) {
    return sankaFormats
      .flatMap((formatItem) => {
        const formatRecord = readRecord(formatItem);
        const format = readText(formatRecord.title) || 'Unknown';
        return readArray(formatRecord.qualities)
          .map((qualityItem) => {
            const qualityRecord = readRecord(qualityItem);
            const quality = readText(qualityRecord.title) || 'Unknown';
            const links = readArray(qualityRecord.urls)
              .map((linkItem) => {
                const linkRecord = readRecord(linkItem);
                const label = readText(linkRecord.title);
                const href = readText(linkRecord.url);
                return label && href ? { label, href } : null;
              })
              .filter((item): item is { label: string; href: string } => item !== null);

            return links.length > 0 ? { format, quality, links } : null;
          })
          .filter((item): item is AnimeEpisodeDownloadGroup => item !== null);
      });
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
  return buildSankaUrl(path);
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
  const payload = await fetchSankaJson<unknown>('/anime/samehadaku/popular?page=1');
  return normalizeAnimeCardList(payload).slice(0, Math.max(limit, 1));
}

export async function getAnimeHubData(limit = 36): Promise<{ ongoing: AnimeCatalogCard[] }> {
  const snapshot = await readSnapshotDomainFile<AnimeHomeSnapshot>('anime', 'home.json');
  if (snapshot?.ongoing?.length) {
    return {
      ongoing: snapshot.ongoing.slice(0, Math.max(limit, 1)),
    };
  }
  const payload = await fetchSankaJson<unknown>('/anime/samehadaku/ongoing?page=1');
  const cards = normalizeAnimeCardList(payload);
  return { ongoing: cards.slice(0, Math.max(limit, 1)) };
}

export async function getAnimeIndexData(): Promise<AnimeIndexGroup[]> {
  const payload = await fetchSankaJson<unknown>('/anime/samehadaku/list');
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

  const payload = await fetchSankaJson<unknown>(`/anime/samehadaku/search?q=${encodeURIComponent(trimmed)}`);
  return normalizeAnimeCardList(payload).slice(0, Math.min(Math.max(limit, 1), 12));
}

function normalizeAnimeDetail(payload: unknown, slugFallback = ''): AnimeDetailData | null {
  const record = readRecord(unwrapAnimePayload(payload));
  const slug = buildAnimeSlug(record) || slugFallback;
  const title =
    readText(record.title) ||
    readText(record.english) ||
    readText(record.synonyms) ||
    readText(record.japanese) ||
    slug;

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
  const totalEpisodes = buildEpisodeCountLabel(record) !== 'Unknown'
    ? buildEpisodeCountLabel(record)
    : String(episodes.length || 'Unknown');
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
    externalUrl: readText(record.samehadakuUrl) || readText(record.externalUrl) || buildPath(`/anime/samehadaku/anime/${slug}`),
    trailerUrl: readText(record.trailerUrl) || readText(record.trailer_url) || null,
    enrichment,
  };
}

export async function getAnimeDetailBySlug(slug: string): Promise<AnimeDetailData | null> {
  const snapshot = await readSnapshotTitle<AnimeDetailData>('anime', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await fetchSankaJson<unknown>(`/anime/samehadaku/anime/${encodeURIComponent(slug)}`);
  return normalizeAnimeDetail(payload, slug);
}

function normalizeEpisodeDetail(payload: unknown, slugFallback = ''): AnimeEpisodeData | null {
  const record = readRecord(unwrapAnimePayload(payload));
  const episodeSlug =
    readText(record.episodeSlug) ||
    readText(record.episode_slug) ||
    readText(record.episodeId) ||
    slugFallback;
  const animeSlug = readText(record.animeSlug) || readText(record.anime_slug) || readText(record.animeId);
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
    playlist: playlist.length > 0 ? playlist : normalizeAnimeEpisodes(record.recommendedEpisodeList),
    prevEpisodeSlug:
      readText(record.prevEpisodeSlug) ||
      readText(record.prev_episode_slug) ||
      readText(readRecord(record.prevEpisode).episodeId) ||
      null,
    nextEpisodeSlug:
      readText(record.nextEpisodeSlug) ||
      readText(record.next_episode_slug) ||
      readText(readRecord(record.nextEpisode).episodeId) ||
      null,
    externalUrl: readText(record.samehadakuUrl) || readText(record.externalUrl) || buildPath(`/anime/samehadaku/episode/${episodeSlug}`),
    animeExternalUrl: readText(record.animeExternalUrl) || buildPath(`/anime/samehadaku/anime/${animeSlug}`),
    fetchStatus: readText(record.fetchStatus) || readText(record.fetch_status) || 'Ready',
  };
}

export async function getAnimeEpisodeBySlug(slug: string): Promise<AnimeEpisodeData | null> {
  const snapshot = await readSnapshotPlayback<AnimeEpisodeData>('anime', slug);
  if (snapshot) {
    return snapshot;
  }
  const payload = await fetchSankaJson<unknown>(`/anime/samehadaku/episode/${encodeURIComponent(slug)}`);
  return normalizeEpisodeDetail(payload, slug);
}

function normalizeSankaGenre(item: unknown): KanataGenre | null {
  const record = readRecord(item);
  const slug = readText(record.genreId) || readText(record.href).split('/').filter(Boolean).pop() || '';
  const name = readText(record.title);

  if (!slug || !name) {
    return null;
  }

  return {
    name,
    slug,
    url: readText(record.samehadakuUrl) || readText(record.href),
  };
}

function normalizeSankaSchedule(payload: unknown): AnimeSchedule[] {
  const wrapped = readRecord(readRecord(payload).data);
  const days = readArray(wrapped.days);

  return days
    .map((dayItem) => {
      const dayRecord = readRecord(dayItem);
      const day = readText(dayRecord.day);
      const animeList = normalizeAnimeCardList(dayRecord.animeList).map((item) => ({
        title: item.title,
        slug: item.slug,
        thumb: item.thumb,
        episode:
          readText(
            readRecord(
              readArray(dayRecord.animeList).find((entry) => buildAnimeSlug(entry) === item.slug),
            ).estimation,
          ) || item.episode,
        type: item.type,
        status: item.status,
      }));

      return day && animeList.length > 0 ? { day, anime_list: animeList } : null;
    })
    .filter((item): item is AnimeSchedule => item !== null);
}

export async function getAnimeSchedule(): Promise<AnimeSchedule[]> {
  const payload = await fetchSankaJson<unknown>('/anime/samehadaku/schedule');
  return normalizeSankaSchedule(payload);
}

export async function getCompletedAnimePage(page = 1): Promise<AnimePaginationResult<KanataCompletedAnime>> {
  const payload = await fetchSankaJson<{
    data?: { animeList?: unknown[] };
    pagination?: { hasNextPage?: boolean };
  }>(`/anime/samehadaku/completed?page=${page}`);

  return {
    items: normalizeAnimeCardList(readRecord(payload).data).map((item) => ({
      title: item.title,
      slug: item.slug,
      thumb: item.thumb,
      episode: item.episode,
      date: '',
    })),
    hasNextPage: Boolean(readRecord(readRecord(payload).pagination).hasNextPage),
  };
}

export async function getOngoingAnime(page = 1): Promise<KanataAnime[]> {
  const payload = await fetchSankaJson<{
    data?: { animeList?: unknown[] };
  }>(`/anime/samehadaku/ongoing?page=${page}`);

  return normalizeAnimeCardList(readRecord(payload).data).map((item) => ({
    title: item.title,
    slug: item.slug,
    thumb: item.thumb,
    episode: item.episode,
    type: item.type,
    status: item.status,
  }));
}

export async function getKanataGenres(): Promise<KanataGenre[]> {
  const payload = await fetchSankaJson<{ data?: { genreList?: unknown[] } }>('/anime/samehadaku/genres');
  const genreList = readArray(readRecord(payload).data ? readRecord(readRecord(payload).data).genreList : []);

  return genreList
    .map((item) => normalizeSankaGenre(item))
    .filter((item): item is KanataGenre => item !== null);
}

export async function getKanataAnimeByGenre(genreSlug: string, page = 1): Promise<KanataAnime[]> {
  const payload = await fetchSankaJson<{ data?: { animeList?: unknown[] } }>(
    `/anime/samehadaku/genres/${encodeURIComponent(genreSlug)}?page=${page}`,
  );

  return normalizeAnimeCardList(readRecord(payload).data).map((item) => ({
    title: item.title,
    slug: item.slug,
    thumb: item.thumb,
    episode: item.episode,
    type: item.type,
    status: item.status,
  }));
}

export async function getAnimeBatch(slug: string): Promise<KanataAnimeBatch> {
  const payload = await fetchSankaJson<{
    data?: {
      title?: string;
      poster?: string;
      downloadUrl?: {
        formats?: Array<{
          title?: string;
          qualities?: Array<{
            title?: string;
            urls?: Array<{ title?: string; url?: string }>;
          }>;
        }>;
      };
    };
  }>(`/anime/samehadaku/batch/${encodeURIComponent(slug)}`);

  const data = readRecord(readRecord(payload).data);
  const formats = readArray(readRecord(data.downloadUrl).formats);

  return {
    title: readText(data.title) || slug,
    thumb: readText(data.poster) || '/favicon.ico',
    download_list: formats
      .map((formatItem) => {
        const formatRecord = readRecord(formatItem);
        const qualities = readArray(formatRecord.qualities);
        return {
          title: readText(formatRecord.title) || 'Batch Downloads',
          links: qualities
            .map((qualityItem) => {
              const qualityRecord = readRecord(qualityItem);
              const urls = readArray(qualityRecord.urls);
              return {
                quality: readText(qualityRecord.title) || 'Unknown',
                size: '',
                links: urls
                  .map((urlItem) => {
                    const urlRecord = readRecord(urlItem);
                    const name = readText(urlRecord.title);
                    const url = readText(urlRecord.url);
                    return name && url ? { name, url } : null;
                  })
                  .filter((item): item is { name: string; url: string } => item !== null),
              };
            })
            .filter((item) => item.links.length > 0),
        };
      })
      .filter((item) => item.links.length > 0),
  };
}

export const searchAnime = searchAnimeCatalog;

export type { AnimePaginationResult, KanataAnimeBatch, KanataCompletedAnime };
