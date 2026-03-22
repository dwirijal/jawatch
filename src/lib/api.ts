/**
 * Secure & Standardized API Engine.
 */

const d = (s: string) => typeof window !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString();

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

async function fetchJson<T>(url: string | URL): Promise<T> {
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/**
 * Enrichment for Movie Posters using IMDB Search API.
 * Since MovieTube posters are unreliable, we fetch high-quality ones from IMDB.
 */
export async function getMovieMetadata(title: string): Promise<{ poster?: string; rating?: string; actors?: string }> {
  try {
    const data = await fetchJson<any>(`${API_CONFIG.IMDB}?q=${encodeURIComponent(title)}`);
    if (data.ok && data.description?.length > 0) {
      const top = data.description[0];
      return {
        poster: top['#IMG_POSTER'],
        rating: top['#RANK'] ? String(top['#RANK']) : undefined,
        actors: top['#ACTORS']
      };
    }
    return {};
  } catch {
    return {};
  }
}

// --- CORE OBJECTS ---

export const anime = {
  getDetail: async (slug: string): Promise<KanataAnimeDetail> => {
    try {
      const data = await fetchJson<KanataAnimeDetail>(`${API_CONFIG.A}/anime/${slug}`);
      if (data && data.title) return { ...data, provider: 'animasu' };
      throw new Error();
    } catch {
      const data = await fetchJson<KanataAnimeDetail>(`${API_CONFIG.O}/anime/${slug}`);
      return { ...data, provider: 'otakudesu' };
    }
  },
  getEpisode: (slug: string, p: 'animasu' | 'otakudesu' = 'animasu') => fetchJson<KanataEpisodeDetail>(`${p === 'otakudesu' ? API_CONFIG.O : API_CONFIG.A}/episode/${slug}`),
  search: async (query: string) => (await fetchJson<{result?: KanataAnime[]}>(`${API_CONFIG.S}?query=${encodeURIComponent(query)}`)).result || [],
  getSchedule: () => fetchJson<AnimeSchedule[]>(`${API_CONFIG.A}/schedule`),
  getCompleted: (page = 1) => fetchJson<KanataCompletedAnime[]>(`${API_CONFIG.O}/complete?page=${page}`),
  getList: () => fetchJson<AnimeListGroup[]>(`${API_CONFIG.O}/anime-list`),
  getBatch: (slug: string) => fetchJson<KanataAnimeBatch>(`${API_CONFIG.O}/batch/${slug}`),
  getGenres: () => fetchJson<KanataGenre[]>(`${API_CONFIG.A}/genres`),
  getGenre: (g: string, p = 1) => fetchJson<KanataAnime[]>(`${API_CONFIG.A}/genres/${g}?page=${p}`),
};

export const movie = {
  getHome: (s: 'popular' | 'latest' | 'trending' = 'latest') => fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/home?section=${s}`).then(r => r.data || []),
  search: (q: string, p = 1) => fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/search?q=${encodeURIComponent(q)}&page=${p}`).then(r => r.data || []),
  getDetail: (slug: string, t: 'movie' | 'series' = 'movie') => fetchJson<{data: MovieDetail}>(`${API_CONFIG.MT}/detail/${slug}?type=${t}`).then(r => r.data),
  getStream: (id: string, t: 'movie' | 'series' = 'movie') => fetchJson<{stream_url: string}>(`${API_CONFIG.MT}/stream?id=${id}&type=${t}`).then(r => r.stream_url),
  getByGenre: (g: string, p = 1) => fetchJson<{data: MovieCardItem[]}>(`${API_CONFIG.MT}/genre/${g}?page=${p}`).then(r => r.data || []),
};

export const manga = {
  search: (q: string, p = 1) => fetchJson<{data: MangaSearchResult[]}>(`${API_CONFIG.M}/search?q=${encodeURIComponent(q)}&page=${p}`),
  getDetail: (slug: string) => fetchJson<MangaDetail>(`${API_CONFIG.M}/detail?slug=${slug}`),
  getChapter: (seg: string) => fetchJson<ChapterDetail>(`${API_CONFIG.M}/chapter?segment=${seg}`),
  getPopular: () => fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/populer`),
  getNew: (p = 1, l = 10) => fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/terbaru?page=${p}&limit=${l}`),
  getRecommendations: (slug: string) => fetchJson<{recommendations: MangaSearchResult[]}>(`${API_CONFIG.M}/rekomendasi?based_on=${slug}`),
  getByGenre: (g: string, p = 1) => fetchJson<{comics: MangaSearchResult[]}>(`${API_CONFIG.M}/genre?genre=${g}&page=${p}`),
};

export const donghua = {
  getHome: () => fetchJson<AnichinHomeResult>(`${API_CONFIG.D}/home`),
  getDetail: (slug: string) => fetchJson<AnichinDetail>(`${API_CONFIG.D}/detail/${slug}`),
  search: (q: string) => fetchJson<AnichinDonghua[]>(`${API_CONFIG.D}/search?q=${encodeURIComponent(q)}`),
  getEpisode: (slug: string) => fetchJson<KanataEpisodeDetail>(`${API_CONFIG.D}/episode/${slug}`),
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
export interface JikanEnrichment { score: number; rank: number; popularity: number; synopsis: string; trailer_url: string; status: string; source: string; rating: string; year: number | null; season: string; genres: string[]; themes: string[]; studios: string[]; title: string; url: string; mediaType: 'anime' | 'manga'; chapters?: number | null; episodes?: number | null; }
export interface MovieCardItem { slug: string; title: string; poster: string; year: string; type: 'movie' | 'series'; rating?: string; status?: string; genres?: string; }
export interface MovieDetail { slug: string; title: string; poster: string; year: string; rating?: string; genres: string; type: 'movie' | 'series'; duration?: string; synopsis: string; quality: string; cast?: string; director?: string; country?: string; recommendations?: MovieCardItem[]; }

// ALIASES
export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export type AnimasuSearchResult = KanataAnime;

// HELPERS
export const extractSlugFromUrl = (url: string) => url ? url.split('/').filter(Boolean).pop() || '' : '';
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
    const data = await fetchJson<{data: any[]}>(`${API_CONFIG.J}/${type}?q=${encodeURIComponent(title)}&limit=1`);
    const item = data.data?.[0];
    if (!item) return null;
    return {
      score: item.score, rank: item.rank, popularity: item.popularity, synopsis: item.synopsis, trailer_url: item.trailer?.url,
      status: item.status, source: item.source, rating: item.rating, year: item.year, season: item.season,
      genres: (item.genres || []).map((g: any) => g.name), themes: (item.themes || []).map((t: any) => t.name),
      studios: (item.studios || []).map((s: any) => s.name), title: item.title, url: item.url, mediaType: type,
      chapters: item.chapters, episodes: item.episodes
    };
  } catch { return null; }
}
