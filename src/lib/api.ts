import { withCloudflareEdgeCache } from './cloudflare-cache';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from './runtime-snapshot';
import { buildSankaUrl, fetchSankaJson } from './sanka';

/**
 * Secure & Standardized API Engine.
 */

const d = (s: string) => typeof window !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString();

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

export const API_CONFIG = {
  M: d('aHR0cHM6Ly9hcGkucnl6dW1pLm5ldC9hcGkva29taWt1'),
  A: d('aHR0cHM6Ly9hcGkua2FuYXRhLndlYi5pZC9hbmltYXN1'),
  D: d('aHR0cHM6Ly9hcGkua2FuYXRhLndlYi5pZC9hbmljaGlu'),
  O: d('aHR0cHM6Ly9hcGkua2FuYXRhLndlYi5pZC9vdGFrdWRlc3U='),
  S: d('aHR0cHM6Ly9hcGkuYW1tYXJpY2Fuby5teS5pZC9hcGkvYW5pbWFzdS9zZWFyY2g='),
  J: d('aHR0cHM6Ly9hcGkuamlra2FuLm1vZS92NA=='),
  MT: d('aHR0cHM6Ly9hcGkua2FuYXRhLndlYi5pZC9tb3ZpZXR1YmU='),
  IMDB: d('aHR0cHM6Ly9pbWRiLmlhbWlkaW90YXJleW91dG9vLmNvbS9zZWFyY2g='),
} as const;

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();

const CACHE_TTL = {
  short: 1000 * 60 * 5,
  medium: 1000 * 60 * 15,
  long: 1000 * 60 * 60 * 6,
} as const;

type ReadingHomeSnapshot = {
  popular?: MangaSearchResult[];
  newest?: MangaSearchResult[];
};

type DonghuaHomeSnapshot = {
  latest_updates: AnichinDonghua[];
  ongoing_series: AnichinDonghua[];
};

const COMIC_SUBTYPES = ['manga', 'manhwa', 'manhua'] as const;

async function withRuntimeCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = runtimeCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inflight = inflightCache.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const pending = loader()
    .then((value) => {
      runtimeCache.set(key, {
        expiresAt: now + ttlMs,
        value,
      });
      return value;
    })
    .finally(() => {
      inflightCache.delete(key);
    });

  inflightCache.set(key, pending as Promise<unknown>);
  return pending;
}

type FetchJsonOptions = {
  edgeCacheKey?: string;
  edgeCacheTtlSeconds?: number;
};

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const loader = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API timeout');
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

/**
 * Enrichment for Movie Posters using IMDB Search API.
 * Since MovieTube posters are unreliable, we fetch high-quality ones from IMDB.
 */
export async function getMovieMetadata(title: string): Promise<{ poster?: string; rating?: string; actors?: string }> {
  const normalizedTitle = title.trim().toLowerCase();
  return withRuntimeCache(`imdb:${normalizedTitle}`, CACHE_TTL.long, async () => {
    try {
      const data = await fetchJson<Record<string, unknown>>(`${API_CONFIG.IMDB}?q=${encodeURIComponent(title)}`);
      const description = data.description as Array<Record<string, unknown>>;
      if (data.ok && description?.length > 0) {
        const top = description[0];
        return {
          poster: top['#IMG_POSTER'] as string | undefined,
          rating: top['#RANK'] ? String(top['#RANK']) : undefined,
          actors: top['#ACTORS'] as string | undefined
        };
      }
      return {};
    } catch {
      return {};
    }
  });
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      const record = readObject(item);
      return readString(record.name) || readString(record.title);
    })
    .filter(Boolean);
}

function normalizeSankaAnimeSlug(value: unknown): string {
  const record = readObject(value);
  return (
    readString(value) ||
    readString(record.slug) ||
    readString(record.animeId) ||
    extractSlugFromUrl(readString(record.href)) ||
    extractSlugFromUrl(readString(record.samehadakuUrl))
  );
}

function normalizeSankaAnimeCard(item: unknown): KanataAnime | null {
  const record = readObject(item);
  const slug = normalizeSankaAnimeSlug(record);
  const title = readString(record.title);

  if (!slug || !title) {
    return null;
  }

  return {
    title,
    slug,
    thumb: readString(record.poster) || '/favicon.ico',
    episode: readString(record.episodes) || readString(record.releasedOn) || readString(record.status) || 'Unknown',
    type: readString(record.type) || 'Anime',
    status: readString(record.status) || 'Unknown',
  };
}

function normalizeSankaAnimeList(items: unknown): KanataAnime[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeSankaAnimeCard(item))
    .filter((item): item is KanataAnime => item !== null);
}

function normalizeSankaGenre(item: unknown): KanataGenre | null {
  const record = readObject(item);
  const slug = readString(record.genreId) || extractSlugFromUrl(readString(record.href));
  const name = readString(record.title);

  if (!slug || !name) {
    return null;
  }

  return {
    name,
    slug,
    url: readString(record.samehadakuUrl) || readString(record.href),
  };
}

function normalizeSankaSchedule(payload: unknown): AnimeSchedule[] {
  const days = Array.isArray(readObject(readObject(payload).data).days)
    ? (readObject(readObject(payload).data).days as unknown[])
    : [];

  return days
    .map((dayItem) => {
      const dayRecord = readObject(dayItem);
      const day = readString(dayRecord.day);
      const animeList = normalizeSankaAnimeList(dayRecord.animeList).map((item) => ({
        ...item,
        episode: readString(readObject(
          (Array.isArray(dayRecord.animeList) ? dayRecord.animeList : []).find((entry) => normalizeSankaAnimeSlug(entry) === item.slug)
        ).estimation) || item.episode,
      }));

      return day && animeList.length > 0 ? { day, anime_list: animeList } : null;
    })
    .filter((item): item is AnimeSchedule => item !== null);
}

function normalizeSankaAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return buildSankaUrl(url);
  return url;
}

function normalizeComicType(value: unknown): string {
  const type = readString(value).toLowerCase();
  if (type.includes('manhwa')) return 'Manhwa';
  if (type.includes('manhua')) return 'Manhua';
  if (type.includes('comic')) return 'Comic';
  if (type.includes('novel')) return 'Novel';
  return 'Manga';
}

function readComicEntries(payload: unknown): Record<string, unknown>[] {
  const record = readObject(payload);

  if (Array.isArray(record.data)) {
    return record.data.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }

  if (Array.isArray(record.comics)) {
    return record.comics.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }

  if (Array.isArray(record.results)) {
    return record.results.map((item) => readObject(item)).filter((item) => Object.keys(item).length > 0);
  }

  return Object.entries(record)
    .filter(([key, value]) => /^\d+$/.test(key) && value && typeof value === 'object' && !Array.isArray(value))
    .map(([, value]) => readObject(value));
}

function extractComicSlug(record: Record<string, unknown>): string {
  return (
    readString(record.slug) ||
    extractSlugFromUrl(readString(record.link)) ||
    extractSlugFromUrl(readString(record.href))
  );
}

function normalizeComicCard(item: unknown, forcedType?: MangaSubtype): MangaSearchResult | null {
  const record = readObject(item);
  const title = readString(record.title);
  const slug = extractComicSlug(record);
  const href = readString(record.href);
  const link = readString(record.link) || href || (slug ? `/manga/${slug}/` : '');

  if (!title || !slug || link === '/plus/') {
    return null;
  }

  const inferredType = normalizeComicType(forcedType || record.type);

  return {
    title,
    altTitle: readString(record.altTitle) || null,
    slug,
    href: href || link,
    thumbnail: normalizeSankaAssetUrl(readString(record.thumbnail) || readString(record.image)),
    type: inferredType,
    genre: readString(record.genre),
    description: readString(record.description) || readString(record.note),
    chapter: readString(record.chapter),
    time_ago: readString(record.time_ago),
    link,
    image: normalizeSankaAssetUrl(readString(record.image) || readString(record.thumbnail)),
  };
}

function normalizeComicList(payload: unknown, forcedType?: MangaSubtype): MangaSearchResult[] {
  return readComicEntries(payload)
    .map((item) => normalizeComicCard(item, forcedType))
    .filter((item): item is MangaSearchResult => item !== null);
}

async function getComicDetailFromSanka(slug: string): Promise<MangaDetail> {
  const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/comic/${encodeURIComponent(slug)}`);
  const metadata = readObject(payload.metadata);

  return {
    creator: readString(payload.creator) || 'Sanka Vollerei',
    slug: readString(payload.slug) || slug,
    title: readString(payload.title) || slug,
    title_indonesian: readString(payload.title_indonesian),
    image: normalizeSankaAssetUrl(readString(payload.image)),
    synopsis: readString(payload.synopsis),
    synopsis_full: readString(payload.synopsis_full) || readString(payload.synopsis),
    summary: readString(payload.summary),
    background_story: readString(payload.background_story),
    metadata: {
      type: normalizeComicType(metadata.type),
      author: readString(metadata.author),
      status: readString(metadata.status),
      concept: readString(metadata.concept),
      age_rating: readString(metadata.age_rating),
      reading_direction: readString(metadata.reading_direction),
    },
    genres: (Array.isArray(payload.genres) ? payload.genres : [])
      .map((genre) => {
        const record = readObject(genre);
        return {
          name: readString(record.name),
          slug: readString(record.slug) || extractSlugFromUrl(readString(record.link)),
          link: readString(record.link),
        };
      })
      .filter((genre) => genre.name && genre.slug),
    chapters: (Array.isArray(payload.chapters) ? payload.chapters : [])
      .map((chapter) => {
        const record = readObject(chapter);
        return {
          chapter: readString(record.chapter),
          slug: readString(record.slug) || extractSlugFromUrl(readString(record.link)),
          link: readString(record.link),
          date: readString(record.date),
        };
      })
      .filter((chapter) => chapter.chapter && chapter.slug),
    similar_manga: (Array.isArray(payload.similar_manga) ? payload.similar_manga : [])
      .map((item) => {
        const record = readObject(item);
        const similarSlug = readString(record.slug) || extractSlugFromUrl(readString(record.link));
        return {
          title: readString(record.title),
          slug: similarSlug,
          link: readString(record.link) || (similarSlug ? `/manga/${similarSlug}/` : ''),
          image: normalizeSankaAssetUrl(readString(record.image)),
          type: normalizeComicType(record.type),
          description: readString(record.description),
        };
      })
      .filter((item) => item.title && item.slug),
  };
}

async function getComicTypeLookup(): Promise<Map<string, string>> {
  return withRuntimeCache('comic:type-lookup', CACHE_TTL.medium, async () => {
    const lists = await Promise.all(
      COMIC_SUBTYPES.map(async (subtype) => {
        try {
          const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/type/${subtype}?page=1`);
          return normalizeComicList(payload, subtype);
        } catch {
          return [];
        }
      })
    );

    const lookup = new Map<string, string>();
    for (const item of lists.flat()) {
      lookup.set(item.slug, item.type);
      lookup.set(item.link, item.type);
      if (item.href) {
        lookup.set(item.href, item.type);
      }
    }
    return lookup;
  });
}

