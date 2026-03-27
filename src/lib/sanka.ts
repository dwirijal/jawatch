type SankaUseCase =
  | 'anime_home'
  | 'anime_detail'
  | 'anime_episode'
  | 'anime_batch'
  | 'drachin_home'
  | 'drachin_detail'
  | 'drachin_episode'
  | 'drachin_search'
  | 'dramabox_latest'
  | 'dramabox_trending'
  | 'dramabox_search'
  | 'dramabox_detail'
  | 'dramabox_stream'
  | 'donghua_home'
  | 'donghua_detail'
  | 'donghua_episode'
  | 'donghua_search'
  | 'animasu_movies'
  | 'animasu_detail'
  | 'animasu_episode'
  | 'kusonime_detail'
  | 'oploverz_episode'
  | 'stream_episode';

type SankaProviderContract = {
  useCase: SankaUseCase;
  provider: 'samehadaku' | 'donghua' | 'drachin' | 'dramabox' | 'animasu' | 'kusonime' | 'oploverz' | 'stream';
  endpoint: string;
  notes: string;
};

const SANKA_BASE_URL = 'https://www.sankavollerei.com';

function buildSankaHeaders(): HeadersInit {
  const baseHeaders: HeadersInit = {
    Accept: 'application/json, text/plain, */*',
  };

  if (typeof window !== 'undefined') {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${SANKA_BASE_URL}/anime/`,
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  };
}

export const SANKA_PROVIDER_MATRIX: Record<SankaUseCase, SankaProviderContract> = {
  anime_home: {
    useCase: 'anime_home',
    provider: 'samehadaku',
    endpoint: '/anime/samehadaku/home',
    notes: 'Anime home with rich recent/popular rails.',
  },
  anime_detail: {
    useCase: 'anime_detail',
    provider: 'samehadaku',
    endpoint: '/anime/samehadaku/anime/:slug',
    notes: 'Best anime detail payload: metadata, trailer, episode list, batch list.',
  },
  anime_episode: {
    useCase: 'anime_episode',
    provider: 'samehadaku',
    endpoint: '/anime/samehadaku/episode/:slug',
    notes: 'Best episodic anime payload: stream servers per quality and download groups.',
  },
  anime_batch: {
    useCase: 'anime_batch',
    provider: 'samehadaku',
    endpoint: '/anime/samehadaku/batch/:slug',
    notes: 'Batch download payload for anime.',
  },
  drachin_home: {
    useCase: 'drachin_home',
    provider: 'drachin',
    endpoint: '/anime/drachin/home',
    notes: 'Short drama home payload with featured slider and fresh catalog cards.',
  },
  drachin_detail: {
    useCase: 'drachin_detail',
    provider: 'drachin',
    endpoint: '/anime/drachin/detail/:slug',
    notes: 'Drachin detail payload with synopsis, tags, and full episode guide.',
  },
  drachin_episode: {
    useCase: 'drachin_episode',
    provider: 'drachin',
    endpoint: '/anime/drachin/episode/:slug?index=:index',
    notes: 'Direct MP4 episode payload with multiple quality tiers.',
  },
  drachin_search: {
    useCase: 'drachin_search',
    provider: 'drachin',
    endpoint: '/anime/drachin/search/:query',
    notes: 'Search endpoint for Drachin titles.',
  },
  dramabox_latest: {
    useCase: 'dramabox_latest',
    provider: 'dramabox',
    endpoint: '/anime/dramabox/latest?page=1',
    notes: 'Latest short drama cards for DramaBox.',
  },
  dramabox_trending: {
    useCase: 'dramabox_trending',
    provider: 'dramabox',
    endpoint: '/anime/dramabox/trending',
    notes: 'Trending short drama cards for DramaBox.',
  },
  dramabox_search: {
    useCase: 'dramabox_search',
    provider: 'dramabox',
    endpoint: '/anime/dramabox/search?q=:query',
    notes: 'Search endpoint for DramaBox titles.',
  },
  dramabox_detail: {
    useCase: 'dramabox_detail',
    provider: 'dramabox',
    endpoint: '/anime/dramabox/detail?bookId=:bookId',
    notes: 'Detail endpoint for DramaBox. Currently unstable and should be treated as best-effort.',
  },
  dramabox_stream: {
    useCase: 'dramabox_stream',
    provider: 'dramabox',
    endpoint: '/anime/dramabox/stream?bookId=:bookId&episode=:episode',
    notes: 'Playback endpoint for DramaBox. Only wire this after detail parity is proven stable.',
  },
  donghua_home: {
    useCase: 'donghua_home',
    provider: 'donghua',
    endpoint: '/anime/donghua/home/1',
    notes: 'Donghua home payload with latest releases and ongoing list.',
  },
  donghua_detail: {
    useCase: 'donghua_detail',
    provider: 'donghua',
    endpoint: '/anime/donghua/detail/:slug',
    notes: 'Donghua detail with metadata, episode guide, and synopsis.',
  },
  donghua_episode: {
    useCase: 'donghua_episode',
    provider: 'donghua',
    endpoint: '/anime/donghua/episode/:slug',
    notes: 'Donghua episode with stream servers and quality-keyed downloads.',
  },
  donghua_search: {
    useCase: 'donghua_search',
    provider: 'donghua',
    endpoint: '/anime/donghua/search/:keyword/1',
    notes: 'Donghua search payload with direct series detail slugs.',
  },
  animasu_movies: {
    useCase: 'animasu_movies',
    provider: 'animasu',
    endpoint: '/anime/animasu/movies?page=1',
    notes: 'Movie/anime-movie catalog with poster and score-rich cards.',
  },
  animasu_detail: {
    useCase: 'animasu_detail',
    provider: 'animasu',
    endpoint: '/anime/animasu/detail/:slug',
    notes: 'Rich movie/anime detail with batches, characters, trailer, synopsis.',
  },
  animasu_episode: {
    useCase: 'animasu_episode',
    provider: 'animasu',
    endpoint: '/anime/animasu/episode/:slug',
    notes: 'Good stream-heavy payload, but download arrays can be empty.',
  },
  kusonime_detail: {
    useCase: 'kusonime_detail',
    provider: 'kusonime',
    endpoint: '/anime/kusonime/detail/:slug',
    notes: 'Strong batch download payload with many hosts.',
  },
  oploverz_episode: {
    useCase: 'oploverz_episode',
    provider: 'oploverz',
    endpoint: '/anime/oploverz/episode/:slug',
    notes: 'Strong per-episode download matrix and usable stream links.',
  },
  stream_episode: {
    useCase: 'stream_episode',
    provider: 'stream',
    endpoint: '/anime/stream/episode/:slug',
    notes: 'Lightweight fallback source for direct stream and download links.',
  },
};

export function buildSankaUrl(path: string): string {
  return `${SANKA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function fetchSankaJson<T>(path: string): Promise<T> {
  const response = await fetch(buildSankaUrl(path), {
    headers: buildSankaHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Sanka request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
