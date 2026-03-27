import { buildSankaUrl, fetchSankaJson } from '@/lib/media';
import {
  readSnapshotDomainFile,
  readSnapshotPlayback,
  readSnapshotTitle,
  searchSnapshotDomain,
} from '@/lib/runtime-snapshot';
import type { AnichinDetail, AnichinDonghua, AnichinHomeResult, KanataEpisodeDetail } from '@/lib/types';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type DonghuaHomeSnapshot = {
  latest_updates: AnichinDonghua[];
  ongoing_series: AnichinDonghua[];
};

const runtimeCache = new Map<string, CacheEntry>();
const inflightCache = new Map<string, Promise<unknown>>();
const CACHE_TTL = {
  short: 1000 * 60 * 5,
  medium: 1000 * 60 * 15,
} as const;

function extractSlugFromUrl(url: string): string {
  return url ? url.split('/').filter(Boolean).pop() || '' : '';
}

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
      runtimeCache.set(key, { expiresAt: now + ttlMs, value });
      return value;
    })
    .finally(() => {
      inflightCache.delete(key);
    });

  inflightCache.set(key, pending as Promise<unknown>);
  return pending;
}

export const getDonghuaHome = () =>
  withRuntimeCache('donghua:home', CACHE_TTL.medium, async (): Promise<AnichinHomeResult> => {
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

    const latest_updates = (payload.latest_release || [])
      .map((item) => ({
        title: item.title || '',
        slug: extractSlugFromUrl(item.slug || ''),
        thumb: item.poster || '',
        episode: item.current_episode || '',
        image: item.poster || '',
        status: item.status || '',
        type: item.type || 'Donghua',
      }))
      .filter((item) => item.slug && item.title);

    const ongoing_series = (payload.ongoing_series || [])
      .map((item) => ({
        title: item.title || '',
        slug: extractSlugFromUrl(item.slug || ''),
        thumb: item.poster || '',
        episode: item.episode || item.current_episode || '',
        image: item.poster || '',
        status: item.status || '',
        type: item.type || 'Donghua',
      }))
      .filter((item) => item.slug && item.title);

    return { latest_updates, ongoing_series };
  });

export async function getDonghuaDetail(slug: string): Promise<AnichinDetail> {
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
    episodes: (payload.episodes_list || [])
      .map((entry) => ({
        slug: extractSlugFromUrl(entry.slug || ''),
        title: entry.title || entry.episode || '',
        episode: entry.episode || '',
        date: entry.date || '',
      }))
      .filter((entry) => entry.slug && entry.title),
    synopsis: payload.synopsis || '',
    thumb: payload.poster || '',
    genres: (payload.genres || []).map((genre) => genre.name || '').filter(Boolean),
  };
}

export async function searchDonghua(query: string): Promise<AnichinDonghua[]> {
  const snapshot = await searchSnapshotDomain<AnichinDonghua>('donghua', query, 24);
  if (snapshot.length > 0) {
    return snapshot;
  }

  const payload = await fetchSankaJson<{
    data?: Array<{
      title?: string;
      slug?: string;
      poster?: string;
      status?: string;
      type?: string;
    }>;
  }>(`/anime/donghua/search/${encodeURIComponent(query)}/1`);

  return (payload.data || [])
    .map((item) => ({
      title: item.title || '',
      slug: extractSlugFromUrl(item.slug || ''),
      thumb: item.poster || '',
      episode: '',
      image: item.poster || '',
      status: item.status || '',
      type: item.type || 'Donghua',
    }))
    .filter((item) => item.slug && item.title);
}

export async function getDonghuaEpisode(slug: string): Promise<KanataEpisodeDetail> {
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

  return {
    title: payload.episode || slug,
    default_embed: payload.streaming?.main_url || mirrors[0]?.embed_url || '',
    mirrors,
    slug,
    navigation: {
      next: extractSlugFromUrl(payload.navigation?.next_episode || ''),
      prev: extractSlugFromUrl(payload.navigation?.previous_episode || ''),
      anime_info: extractSlugFromUrl(payload.donghua_details?.slug || payload.navigation?.all_episodes || ''),
    },
  };
}

export const getDonghuaWatch = getDonghuaEpisode;
export const donghua = {
  getHome: getDonghuaHome,
  getDetail: getDonghuaDetail,
  search: searchDonghua,
  getEpisode: getDonghuaEpisode,
  getWatch: getDonghuaWatch,
};

export const getSafeEmbedUrl = (url: string) => (!url ? '' : url.startsWith('//') ? `https:${url}` : url);
export const getDonghuaExternalUrl = (slug: string) => buildSankaUrl(`/anime/donghua/detail/${slug}`);