async function applyComicTypeHints(
  items: MangaSearchResult[],
  options: { detailLookupLimit?: number } = {},
): Promise<MangaSearchResult[]> {
  const lookup = await getComicTypeLookup().catch(() => new Map<string, string>());
  const hinted = items.map((item) => ({
    ...item,
    type: lookup.get(item.slug) || lookup.get(item.link) || lookup.get(item.href) || item.type || 'Manga',
  }));

  const detailLookupLimit = options.detailLookupLimit ?? 0;
  if (detailLookupLimit <= 0) {
    return hinted;
  }

  const missing = hinted.filter((item) => !item.type || item.type === 'Manga');
  if (missing.length === 0) {
    return hinted;
  }

  const resolved = new Map<string, string>();
  await Promise.all(
    missing.slice(0, detailLookupLimit).map(async (item) => {
      try {
        const detail = await getComicDetailFromSanka(item.slug);
        resolved.set(item.slug, normalizeComicType(detail.metadata.type));
      } catch {
        // Best-effort only.
      }
    })
  );

  return hinted.map((item) => ({
    ...item,
    type: resolved.get(item.slug) || item.type || 'Manga',
  }));
}

function mergeUniqueComicCards(items: MangaSearchResult[]): MangaSearchResult[] {
  const seen = new Set<string>();
  const output: MangaSearchResult[] = [];

  for (const item of items) {
    const key = item.slug || extractSlugFromUrl(item.link) || extractSlugFromUrl(item.href);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }

  return output;
}

// --- CORE OBJECTS ---

