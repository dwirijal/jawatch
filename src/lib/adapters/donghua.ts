import { fetchKanataAnichinJson } from '@/lib/media';
import type {
  AnichinDetail,
  AnichinDonghua,
  AnichinHomeResult,
  AnimeSchedule,
  KanataAnime,
  KanataEpisodeDetail,
} from '@/lib/types';

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type KanataDonghuaCardPayload = {
  title?: string;
  slug?: string;
  thumb?: string;
  image?: string;
  poster?: string;
  status?: string;
  episode?: string;
  current_episode?: string;
  type?: string;
  href?: string;
  link?: string;
  url?: string;
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

function deriveDonghuaSeriesSlugFromEpisodeSlug(slug: string): string {
  return slug.replace(/-(episode|ep)-.+$/i, '').trim();
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

function normalizeDonghuaCard(
  item: KanataDonghuaCardPayload,
  options?: { defaultLink?: 'detail' | 'episode'; overrideTitle?: string }
): AnichinDonghua | null {
  const rawSlug = String(item.slug || item.href || item.link || item.url || '');
  const slug = extractSlugFromUrl(rawSlug);
  const title = String(options?.overrideTitle || item.title || '').trim();
  if (!slug || !title) {
    return null;
  }

  const thumb = String(item.thumb || item.image || item.poster || '');
  const episode = String(item.episode || item.current_episode || '');
  const link =
    options?.defaultLink === 'episode'
      ? `/donghua/episode/${slug}`
      : options?.defaultLink === 'detail'
        ? `/donghua/${slug}`
        : undefined;

  return {
    title,
    slug,
    thumb,
    image: thumb,
    episode,
    status: String(item.status || ''),
    type: String(item.type || 'Donghua'),
    link,
  };
}

function normalizeDonghuaDetailEpisode(item: {
  title?: string;
  slug?: string;
  episode?: string;
  date?: string;
}): AnichinDetail['episodes'][number] | null {
  const slug = extractSlugFromUrl(item.slug || '');
  const title = String(item.title || item.episode || '').trim();
  if (!slug || !title) {
    return null;
  }

  return {
    slug,
    title,
    episode: String(item.episode || ''),
    date: String(item.date || ''),
  };
}

function createDonghuaFallbackDetail(item: AnichinDonghua): AnichinDetail {
  return {
    title: item.title,
    meta: {
      studio: 'Unknown',
      status: item.status || 'Unknown',
      episodes: 'Unknown',
      season: 'Unknown',
      country: 'China',
      network: 'Unknown',
      duration: 'Unknown',
      released: 'Unknown',
      updated_on: 'Temporarily unavailable',
    },
    episodes: [],
    synopsis:
      'This donghua detail is temporarily unavailable from the provider. Try again later or browse other titles from the hub.',
    thumb: item.thumb || item.image || '',
    genres: [],
  };
}

function resolveDonghuaNavigation(
  currentSlug: string,
  animeInfoSlug: string,
  episodes: AnichinDetail['episodes']
): KanataEpisodeDetail['navigation'] {
  const index = episodes.findIndex((item) => item.slug === currentSlug);
  if (index === -1) {
    return {
      prev: null,
      next: null,
      anime_info: animeInfoSlug,
    };
  }

  return {
    prev: episodes[index + 1]?.slug || null,
    next: episodes[index - 1]?.slug || null,
    anime_info: animeInfoSlug,
  };
}

function extractEpisodeLabel(title: string): string {
  const match = title.match(/\bepisode\s+([0-9]+(?:\.[0-9]+)?)\b/i);
  if (match?.[1]) {
    return `Ep ${match[1]}`;
  }

  return '';
}

export const getDonghuaHome = () =>
  withRuntimeCache('donghua:home', CACHE_TTL.medium, async (): Promise<AnichinHomeResult> => {
    const emptyHomePayload: { latest_updates?: KanataDonghuaCardPayload[]; latest?: KanataDonghuaCardPayload[] } = {};
    const [homePayload, ongoingPayload, completedPayload] = await Promise.all([
      fetchKanataAnichinJson<{
        latest_updates?: KanataDonghuaCardPayload[];
        latest?: KanataDonghuaCardPayload[];
      }>('/home').catch(() => emptyHomePayload),
      fetchKanataAnichinJson<KanataDonghuaCardPayload[] | { data?: KanataDonghuaCardPayload[] }>('/ongoing?page=1').catch(
        () => []
      ),
      fetchKanataAnichinJson<KanataDonghuaCardPayload[] | { data?: KanataDonghuaCardPayload[] }>('/completed?page=1').catch(
        () => []
      ),
    ]);

    const latestSource = homePayload.latest_updates || homePayload.latest || [];
    const ongoingSource = Array.isArray(ongoingPayload) ? ongoingPayload : ongoingPayload.data || [];
    const completedSource = Array.isArray(completedPayload) ? completedPayload : completedPayload.data || [];

    const latest_updates = latestSource
      .map((item: KanataDonghuaCardPayload) => {
        const normalized = normalizeDonghuaCard(item, { defaultLink: 'episode' });
        if (!normalized) {
          return null;
        }

        return {
          ...normalized,
          episode: normalized.episode || extractEpisodeLabel(normalized.title),
        };
      })
      .filter((item): item is AnichinDonghua => item !== null);

    const ongoing_series = ongoingSource
      .map((item: KanataDonghuaCardPayload) => normalizeDonghuaCard(item, { defaultLink: 'detail' }))
      .filter((item): item is AnichinDonghua => item !== null);

    const completed_series = completedSource
      .map((item: KanataDonghuaCardPayload) => normalizeDonghuaCard(item, { defaultLink: 'detail' }))
      .filter((item): item is AnichinDonghua => item !== null);

    return { latest_updates, ongoing_series, completed_series };
  });

async function findDonghuaCardBySlug(slug: string): Promise<AnichinDonghua | null> {
  const home = await getDonghuaHome().catch(() => null);
  const homeMatch = home ? home.ongoing_series.find((item) => item.slug === slug) || null : null;
  if (homeMatch) {
    return homeMatch;
  }

  const searchQuery = slug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (searchQuery.length < 2) {
    return null;
  }

  const searchResults = await searchDonghua(searchQuery).catch(() => []);
  return searchResults.find((item) => item.slug === slug) || null;
}

export async function getDonghuaDetail(slug: string): Promise<AnichinDetail | null> {
  try {
    const payload = await fetchKanataAnichinJson<{
      title?: string;
      poster?: string;
      image?: string;
      thumb?: string;
      synopsis?: string;
      description?: string;
      genres?: string[];
      episodes?: Array<{ slug?: string; title?: string; episode?: string; date?: string }>;
      meta?: {
        studio?: string;
        status?: string;
        episodes?: string;
        season?: string;
        country?: string;
        network?: string;
        duration?: string;
        released?: string;
        updated_on?: string;
      };
    }>(`/detail/${encodeURIComponent(slug)}`);

    const episodes = (payload.episodes || [])
      .map(normalizeDonghuaDetailEpisode)
      .filter((item): item is AnichinDetail['episodes'][number] => item !== null);

    return {
      title: payload.title || slug,
      meta: {
        studio: payload.meta?.studio || 'Unknown',
        status: payload.meta?.status || 'Unknown',
        episodes: payload.meta?.episodes || String(episodes.length || 0) || 'Unknown',
        season: payload.meta?.season || 'Unknown',
        country: payload.meta?.country || 'China',
        network: payload.meta?.network || 'Unknown',
        duration: payload.meta?.duration || 'Unknown',
        released: payload.meta?.released || 'Unknown',
        updated_on: payload.meta?.updated_on || 'Unknown',
      },
      episodes,
      synopsis: payload.synopsis || payload.description || '',
      thumb: payload.poster || payload.image || payload.thumb || '',
      genres: (payload.genres || []).filter(Boolean),
    };
  } catch {
    const fallback = await findDonghuaCardBySlug(slug);
    if (!fallback) {
      return null;
    }
    return createDonghuaFallbackDetail(fallback);
  }
}

export async function searchDonghua(query: string): Promise<AnichinDonghua[]> {
  const payload = await fetchKanataAnichinJson<KanataDonghuaCardPayload[] | { data?: KanataDonghuaCardPayload[] }>(
    `/search?q=${encodeURIComponent(query)}`
  );

  const items = Array.isArray(payload) ? payload : payload.data || [];
  return items
    .map((item) => normalizeDonghuaCard(item, { defaultLink: 'detail' }))
    .filter((item): item is AnichinDonghua => item !== null);
}

export async function getDonghuaEpisode(slug: string): Promise<KanataEpisodeDetail> {
  const payload = await fetchKanataAnichinJson<{
    title?: string;
    servers?: Array<{ name?: string; src?: string }>;
    hls_url?: string;
  }>(`/episode/${encodeURIComponent(slug)}`);

  const mirrors = [
    ...(payload.hls_url
      ? [
          {
            label: 'HLS',
            embed_url: payload.hls_url,
          },
        ]
      : []),
    ...((payload.servers || [])
      .map((server) => ({
        label: String(server.name || 'Source').trim() || 'Source',
        embed_url: String(server.src || '').trim(),
      }))
      .filter((server) => server.embed_url)),
  ];

  const animeInfoSlug = deriveDonghuaSeriesSlugFromEpisodeSlug(slug);
  const donghuaDetail = animeInfoSlug ? await getDonghuaDetail(animeInfoSlug).catch(() => null) : null;
  const navigation = resolveDonghuaNavigation(slug, animeInfoSlug, donghuaDetail?.episodes || []);

  return {
    title: payload.title || slug,
    default_embed: payload.hls_url || mirrors[0]?.embed_url || '',
    mirrors,
    slug,
    navigation,
  };
}

export async function getDonghuaSchedule(): Promise<AnimeSchedule[]> {
  const payload = await fetchKanataAnichinJson<Array<{ day?: string; animeList?: KanataDonghuaCardPayload[] }>>('/schedule');

  return (payload || [])
    .map((entry) => {
      const day = String(entry.day || '').trim();
      const anime_list = (entry.animeList || [])
        .map((item) => {
          const normalized = normalizeDonghuaCard(item, { defaultLink: 'detail' });
          if (!normalized) {
            return null;
          }

          return {
            title: normalized.title,
            slug: normalized.slug,
            thumb: normalized.thumb,
            episode: normalized.episode || normalized.status || '',
            type: normalized.type || 'Donghua',
            status: normalized.status || '',
          };
        })
        .filter((item): item is KanataAnime => item !== null);

      return day && anime_list.length > 0 ? { day, anime_list } : null;
    })
    .filter((item): item is AnimeSchedule => item !== null);
}

export const donghua = {
  getHome: getDonghuaHome,
  getSchedule: getDonghuaSchedule,
  getDetail: getDonghuaDetail,
  search: searchDonghua,
  getEpisode: getDonghuaEpisode,
};
