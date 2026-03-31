type MediaProvider = 'sanka' | 'kanata-movie';

export type SankaUseCase =
  | 'anime_home'
  | 'anime_detail'
  | 'anime_episode'
  | 'anime_batch'
  | 'anime_search'
  | 'anime_completed'
  | 'anime_list'
  | 'anime_schedule'
  | 'anime_genres'
  | 'anime_genre'
  | 'donghua_home'
  | 'donghua_detail'
  | 'donghua_episode'
  | 'donghua_search'
  | 'comic_popular'
  | 'comic_latest'
  | 'comic_search'
  | 'comic_detail'
  | 'comic_chapter'
  | 'comic_genre'
  | 'drachin_home'
  | 'drachin_detail'
  | 'drachin_episode'
  | 'drachin_search'
  | 'dramabox_latest'
  | 'dramabox_trending'
  | 'dramabox_search'
  | 'dramabox_detail'
  | 'dramabox_stream'
  | 'animasu_movies'
  | 'animasu_detail'
  | 'animasu_episode'
  | 'kusonime_detail'
  | 'oploverz_episode'
  | 'stream_episode';

export type KanataMovieUseCase =
  | 'movie_home'
  | 'movie_search'
  | 'movie_detail'
  | 'movie_stream'
  | 'movie_genre';

type MediaContract<TUseCase extends string> = {
  provider: MediaProvider;
  useCase: TUseCase;
  endpoint: string;
  payload: string;
  notes: string;
};

export type SankaProviderContract = MediaContract<SankaUseCase> & {
  provider: 'sanka';
};

export type KanataMovieProviderContract = MediaContract<KanataMovieUseCase> & {
  provider: 'kanata-movie';
};

export const SANKA_BASE_URL = 'https://www.sankavollerei.com';
export const KANATA_MOVIE_BASE_URL = 'https://api.kanata.web.id/movietube';

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

function buildKanataHeaders(): HeadersInit {
  return {
    Accept: 'application/json, text/plain, */*',
  };
}