export const anime = {
  getDetail: async (slug: string): Promise<KanataAnimeDetail> => {
    const payload = await fetchSankaJson<{
      data?: {
        title?: string;
        japanese?: string;
        synonyms?: string;
        english?: string;
        status?: string;
        type?: string;
        synopsis?: string;
        poster?: string;
        genreList?: Array<{ title?: string }>;
        episodeList?: Array<{ title?: string; episodeId?: string; releasedOn?: string }>;
        studios?: string | Array<{ title?: string; name?: string }>;
        score?: string;
        episodes?: string | number;
      };
    }>(`/anime/samehadaku/anime/${encodeURIComponent(slug)}`);

    const data = readObject(payload.data);
    const episodeList = Array.isArray(data.episodeList) ? data.episodeList : [];

    return {
      title: readString(data.title) || readString(data.english) || readString(data.synonyms) || readString(data.japanese) || slug,
      alternative_title:
        readString(data.english) || readString(data.synonyms) || readString(data.japanese),
      status: readString(data.status) || 'Unknown',
      type: readString(data.type) || 'Anime',
      synopsis: readString(data.synopsis),
      thumb: readString(data.poster) || '/favicon.ico',
      genres: readStringArray(data.genreList),
      episodes: episodeList
        ? episodeList
            .map((item) => {
              const record = readObject(item);
              const episodeSlug = readString(record.episodeId);
              return episodeSlug
                ? {
                    title: readString(record.title) || episodeSlug,
                    slug: episodeSlug,
                    date: readString(record.releasedOn),
                  }
                : null;
            })
            .filter((item): item is { title: string; slug: string; date: string } => item !== null)
        : [],
      studio: Array.isArray(data.studios)
        ? readStringArray(data.studios).join(', ')
        : readString(data.studios),
      rating: readString(data.score) || 'N/A',
      total_episodes: readString(data.episodes) || String(episodeList.length || 'Unknown'),
      provider: 'samehadaku',
    };
  },
  getEpisode: async (slug: string): Promise<KanataEpisodeDetail> => {
    const payload = await fetchSankaJson<{
      data?: {
        title?: string;
        defaultStreamingUrl?: string;
        server?: { qualities?: Array<{ title?: string; serverList?: Array<{ title?: string; serverId?: string; href?: string }> }> };
        prevEpisode?: { episodeId?: string };
        nextEpisode?: { episodeId?: string };
        animeId?: string;
      };
    }>(`/anime/samehadaku/episode/${encodeURIComponent(slug)}`);

    const data = readObject(payload.data);
    const qualities = Array.isArray(readObject(data.server).qualities) ? (readObject(data.server).qualities as unknown[]) : [];
    const mirrors = qualities.flatMap((quality) => {
      const qualityRecord = readObject(quality);
      const qualityLabel = readString(qualityRecord.title);
      const serverList = Array.isArray(qualityRecord.serverList) ? qualityRecord.serverList : [];
      return serverList
        .map((server) => {
          const serverRecord = readObject(server);
          const href = readString(serverRecord.href);
          return href
            ? {
                label: readString(serverRecord.title) || qualityLabel || 'Mirror',
                embed_url: `https://www.sankavollerei.com${href}`,
              }
            : null;
        })
        .filter((item): item is { label: string; embed_url: string } => item !== null);
    });

    return {
      title: readString(data.title) || slug,
      default_embed: readString(data.defaultStreamingUrl) || mirrors[0]?.embed_url || '',
      mirrors,
      slug,
      navigation: {
        next: readString(readObject(data.nextEpisode).episodeId) || null,
        prev: readString(readObject(data.prevEpisode).episodeId) || null,
        anime_info: readString(data.animeId),
      },
    };
  },
  search: async (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    const payload = await fetchSankaJson<{
      data?: {
        animeList?: unknown[];
      };
    }>(`/anime/samehadaku/search?q=${encodeURIComponent(query)}`);

    return normalizeSankaAnimeList(readObject(payload.data).animeList);
  },
  getSchedule: () =>
    withRuntimeCache('anime:schedule', CACHE_TTL.medium, async () => {
      const payload = await fetchSankaJson<unknown>('/anime/samehadaku/schedule');
      return normalizeSankaSchedule(payload);
    }),
  getCompleted: async (page = 1) => {
    const payload = await fetchSankaJson<{
      data?: {
        animeList?: unknown[];
      };
    }>(`/anime/samehadaku/completed?page=${page}`);

    return normalizeSankaAnimeList(readObject(payload.data).animeList).map((item) => ({
      ...item,
      date: '',
    }));
  },
  getList: async () => {
    const payload = await fetchSankaJson<{
      data?: {
        list?: Array<{ startWith?: string; animeList?: Array<{ title?: string; animeId?: string }> }>;
      };
    }>('/anime/samehadaku/list');

    return (readObject(payload.data).list as AnimeListGroup[] | undefined)?.map?.((group) => group) ||
      (Array.isArray(readObject(payload.data).list)
        ? (readObject(payload.data).list as Array<{ startWith?: string; animeList?: Array<{ title?: string; animeId?: string }> }>).map((group) => ({
            letter: readString(group.startWith) || '#',
            list: Array.isArray(group.animeList)
              ? group.animeList
                  .map((item) => {
                    const record = readObject(item);
                    const title = readString(record.title);
                    const animeSlug = readString(record.animeId);
                    return title && animeSlug ? { title, slug: animeSlug } : null;
                  })
                  .filter((item): item is { title: string; slug: string } => item !== null)
              : [],
          }))
        : []);
  },
  getBatch: async (slug: string) => {
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

    const data = readObject(payload.data);
    const formats = Array.isArray(readObject(data.downloadUrl).formats)
      ? (readObject(data.downloadUrl).formats as unknown[])
      : [];

    return {
      title: readString(data.title) || slug,
      thumb: readString(data.poster) || '/favicon.ico',
      download_list: formats.map((formatItem) => {
        const formatRecord = readObject(formatItem);
        const qualities = Array.isArray(formatRecord.qualities) ? formatRecord.qualities : [];
        return {
          title: readString(formatRecord.title) || 'Batch Downloads',
          links: qualities
            .map((qualityItem) => {
              const qualityRecord = readObject(qualityItem);
              const urls = Array.isArray(qualityRecord.urls) ? qualityRecord.urls : [];
              return {
                quality: readString(qualityRecord.title) || 'Unknown',
                size: '',
                links: urls
                  .map((urlItem) => {
                    const urlRecord = readObject(urlItem);
                    const name = readString(urlRecord.title);
                    const url = readString(urlRecord.url);
                    return name && url ? { name, url } : null;
                  })
                  .filter((item): item is { name: string; url: string } => item !== null),
              };
            })
            .filter((item) => item.links.length > 0),
        };
      }).filter((item) => item.links.length > 0),
    };
  },
  getGenres: async () => {
    const payload = await fetchSankaJson<{
      data?: { genreList?: unknown[] };
    }>('/anime/samehadaku/genres');
    const genreList = Array.isArray(readObject(payload.data).genreList)
      ? (readObject(payload.data).genreList as unknown[])
      : [];

    return genreList
      .map((item) => normalizeSankaGenre(item))
      .filter((item): item is KanataGenre => item !== null);
  },
  getGenre: async (g: string, p = 1) => {
    const payload = await fetchSankaJson<{
      data?: { animeList?: unknown[] };
    }>(`/anime/samehadaku/genres/${encodeURIComponent(g)}?page=${p}`);

    return normalizeSankaAnimeList(readObject(payload.data).animeList);
  },
};

