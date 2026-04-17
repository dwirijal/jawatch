import type { MovieCardItem } from '@/lib/types';

type MoviePageData = {
  popular: MovieCardItem[];
  latest: MovieCardItem[];
  initialResults: MovieCardItem[] | null;
};

type MoviePageDataLoaderDependencies = {
  loadHubData: (
    limit: number,
    options: { includeNsfw: boolean },
  ) => Promise<{ popular: MovieCardItem[]; latest: MovieCardItem[] }>;
  loadGenreItems: (
    genre: string,
    limit: number,
    options: { includeNsfw: boolean },
  ) => Promise<MovieCardItem[]>;
  warmSearchDocuments?: (input: { movies: MovieCardItem[] }) => void;
};

type MoviePageDataLoaderInput = {
  activeGenre: string | null;
  limit: number;
  includeNsfw: boolean;
};

export function createMoviePageDataLoader({
  loadHubData,
  loadGenreItems,
  warmSearchDocuments = () => undefined,
}: MoviePageDataLoaderDependencies) {
  return async function loadMoviePageData({
    activeGenre,
    limit,
    includeNsfw,
  }: MoviePageDataLoaderInput): Promise<MoviePageData> {
    const options = { includeNsfw };
    const hubPromise = loadHubData(limit, options).catch(() => ({
      popular: [],
      latest: [],
    }));
    const genrePromise = activeGenre
      ? loadGenreItems(activeGenre, limit, options).catch(() => [])
      : Promise.resolve(null);

    const [{ popular, latest }, initialResults] = await Promise.all([hubPromise, genrePromise]);

    warmSearchDocuments({
      movies: [
        ...popular.slice(0, 18),
        ...latest.slice(0, 18),
        ...(initialResults || []).slice(0, 12),
      ],
    });

    return {
      popular,
      latest,
      initialResults,
    };
  };
}

export const loadMoviePageData = createMoviePageDataLoader({
  async loadHubData(limit, options) {
    const { getMovieHubData } = await import('@/lib/adapters/movie');
    return getMovieHubData(limit, options);
  },
  async loadGenreItems(genre, limit, options) {
    const { getMovieGenreItems } = await import('@/lib/adapters/movie');
    return getMovieGenreItems(genre, limit, options);
  },
  warmSearchDocuments(input) {
    void import('@/lib/search/search-service')
      .then(({ buildSearchWarmDocuments, warmSearchIndexDocuments }) => {
        void warmSearchIndexDocuments(buildSearchWarmDocuments(input));
      })
      .catch(() => undefined);
  },
});