export const SANKA_PROVIDER_MATRIX: Record<SankaUseCase, SankaProviderContract> = {
  anime_home: {
    provider: 'sanka',
    useCase: 'anime_home',
    endpoint: '/anime/samehadaku/home',
    payload: 'Anime home rails and recent releases.',
    notes: 'Primary anime home feed.',
  },
  anime_detail: {
    provider: 'sanka',
    useCase: 'anime_detail',
    endpoint: '/anime/samehadaku/anime/:slug',
    payload: 'Anime detail with metadata, episode list, and batch list.',
    notes: 'Primary anime detail contract.',
  },
  anime_episode: {
    provider: 'sanka',
    useCase: 'anime_episode',
    endpoint: '/anime/samehadaku/episode/:slug',
    payload: 'Anime playback payload with mirrors, downloads, and episode navigation.',
    notes: 'Primary anime playback contract.',
  },
  anime_batch: {
    provider: 'sanka',
    useCase: 'anime_batch',
    endpoint: '/anime/samehadaku/batch/:slug',
    payload: 'Batch download payload for anime.',
    notes: 'Primary anime batch contract.',
  },
  anime_search: {
    provider: 'sanka',
    useCase: 'anime_search',
    endpoint: '/anime/samehadaku/search?q=:query',
    payload: 'Anime search list.',
    notes: 'Primary anime search contract.',
  },
  anime_completed: {
    provider: 'sanka',
    useCase: 'anime_completed',
    endpoint: '/anime/samehadaku/completed?page=:page',
    payload: 'Completed anime pagination list.',
    notes: 'Primary completed anime feed.',
  },
  anime_list: {
    provider: 'sanka',
    useCase: 'anime_list',
    endpoint: '/anime/samehadaku/list',
    payload: 'A-Z anime index list.',
    notes: 'Primary anime index feed.',
  },
  anime_schedule: {
    provider: 'sanka',
    useCase: 'anime_schedule',
    endpoint: '/anime/samehadaku/schedule',
    payload: 'Anime schedule grouped by day.',
    notes: 'Primary anime schedule feed.',
  },
  anime_genres: {
    provider: 'sanka',
    useCase: 'anime_genres',
    endpoint: '/anime/samehadaku/genres',
    payload: 'Anime genre list.',
    notes: 'Primary anime genre directory.',
  },
  anime_genre: {
    provider: 'sanka',
    useCase: 'anime_genre',
    endpoint: '/anime/samehadaku/genres/:slug?page=:page',
    payload: 'Anime cards filtered by genre.',
    notes: 'Primary anime genre feed.',
  },
  donghua_home: {
    provider: 'sanka',
    useCase: 'donghua_home',
    endpoint: '/anime/donghua/home/1',
    payload: 'Donghua home rails and ongoing list.',
    notes: 'Primary donghua home feed.',
  },
  donghua_detail: {
    provider: 'sanka',
    useCase: 'donghua_detail',
    endpoint: '/anime/donghua/detail/:slug',
    payload: 'Donghua detail with synopsis and episode guide.',
    notes: 'Primary donghua detail contract.',
  },
  donghua_episode: {
    provider: 'sanka',
    useCase: 'donghua_episode',
    endpoint: '/anime/donghua/episode/:slug',
    payload: 'Donghua playback payload with streaming and navigation.',
    notes: 'Primary donghua playback contract.',
  },
  donghua_search: {
    provider: 'sanka',
    useCase: 'donghua_search',
    endpoint: '/anime/donghua/search/:keyword/1',
    payload: 'Donghua search results.',
    notes: 'Primary donghua search feed.',
  },
  comic_popular: {
    provider: 'sanka',
    useCase: 'comic_popular',
    endpoint: '/comic/populer',
    payload: 'Cross-comic popular list.',
    notes: 'Primary comic popular feed for manga/manhwa/manhua.',
  },
  comic_latest: {
    provider: 'sanka',
    useCase: 'comic_latest',
    endpoint: '/comic/terbaru?page=:page&limit=:limit',
    payload: 'Latest comic updates list.',
    notes: 'Primary comic latest feed.',
  },
  comic_search: {
    provider: 'sanka',
    useCase: 'comic_search',
    endpoint: '/comic/search?q=:query&page=:page',
    payload: 'Comic search results.',
    notes: 'Primary comic search feed.',
  },
  comic_detail: {
    provider: 'sanka',
    useCase: 'comic_detail',
    endpoint: '/comic/comic/:slug',
    payload: 'Comic detail with metadata, chapters, and similar titles.',
    notes: 'Primary comic detail contract.',
  },
  comic_chapter: {
    provider: 'sanka',
    useCase: 'comic_chapter',
    endpoint: '/comic/chapter/:slug',
    payload: 'Comic reader chapter payload with images and navigation.',
    notes: 'Primary comic chapter contract.',
  },
  comic_genre: {
    provider: 'sanka',
    useCase: 'comic_genre',
    endpoint: '/comic/genre/:slug?page=:page',
    payload: 'Comic list filtered by genre.',
    notes: 'Primary comic genre feed.',
  },
  drachin_home: {
    provider: 'sanka',
    useCase: 'drachin_home',
    endpoint: '/anime/drachin/home',
    payload: 'Vertical drama home feed.',
    notes: 'Primary Drachin catalog feed.',
  },
  drachin_detail: {
    provider: 'sanka',
    useCase: 'drachin_detail',
    endpoint: '/anime/drachin/detail/:slug',
    payload: 'Vertical drama detail and episode guide.',
    notes: 'Primary Drachin detail contract.',
  },
  drachin_episode: {
    provider: 'sanka',
    useCase: 'drachin_episode',
    endpoint: '/anime/drachin/episode/:slug?index=:index',
    payload: 'Vertical drama episode playback payload.',
    notes: 'Primary Drachin playback contract.',
  },
  drachin_search: {
    provider: 'sanka',
    useCase: 'drachin_search',
    endpoint: '/anime/drachin/search/:query',
    payload: 'Vertical drama search results.',
    notes: 'Primary Drachin search feed.',
  },
  dramabox_latest: {
    provider: 'sanka',
    useCase: 'dramabox_latest',
    endpoint: '/anime/dramabox/latest?page=1',
    payload: 'DramaBox latest vertical drama cards.',
    notes: 'Primary DramaBox latest feed.',
  },
  dramabox_trending: {
    provider: 'sanka',
    useCase: 'dramabox_trending',
    endpoint: '/anime/dramabox/trending',
    payload: 'DramaBox trending cards.',
    notes: 'Primary DramaBox trending feed.',
  },
  dramabox_search: {
    provider: 'sanka',
    useCase: 'dramabox_search',
    endpoint: '/anime/dramabox/search?q=:query',
    payload: 'DramaBox search results.',
    notes: 'Primary DramaBox search feed.',
  },
  dramabox_detail: {
    provider: 'sanka',
    useCase: 'dramabox_detail',
    endpoint: '/anime/dramabox/detail?bookId=:bookId',
    payload: 'DramaBox detail payload.',
    notes: 'Currently unstable; best-effort only.',
  },
  dramabox_stream: {
    provider: 'sanka',
    useCase: 'dramabox_stream',
    endpoint: '/anime/dramabox/stream?bookId=:bookId&episode=:episode',
    payload: 'DramaBox playback payload.',
    notes: 'Currently unstable; best-effort only.',
  },
  animasu_movies: {
    provider: 'sanka',
    useCase: 'animasu_movies',
    endpoint: '/anime/animasu/movies?page=1',
    payload: 'Anime-movie catalog cards.',
    notes: 'Useful for anime-movie surfaces, not general movie.',
  },
  animasu_detail: {
    provider: 'sanka',
    useCase: 'animasu_detail',
    endpoint: '/anime/animasu/detail/:slug',
    payload: 'Anime-movie detail payload.',
    notes: 'Rich for anime-movie titles.',
  },
  animasu_episode: {
    provider: 'sanka',
    useCase: 'animasu_episode',
    endpoint: '/anime/animasu/episode/:slug',
    payload: 'Anime-movie playback payload.',
    notes: 'Stream-heavy, download support varies.',
  },
  kusonime_detail: {
    provider: 'sanka',
    useCase: 'kusonime_detail',
    endpoint: '/anime/kusonime/detail/:slug',
    payload: 'Batch-heavy anime detail payload.',
    notes: 'Useful as anime download enrichment.',
  },
  oploverz_episode: {
    provider: 'sanka',
    useCase: 'oploverz_episode',
    endpoint: '/anime/oploverz/episode/:slug',
    payload: 'Episode playback payload with mirrors and downloads.',
    notes: 'Useful as anime playback enrichment.',
  },
  stream_episode: {
    provider: 'sanka',
    useCase: 'stream_episode',
    endpoint: '/anime/stream/episode/:slug',
    payload: 'Fallback direct stream links.',
    notes: 'Useful as anime fallback playback enrichment.',
  },
};