export const movie = {
  getHome: (s: 'popular' | 'latest' | 'trending' = 'latest') => withRuntimeCache(`movie:home:${s}`, CACHE_TTL.medium, async () => {
    const snapshot = await readSnapshotDomainFile<{ popular?: MovieCardItem[]; latest?: MovieCardItem[]; trending?: MovieCardItem[] }>('movies', 'home.json');
    const snapshotItems = snapshot?.[s];
    if (snapshotItems && snapshotItems.length > 0) {
      return snapshotItems;
    }
    return fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/home?section=${s}`, {
      edgeCacheKey: `home:movie:${s}`,
      edgeCacheTtlSeconds: 900,
    }).then(r => r.data || []);
  }),
  search: (q: string, p = 1) => fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/search?q=${encodeURIComponent(q)}&page=${p}`, {
    edgeCacheKey: `search:movie:${q.trim().toLowerCase()}:${p}`,
    edgeCacheTtlSeconds: 300,
  }).then(r => r.data || []),
  getDetail: (slug: string, t: 'movie' | 'series' = 'movie') => fetchJson<{data: MovieDetail}>(`${API_CONFIG.MT}/detail/${slug}?type=${t}`, {
    edgeCacheKey: `detail:movie:legacy:${slug}:${t}`,
    edgeCacheTtlSeconds: 1800,
  }).then(r => r.data),
  getStream: (id: string, t: 'movie' | 'series' = 'movie') =>
    fetchJson<{ stream_url?: string; data?: string }>(`${API_CONFIG.MT}/stream?id=${id}&type=${t}`, {
      edgeCacheKey: `playback:movie:legacy:${id}:${t}`,
      edgeCacheTtlSeconds: 300,
    }).then((response) => response.stream_url || response.data || ''),
  getByGenre: (g: string, p = 1) => fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/genre/${g}?page=${p}`, {
    edgeCacheKey: `home:movie:genre-legacy:${g.trim().toLowerCase()}:${p}`,
    edgeCacheTtlSeconds: 900,
  }).then(r => r.data || []),
};

export const manga = {
  search: async (q: string, p = 1) => {
    if (p === 1) {
      const snapshotResults = (
        await Promise.all(
          (COMIC_SUBTYPES as readonly MangaSubtype[]).map((domain) =>
            searchSnapshotDomain<MangaSearchResult>(domain, q, 24)
          )
        )
      ).flat();
      if (snapshotResults.length > 0) {
        return { data: snapshotResults };
      }
    }
    return withRuntimeCache(`manga:search:${q.trim().toLowerCase()}:${p}`, CACHE_TTL.short, async () => {
      const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/search?q=${encodeURIComponent(q)}&page=${p}`);
      return { data: normalizeComicList(payload) };
    });
  },
  getDetail: async (slug: string) => {
    for (const domain of COMIC_SUBTYPES) {
      const snapshot = await readSnapshotTitle<MangaDetail>(domain, slug);
      if (snapshot) {
        return snapshot;
      }
    }
    return withRuntimeCache(`manga:detail:${slug}`, CACHE_TTL.medium, () => getComicDetailFromSanka(slug));
  },
  getChapter: async (seg: string) => {
    for (const domain of COMIC_SUBTYPES) {
      const snapshot = await readSnapshotPlayback<ChapterDetail>(domain, seg);
      if (snapshot) {
        return snapshot;
      }
    }
    return withRuntimeCache(`manga:chapter:${seg}`, CACHE_TTL.short, async () => {
      const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/chapter/${encodeURIComponent(seg)}`);
      const navigation = readObject(payload.navigation);
      const next = readString(navigation.nextChapter || payload.nextChapter);
      const prev = readString(navigation.previousChapter || payload.previousChapter);

      return {
        title: readString(payload.chapter_title) || readString(payload.title) || seg,
        manga_title: readString(payload.manga_title),
        chapter_title: readString(payload.chapter_title),
        images: (Array.isArray(payload.images) ? payload.images : []).map((image) => normalizeSankaAssetUrl(readString(image))).filter(Boolean),
        navigation: {
          next,
          prev,
          nextChapter: next,
          previousChapter: prev,
        },
      };
    });
  },
  getPopular: () => withRuntimeCache('manga:popular', CACHE_TTL.medium, async () => {
    const snapshotResults = (
      await Promise.all(
        COMIC_SUBTYPES.map(async (domain) => {
          const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
          return snapshot?.popular || [];
        })
      )
    ).flat();
    if (snapshotResults.length > 0) {
      return { comics: snapshotResults };
    }
    const typedLists = await Promise.all(
      COMIC_SUBTYPES.map(async (subtype) => {
        try {
          const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/type/${subtype}?page=1`);
          return normalizeComicList(payload, subtype);
        } catch {
          return [];
        }
      })
    );

    return {
      comics: mergeUniqueComicCards(typedLists.flat()),
    };
  }),
  getNew: (p = 1, l = 10) => withRuntimeCache(`manga:new:${p}:${l}`, CACHE_TTL.medium, async () => {
    if (p === 1) {
      const snapshotResults = (
        await Promise.all(
          COMIC_SUBTYPES.map(async (domain) => {
            const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
            return snapshot?.newest || [];
          })
        )
      ).flat();
      if (snapshotResults.length > 0) {
        return { comics: snapshotResults.slice(0, l) };
      }
    }
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/terbaru?page=${p}&limit=${l}`);
    const normalized = normalizeComicList(payload);
    return {
      comics: (await applyComicTypeHints(normalized, { detailLookupLimit: p === 1 ? Math.min(l, 8) : 0 })).slice(0, l),
    };
  }),
  getRecommendations: (slug: string) => withRuntimeCache(`manga:recommendations:${slug}`, CACHE_TTL.medium, async () => {
    const detail = await manga.getDetail(slug);
    return {
      recommendations: detail.similar_manga.map((item) => ({
        title: item.title,
        altTitle: null,
        slug: item.slug,
        href: item.link,
        thumbnail: item.image,
        type: item.type || 'Manga',
        genre: '',
        description: item.description || '',
        link: item.link,
        image: item.image,
      })),
    };
  }),
  getByGenre: (g: string, p = 1) => withRuntimeCache(`manga:genre:${g.trim().toLowerCase()}:${p}`, CACHE_TTL.medium, async () => {
    const payload = await fetchSankaJson<Record<string, unknown>>(`/comic/genre/${encodeURIComponent(g)}?page=${p}`);
    const normalized = normalizeComicList(payload);
    return {
      comics: await applyComicTypeHints(normalized, { detailLookupLimit: p === 1 ? 10 : 0 }),
    };
  }),
};

export const donghua = {
  getHome: () => withRuntimeCache('donghua:home', CACHE_TTL.medium, async () => {
    const snapshot = await readSnapshotDomainFile<DonghuaHomeSnapshot>('donghua', 'home.json');
    if (snapshot) {
      return snapshot;
    }
    const payload = await fetchSankaJson<{
      latest_release?: Array<{
        title?: string;
        slug?: string;
        poster?: string;
        current_episode?: string;
        status?: string;
        type?: string;
      }>;
      ongoing_series?: Array<{
        title?: string;
        slug?: string;
        poster?: string;
        current_episode?: string;
        episode?: string;
        status?: string;
        type?: string;
      }>;
    }>('/anime/donghua/home/1');

    const latestUpdates = (payload.latest_release || []).map((item) => ({
      title: item.title || '',
      slug: extractSlugFromUrl(item.slug || ''),
      thumb: item.poster || '',
      episode: item.current_episode || '',
      image: item.poster || '',
      status: item.status || '',
      type: item.type || 'Donghua',
    })).filter((item) => item.slug && item.title);

    const ongoingSeries = (payload.ongoing_series || []).map((item) => ({
      title: item.title || '',
      slug: extractSlugFromUrl(item.slug || ''),
      thumb: item.poster || '',
      episode: item.episode || item.current_episode || '',
      image: item.poster || '',
      status: item.status || '',
      type: item.type || 'Donghua',
    })).filter((item) => item.slug && item.title);

    return {
      latest_updates: latestUpdates,
      ongoing_series: ongoingSeries,
    };
  }),
  getDetail: async (slug: string) => {
    const snapshot = await readSnapshotTitle<AnichinDetail>('donghua', slug);
    if (snapshot) {
      return snapshot;
    }
    const payload = await fetchSankaJson<{
      title?: string;
      poster?: string;
      synopsis?: string;
      genres?: Array<{ name?: string }>;
      episodes_list?: Array<{ slug?: string; title?: string; episode?: string; date?: string }>;
      studio?: string;
      status?: string;
      episodes_count?: string;
      season?: string;
      country?: string;
      network?: string;
      duration?: string;
      released?: string;
      updated_on?: string;
    }>(`/anime/donghua/detail/${encodeURIComponent(slug)}`);

    return {
      title: payload.title || slug,
      meta: {
        studio: payload.studio || 'Unknown',
        status: payload.status || 'Unknown',
        episodes: payload.episodes_count || String(payload.episodes_list?.length || 0) || 'Unknown',
        season: payload.season || 'Unknown',
        country: payload.country || 'China',
        network: payload.network || 'Unknown',
        duration: payload.duration || 'Unknown',
        released: payload.released || 'Unknown',
        updated_on: payload.updated_on || 'Unknown',
      },
      episodes: (payload.episodes_list || []).map((entry) => ({
        slug: extractSlugFromUrl(entry.slug || ''),
        title: entry.title || entry.episode || '',
        episode: entry.episode || '',
        date: entry.date || '',
      })).filter((entry) => entry.slug && entry.title),
      synopsis: payload.synopsis || '',
      thumb: payload.poster || '',
      genres: (payload.genres || []).map((genre) => genre.name || '').filter(Boolean),
    };
  },
  search: async (q: string) => {
    const snapshot = await searchSnapshotDomain<AnichinDonghua>('donghua', q, 24);
    if (snapshot.length > 0) {
      return snapshot;
    }
    const payload = await fetchSankaJson<{ data?: Array<{
      title?: string;
      slug?: string;
      poster?: string;
      status?: string;
      type?: string;
    }> }>(`/anime/donghua/search/${encodeURIComponent(q)}/1`);
    return (payload.data || []).map((item) => ({
      title: item.title || '',
      slug: extractSlugFromUrl(item.slug || ''),
      thumb: item.poster || '',
      episode: '',
      image: item.poster || '',
      status: item.status || '',
      type: item.type || 'Donghua',
    })).filter((item) => item.slug && item.title);
  },
  getEpisode: async (slug: string) => {
    const snapshot = await readSnapshotPlayback<KanataEpisodeDetail>('donghua', slug);
    if (snapshot) {
      return snapshot;
    }
    const payload = await fetchSankaJson<{
      episode?: string;
      streaming?: {
        main_url?: string;
        servers?: Array<{ name?: string; url?: string }>;
      };
      navigation?: {
        previous_episode?: string | null;
        next_episode?: string | null;
        all_episodes?: string | null;
      };
      donghua_details?: {
        title?: string;
        slug?: string;
      };
    }>(`/anime/donghua/episode/${encodeURIComponent(slug)}`);

    const mirrors = (payload.streaming?.servers || [])
      .map((server) => ({
        label: server.name || 'Source',
        embed_url: server.url || '',
      }))
      .filter((server) => server.embed_url);

    const defaultEmbed = payload.streaming?.main_url || mirrors[0]?.embed_url || '';
    return {
      title: payload.episode || slug,
      default_embed: defaultEmbed,
      mirrors,
      slug,
      navigation: {
        next: extractSlugFromUrl(payload.navigation?.next_episode || ''),
        prev: extractSlugFromUrl(payload.navigation?.previous_episode || ''),
        anime_info: extractSlugFromUrl(payload.donghua_details?.slug || payload.navigation?.all_episodes || ''),
      },
    };
  },
};

// --- COMPATIBILITY RE-EXPORTS ---
export const getAnimeDetail = anime.getDetail;
export const getAnimeEpisode = anime.getEpisode;
export const searchAnime = anime.search;
export const getAnimeSchedule = anime.getSchedule;
export const getAnimeList = anime.getList;
export const getCompletedAnime = anime.getCompleted;
export const getAnimeBatch = anime.getBatch;
export const getKanataGenres = anime.getGenres;
export const getKanataAnimeByGenre = anime.getGenre;

export const searchManga = manga.search;
export const getMangaDetail = manga.getDetail;
export const getMangaChapter = manga.getChapter;
export const getPopularManga = manga.getPopular;
export const getNewManga = manga.getNew;
export const getMangaByGenre = manga.getByGenre;
export const getMangaRecommendations = manga.getRecommendations;

export const getDonghuaHome = donghua.getHome;
export const getDonghuaDetail = donghua.getDetail;
export const searchDonghua = donghua.search;
export const getDonghuaEpisode = donghua.getEpisode;
export const getDonghuaWatch = donghua.getEpisode;

export const getMovieHome = movie.getHome;
export const searchMovies = movie.search;
export const getMovieDetail = movie.getDetail;
export const getMovieStream = movie.getStream;
export const getMoviesByGenre = movie.getByGenre;

export type AnimePaginationResult<T> = {
  items: T[];
  hasNextPage: boolean;
};

export const getCompletedAnimePage = async (page = 1): Promise<AnimePaginationResult<KanataCompletedAnime>> => {
  const payload = await fetchSankaJson<{
    data?: { animeList?: unknown[] };
    pagination?: { hasNextPage?: boolean };
  }>(`/anime/samehadaku/completed?page=${page}`);

  return {
    items: normalizeSankaAnimeList(readObject(payload.data).animeList).map((item) => ({
      ...item,
      date: '',
    })),
    hasNextPage: Boolean(readObject(payload.pagination).hasNextPage),
  };
};

export const getOngoingAnime = async (page = 1): Promise<KanataAnime[]> => {
  const payload = await fetchSankaJson<{
    data?: { animeList?: unknown[] };
  }>(`/anime/samehadaku/ongoing?page=${page}`);

  return normalizeSankaAnimeList(readObject(payload.data).animeList);
};

// --- INTERFACES ---
export interface GenericMediaItem { slug: string; title: string; thumb?: string; image?: string; thumbnail?: string; poster?: string; episode?: string; chapter?: string; year?: string; status?: string; type?: string; link?: string; }
export type MangaSubtype = 'manga' | 'manhwa' | 'manhua';
export interface MangaSearchResult { title: string; altTitle: string | null; slug: string; href: string; thumbnail: string; type: string; genre: string; description: string; chapter?: string; time_ago?: string; link: string; image: string; }
export interface MangaChapter { chapter: string; slug: string; link: string; date: string; }
export interface MangaDetail { creator: string; slug: string; title: string; title_indonesian: string; image: string; synopsis: string; synopsis_full: string; summary: string; background_story: string; metadata: { type: string; author: string; status: string; concept: string; age_rating: string; reading_direction: string; }; genres: Array<{ name: string; slug: string; link: string }>; chapters: MangaChapter[]; similar_manga: Array<{ title: string; slug: string; link: string; image: string; type: string; description: string }>; }
export interface ChapterDetail { title: string; manga_title?: string; chapter_title?: string; images: string[]; navigation: { next: string | null; prev: string | null; nextChapter?: string | null; previousChapter?: string | null; }; }
export interface KanataAnimeDetail { title: string; alternative_title: string; status: string; type: string; synopsis: string; thumb: string; genres: string[]; episodes: Array<{ title: string; slug: string; date: string }>; studio: string; rating: string; total_episodes: string; download?: Array<{ quality: string; url: string[] }>; provider?: 'samehadaku' | 'animasu' | 'otakudesu'; }
export interface KanataEpisodeDetail { title: string; default_embed: string; mirrors: Array<{ label: string; embed_url: string }>; slug: string; navigation: { next: string | null; prev: string | null; anime_info: string }; }
export interface AnimeSchedule { day: string; anime_list: KanataAnime[]; }
export interface AnimeListGroup { letter: string; list: Array<{ title: string; slug: string }>; }
export interface KanataAnimeBatch { title: string; thumb: string; download_list: Array<{ title: string; links: Array<{ quality: string; size: string; links: Array<{ name: string; url: string }> }> }>; }
export interface KanataAnime { title: string; slug: string; thumb: string; episode: string; type: string; status: string; }
export interface KanataCompletedAnime { title: string; slug: string; thumb: string; episode: string; date: string; }
export interface KanataGenre { name: string; slug: string; url: string; }
export interface AnichinHomeResult { latest_updates: AnichinDonghua[]; ongoing_series: AnichinDonghua[]; }
export interface AnichinDetail { title: string; meta: { studio: string; status: string; episodes: string; season: string; country: string; network: string; duration: string; released: string; updated_on: string; }; episodes: Array<{ slug: string; title: string; episode: string; date: string; }>; synopsis: string; thumb: string; genres: string[]; }
export interface AnichinDonghua { title: string; slug: string; thumb: string; episode: string; image?: string; status?: string; type?: string; }
export interface AnimeCastMember {
  id: number;
  name: string;
  role: string;
  image?: string;
  voiceActor?: string;
  voiceActorLanguage?: string;
}
export interface JikanEnrichment { malId: number; score: number; rank: number; popularity: number; synopsis: string; trailer_url: string; status: string; source: string; rating: string; year: number | null; season: string; genres: string[]; themes: string[]; studios: string[]; title: string; url: string; mediaType: 'anime' | 'manga'; chapters?: number | null; episodes?: number | null; }
export interface MovieCardItem { slug: string; title: string; poster: string; year: string; type: 'movie' | 'series'; rating?: string; status?: string; genres?: string; }
export interface MovieDetail { slug: string; title: string; poster: string; year: string; rating?: string; genres: string; type: 'movie' | 'series'; duration?: string; synopsis: string; quality: string; cast?: string; director?: string; country?: string; recommendations?: MovieCardItem[]; }

// ALIASES
export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export type AnimasuSearchResult = KanataAnime;

// HELPERS
export const extractSlugFromUrl = (url: string) => url ? url.split('/').filter(Boolean).pop() || '' : '';
export const getMangaSubtype = (item: Pick<MangaSearchResult, 'type'>): MangaSubtype => {
  const type = item.type?.toLowerCase() ?? '';
  if (type.includes('manhwa')) return 'manhwa';
  if (type.includes('manhua')) return 'manhua';
  return 'manga';
};
export const filterMangaBySubtype = (items: MangaSearchResult[], subtype: MangaSubtype): MangaSearchResult[] =>
  items.filter((item) => getMangaSubtype(item) === subtype);
export const getHDThumbnail = (url: string) => {
  if (!url) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `https://layarkaca21.org${url}`; 
  return url.split('?')[0];
};
export const getSafeEmbedUrl = (url: string) => !url ? '' : url.startsWith('//') ? `https:${url}` : url;

export async function getRandomMedia(type: 'anime' | 'manga' | 'movie' | 'donghua'): Promise<{ slug: string }> {
  try {
    let items: GenericMediaItem[] = [];
    if (type === 'anime') {
      const [schedule, ongoing] = await Promise.all([anime.getSchedule(), getOngoingAnime(1)]);
      const scheduledItems = schedule.flatMap((day) => day.anime_list ?? []);
      items = scheduledItems.length > 0 ? scheduledItems : ongoing;
    }
    else if (type === 'manga') items = (await manga.getPopular()).comics;
    else if (type === 'movie') items = await movie.getHome('popular');
    else items = (await donghua.getHome()).ongoing_series;
    const rand = items[Math.floor(Math.random() * items.length)];
    return { slug: type === 'manga' ? extractSlugFromUrl(rand.link || '') : rand.slug || '' };
  } catch { return { slug: '' }; }
}

export async function getJikanEnrichment(type: 'anime' | 'manga', title: string): Promise<JikanEnrichment | null> {
  try {
    const data = await fetchJson<{data: Record<string, unknown>[] }>(`${API_CONFIG.J}/${type}?q=${encodeURIComponent(title)}&limit=1`);
    const item = data.data?.[0];
    if (!item) return null;
    
    // Helper to safely extract arrays of objects with a name property
    const extractNames = (arr: unknown): string[] => {
        if (Array.isArray(arr)) {
            return arr.map((x: Record<string, unknown>) => x.name as string).filter(Boolean);
        }
        return [];
    };

    return {
      malId: item.mal_id as number,
      score: item.score as number, 
      rank: item.rank as number, 
      popularity: item.popularity as number, 
      synopsis: item.synopsis as string, 
      trailer_url: (item.trailer as Record<string, unknown>)?.url as string,
      status: item.status as string, 
      source: item.source as string, 
      rating: item.rating as string, 
      year: item.year as number | null, 
      season: item.season as string,
      genres: extractNames(item.genres), 
      themes: extractNames(item.themes),
      studios: extractNames(item.studios), 
      title: item.title as string, 
      url: item.url as string, 
      mediaType: type,
      chapters: item.chapters as number | null, 
      episodes: item.episodes as number | null
    };
  } catch { return null; }
}

export async function getAnimeCast(malId: number): Promise<AnimeCastMember[]> {
  return withRuntimeCache(`jikan:anime-cast:${malId}`, CACHE_TTL.long, async () => {
    try {
      const data = await fetchJson<{
        data?: Array<{
          role?: string;
          favorites?: number;
          character?: {
            mal_id?: number;
            name?: string;
            images?: {
              webp?: { image_url?: string };
              jpg?: { image_url?: string };
            };
          };
          voice_actors?: Array<{
            language?: string;
            person?: {
              name?: string;
            };
          }>;
        }>;
      }>(`${API_CONFIG.J}/anime/${malId}/characters`);

      return (data.data ?? [])
        .sort((left, right) => {
          const roleScore = (entry: { role?: string }) => (entry.role === 'Main' ? 2 : entry.role === 'Supporting' ? 1 : 0);
          return roleScore(right) - roleScore(left) || (right.favorites ?? 0) - (left.favorites ?? 0);
        })
        .map((entry, index) => {
          const japaneseVoiceActor =
            entry.voice_actors?.find((voiceActor) => voiceActor.language === 'Japanese') ??
            entry.voice_actors?.[0];

          return {
            id: entry.character?.mal_id ?? index + 1,
            name: entry.character?.name ?? 'Unknown Character',
            role: entry.role ?? 'Cast',
            image: entry.character?.images?.webp?.image_url || entry.character?.images?.jpg?.image_url,
            voiceActor: japaneseVoiceActor?.person?.name,
            voiceActorLanguage: japaneseVoiceActor?.language,
          };
        })
        .filter((entry) => entry.name)
        .slice(0, 6);
    } catch {
      return [];
    }
  });
}
