import { withCloudflareEdgeCache } from './cloudflare-cache';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from './runtime-snapshot';
import { fetchSankaJson } from './sanka';

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

// --- CORE OBJECTS ---

export const anime = {
  getDetail: async (slug: string): Promise<KanataAnimeDetail> => {
    try {
      const data = await fetchJson<KanataAnimeDetail>(`${API_CONFIG.A}/anime/${slug}`, {
        edgeCacheKey: `detail:anime:legacy:${slug}:animasu`,
        edgeCacheTtlSeconds: 1800,
      });
      if (data && data.title) return { ...data, provider: 'animasu' };
      throw new Error();
    } catch {
      const data = await fetchJson<KanataAnimeDetail>(`${API_CONFIG.O}/anime/${slug}`, {
        edgeCacheKey: `detail:anime:legacy:${slug}:otakudesu`,
        edgeCacheTtlSeconds: 1800,
      });
      return { ...data, provider: 'otakudesu' };
    }
  },
  getEpisode: (slug: string, p: 'animasu' | 'otakudesu' = 'animasu') => fetchJson<KanataEpisodeDetail>(`${p === 'otakudesu' ? API_CONFIG.O : API_CONFIG.A}/episode/${slug}`, {
    edgeCacheKey: `playback:anime:legacy:${slug}:${p}`,
    edgeCacheTtlSeconds: 300,
  }),
  search: async (query: string) => {
    const trimmed = query.trim().toLowerCase();
    return (await fetchJson<{result?: KanataAnime[]}>(`${API_CONFIG.S}?query=${encodeURIComponent(query)}`, {
      edgeCacheKey: `search:anime:${trimmed}`,
      edgeCacheTtlSeconds: 300,
    })).result || [];
  },
  getSchedule: () => withRuntimeCache('anime:schedule', CACHE_TTL.medium, () => fetchJson<AnimeSchedule[]>(`${API_CONFIG.A}/schedule`, {
    edgeCacheKey: 'home:anime:schedule',
    edgeCacheTtlSeconds: 900,
  })),
  getCompleted: (page = 1) => fetchJson<KanataCompletedAnime[]>(`${API_CONFIG.O}/complete?page=${page}`),
  getList: () => fetchJson<AnimeListGroup[]>(`${API_CONFIG.O}/anime-list`),
  getBatch: (slug: string) => fetchJson<KanataAnimeBatch>(`${API_CONFIG.O}/batch/${slug}`),
  getGenres: () => fetchJson<KanataGenre[]>(`${API_CONFIG.A}/genres`),
  getGenre: (g: string, p = 1) => fetchJson<KanataAnime[]>(`${API_CONFIG.A}/genres/${g}?page=${p}`),
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
          (['manga', 'manhwa', 'manhua'] as const).map((domain) =>
            searchSnapshotDomain<MangaSearchResult>(domain, q, 24)
          )
        )
      ).flat();
      if (snapshotResults.length > 0) {
        return { data: snapshotResults };
      }
    }
    return fetchJson<{data: MangaSearchResult[]}>(`${API_CONFIG.M}/search?q=${encodeURIComponent(q)}&page=${p}`, {
      edgeCacheKey: `search:manga:${q.trim().toLowerCase()}:${p}`,
      edgeCacheTtlSeconds: 300,
    });
  },
  getDetail: async (slug: string) => {
    for (const domain of ['manga', 'manhwa', 'manhua'] as const) {
      const snapshot = await readSnapshotTitle<MangaDetail>(domain, slug);
      if (snapshot) {
        return snapshot;
      }
    }
    return fetchJson<MangaDetail>(`${API_CONFIG.M}/detail?slug=${slug}`, {
      edgeCacheKey: `detail:manga:${slug}`,
      edgeCacheTtlSeconds: 1800,
    });
  },
  getChapter: async (seg: string) => {
    for (const domain of ['manga', 'manhwa', 'manhua'] as const) {
      const snapshot = await readSnapshotPlayback<ChapterDetail>(domain, seg);
      if (snapshot) {
        return snapshot;
      }
    }
    return fetchJson<ChapterDetail>(`${API_CONFIG.M}/chapter?segment=${seg}`, {
      edgeCacheKey: `playback:manga:${seg}`,
      edgeCacheTtlSeconds: 300,
    });
  },
  getPopular: () => withRuntimeCache('manga:popular', CACHE_TTL.medium, async () => {
    const snapshotResults = (
      await Promise.all(
        (['manga', 'manhwa', 'manhua'] as const).map(async (domain) => {
          const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
          return snapshot?.popular || [];
        })
      )
    ).flat();
    if (snapshotResults.length > 0) {
      return { comics: snapshotResults };
    }
    return fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/populer`, {
      edgeCacheKey: 'home:manga:popular',
      edgeCacheTtlSeconds: 900,
    });
  }),
  getNew: (p = 1, l = 10) => withRuntimeCache(`manga:new:${p}:${l}`, CACHE_TTL.medium, async () => {
    if (p === 1) {
      const snapshotResults = (
        await Promise.all(
          (['manga', 'manhwa', 'manhua'] as const).map(async (domain) => {
            const snapshot = await readSnapshotDomainFile<ReadingHomeSnapshot>(domain, 'home.json');
            return snapshot?.newest || [];
          })
        )
      ).flat();
      if (snapshotResults.length > 0) {
        return { comics: snapshotResults.slice(0, l) };
      }
    }
    return fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/terbaru?page=${p}&limit=${l}`, {
      edgeCacheKey: `home:manga:new:${p}:${l}`,
      edgeCacheTtlSeconds: 900,
    });
  }),
  getRecommendations: (slug: string) => fetchJson<{recommendations: MangaSearchResult[]}>(`${API_CONFIG.M}/rekomendasi?based_on=${slug}`, {
    edgeCacheKey: `detail:manga:recommendations:${slug}`,
    edgeCacheTtlSeconds: 1800,
  }),
  getByGenre: (g: string, p = 1) => fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/genre?genre=${g}&page=${p}`, {
    edgeCacheKey: `home:manga:genre:${g.trim().toLowerCase()}:${p}`,
    edgeCacheTtlSeconds: 900,
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

export const getOngoingAnime = async (page = 1): Promise<KanataAnime[]> => {
  const schedule = await anime.getSchedule();
  return schedule.flatMap((day) => day.anime_list ?? []).slice((page - 1) * 12, page * 12 || undefined);
};

// --- INTERFACES ---
export interface GenericMediaItem { slug: string; title: string; thumb?: string; image?: string; thumbnail?: string; poster?: string; episode?: string; chapter?: string; year?: string; status?: string; type?: string; link?: string; }
export type MangaSubtype = 'manga' | 'manhwa' | 'manhua';
export interface MangaSearchResult { title: string; altTitle: string | null; slug: string; href: string; thumbnail: string; type: string; genre: string; description: string; chapter?: string; time_ago?: string; link: string; image: string; }
export interface MangaChapter { chapter: string; slug: string; link: string; date: string; }
export interface MangaDetail { creator: string; slug: string; title: string; title_indonesian: string; image: string; synopsis: string; synopsis_full: string; summary: string; background_story: string; metadata: { type: string; author: string; status: string; concept: string; age_rating: string; reading_direction: string; }; genres: Array<{ name: string; slug: string; link: string }>; chapters: MangaChapter[]; similar_manga: Array<{ title: string; slug: string; link: string; image: string; type: string; description: string }>; }
export interface ChapterDetail { title: string; manga_title?: string; chapter_title?: string; images: string[]; navigation: { next: string | null; prev: string | null; nextChapter?: string | null; previousChapter?: string | null; }; }
export interface KanataAnimeDetail { title: string; alternative_title: string; status: string; type: string; synopsis: string; thumb: string; genres: string[]; episodes: Array<{ title: string; slug: string; date: string }>; studio: string; rating: string; total_episodes: string; download?: Array<{ quality: string; url: string[] }>; provider?: 'animasu' | 'otakudesu'; }
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
    if (type === 'anime') items = (await anime.getSchedule())[0].anime_list;
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
