export interface GenericMediaItem {
  slug: string;
  title: string;
  thumb?: string;
  image?: string;
  thumbnail?: string;
  poster?: string;
  episode?: string;
  chapter?: string;
  year?: string;
  status?: string;
  type?: string;
  link?: string;
}

export type MangaSubtype = 'manga' | 'manhwa' | 'manhua';

export interface MangaSearchResult {
  title: string;
  altTitle: string | null;
  slug: string;
  href: string;
  thumbnail: string;
  type: string;
  genre: string;
  description: string;
  chapter?: string;
  time_ago?: string;
  link: string;
  image: string;
}

export interface MangaChapter {
  chapter: string;
  slug: string;
  link: string;
  date: string;
}

export interface MangaDetail {
  creator: string;
  slug: string;
  title: string;
  title_indonesian: string;
  image: string;
  synopsis: string;
  synopsis_full: string;
  summary: string;
  background_story: string;
  metadata: {
    type: string;
    author: string;
    status: string;
    concept: string;
    age_rating: string;
    reading_direction: string;
  };
  genres: Array<{ name: string; slug: string; link: string }>;
  chapters: MangaChapter[];
  similar_manga: Array<{ title: string; slug: string; link: string; image: string; type: string; description: string }>;
}

export interface ChapterDetail {
  title: string;
  manga_title?: string;
  chapter_title?: string;
  images: string[];
  navigation: {
    next: string | null;
    prev: string | null;
    nextChapter?: string | null;
    previousChapter?: string | null;
  };
}

export interface KanataAnime {
  title: string;
  slug: string;
  thumb: string;
  episode: string;
  type: string;
  status: string;
}

export interface KanataAnimeDetail {
  title: string;
  alternative_title: string;
  status: string;
  type: string;
  synopsis: string;
  thumb: string;
  genres: string[];
  episodes: Array<{ title: string; slug: string; date: string }>;
  studio: string;
  rating: string;
  total_episodes: string;
  download?: Array<{ quality: string; url: string[] }>;
  provider?: 'samehadaku' | 'animasu' | 'otakudesu';
}

export interface KanataEpisodeDetail {
  title: string;
  default_embed: string;
  mirrors: Array<{ label: string; embed_url: string }>;
  slug: string;
  navigation: {
    next: string | null;
    prev: string | null;
    anime_info: string;
  };
}

export interface AnimeSchedule {
  day: string;
  anime_list: KanataAnime[];
}

export interface AnimeListGroup {
  letter: string;
  list: Array<{ title: string; slug: string }>;
}

export interface KanataAnimeBatch {
  title: string;
  thumb: string;
  download_list: Array<{
    title: string;
    links: Array<{
      quality: string;
      size: string;
      links: Array<{ name: string; url: string }>;
    }>;
  }>;
}

export interface KanataCompletedAnime {
  title: string;
  slug: string;
  thumb: string;
  episode: string;
  date: string;
}

export interface KanataGenre {
  name: string;
  slug: string;
  url: string;
}

export type AnimePaginationResult<T> = {
  items: T[];
  hasNextPage: boolean;
};

export interface AnichinDonghua {
  title: string;
  slug: string;
  thumb: string;
  episode: string;
  image?: string;
  status?: string;
  type?: string;
  link?: string;
}

export interface AnichinHomeResult {
  latest_updates: AnichinDonghua[];
  ongoing_series: AnichinDonghua[];
  completed_series: AnichinDonghua[];
}

export interface AnichinDetail {
  title: string;
  meta: {
    studio: string;
    status: string;
    episodes: string;
    season: string;
    country: string;
    network: string;
    duration: string;
    released: string;
    updated_on: string;
  };
  episodes: Array<{
    slug: string;
    title: string;
    episode: string;
    date: string;
  }>;
  synopsis: string;
  thumb: string;
  genres: string[];
}

export interface AnimeCastMember {
  id: number;
  name: string;
  role: string;
  image?: string;
  voiceActor?: string;
  voiceActorLanguage?: string;
}

export interface JikanEnrichment {
  malId: number;
  score: number;
  rank: number;
  popularity: number;
  synopsis: string;
  trailer_url: string;
  status: string;
  source: string;
  rating: string;
  year: number | null;
  season: string;
  genres: string[];
  themes: string[];
  studios: string[];
  title: string;
  url: string;
  mediaType: 'anime' | 'manga';
  chapters?: number | null;
  episodes?: number | null;
}

export interface MovieCardItem {
  slug: string;
  title: string;
  poster: string;
  year: string;
  type: 'movie' | 'series';
  rating?: string;
  status?: string;
  genres?: string;
}

export interface MovieDetail {
  slug: string;
  title: string;
  poster: string;
  year: string;
  rating?: string;
  genres: string;
  type: 'movie' | 'series';
  duration?: string;
  synopsis: string;
  quality: string;
  cast?: string;
  director?: string;
  country?: string;
  recommendations?: MovieCardItem[];
}

export interface NovelListItem {
  title: string;
  slug: string;
  poster: string;
  latestChapter?: string;
  summary?: string;
  type: string;
  rating?: string;
  status?: string;
}

export interface NovelGenre {
  name: string;
  slug: string;
  count?: string;
}

export interface NovelDetail {
  title: string;
  altTitle: string;
  slug: string;
  poster: string;
  rating: string;
  status: string;
  type: string;
  synopsis: string;
  info: {
    country: string;
    published: string;
    author: string;
    totalChapters: string;
    tags: string;
  };
  genres: NovelGenre[];
  chapters: Array<{
    title: string;
    date: string;
    slug: string;
  }>;
}

export interface NovelRead {
  title: string;
  content: string;
}

export type NewManga = MangaSearchResult;
export type RecommendationManga = MangaSearchResult;
export type AnimasuSearchResult = KanataAnime;
