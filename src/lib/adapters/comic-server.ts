export {
  extractSlugFromUrl,
  filterMangaBySubtype,
  getHDThumbnail,
  getMangaSubtype,
} from './comic-server-shared.ts';

export {
  getComicSubtypePosters,
  getMangaByGenre,
  getNewManga,
  getOngoingManga,
  getPopularManga,
  searchManga,
} from './comic-server-browse.ts';

export {
  getComicJikanEnrichment,
  getMangaChapter,
  getMangaDetail,
  getMangaRecommendations,
} from './comic-server-detail.ts';

export type {
  ChapterDetail,
  JikanEnrichment,
  MangaDetail,
  MangaSearchResult,
  MangaSubtype,
  NewManga,
  RecommendationManga,
} from './comic-server-shared.ts';