export const KANATA_MOVIE_PROVIDER_MATRIX: Record<KanataMovieUseCase, KanataMovieProviderContract> = {
  movie_home: {
    provider: 'kanata-movie',
    useCase: 'movie_home',
    endpoint: '/home?section=:section',
    payload: 'Movie home sections such as popular/latest/trending.',
    notes: 'Current general movie home feed.',
  },
  movie_search: {
    provider: 'kanata-movie',
    useCase: 'movie_search',
    endpoint: '/search?q=:query&page=:page',
    payload: 'Movie search result cards.',
    notes: 'Current general movie search feed.',
  },
  movie_detail: {
    provider: 'kanata-movie',
    useCase: 'movie_detail',
    endpoint: '/detail/:slug?type=:type',
    payload: 'Movie detail payload.',
    notes: 'Current general movie detail contract.',
  },
  movie_stream: {
    provider: 'kanata-movie',
    useCase: 'movie_stream',
    endpoint: '/stream?id=:id&type=:type',
    payload: 'Movie playback payload or stream URL.',
    notes: 'Current general movie stream contract.',
  },
  movie_genre: {
    provider: 'kanata-movie',
    useCase: 'movie_genre',
    endpoint: '/genre/:slug?page=:page',
    payload: 'Movie cards filtered by genre.',
    notes: 'Current general movie genre feed.',
  },
};

export function buildSankaUrl(path: string): string {
  return `${SANKA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildKanataMovieUrl(path: string): string {
  return `${KANATA_MOVIE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildMediaUrl(provider: MediaProvider, path: string): string {
  switch (provider) {
    case 'sanka':
      return buildSankaUrl(path);
    case 'kanata-movie':
      return buildKanataMovieUrl(path);
    default:
      return path;
  }
}

function buildMediaHeaders(provider: MediaProvider): HeadersInit {
  switch (provider) {
    case 'sanka':
      return buildSankaHeaders();
    case 'kanata-movie':
      return buildKanataHeaders();
    default:
      return { Accept: 'application/json, text/plain, */*' };
  }
}

export async function fetchMediaJson<T>(provider: MediaProvider, path: string): Promise<T> {
  const response = await fetch(buildMediaUrl(provider, path), {
    headers: buildMediaHeaders(provider),
  });

  if (!response.ok) {
    throw new Error(`${provider} request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSankaJson<T>(path: string): Promise<T> {
  return fetchMediaJson<T>('sanka', path);
}

export async function fetchKanataMovieJson<T>(path: string): Promise<T> {
  return fetchMediaJson<T>('kanata-movie', path);
}
