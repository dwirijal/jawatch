import { cache } from 'react';
import type { SeriesEpisodeData } from '@/lib/adapters/series';

type SeriesEpisodeLoader<T> = (slug: string, options?: { includeNsfw?: boolean }) => Promise<T>;

export function createSeriesEpisodeRequestCache<T>(loader: SeriesEpisodeLoader<T>): SeriesEpisodeLoader<T> {
  const inFlight = new Map<string, Promise<T>>();

  return async (slug, options = {}) => {
    const cacheKey = `${slug}::${options.includeNsfw === true ? 'auth' : 'public'}`;
    const existing = inFlight.get(cacheKey);
    if (existing) {
      return existing;
    }

    const pending = loader(slug, options).finally(() => {
      if (inFlight.get(cacheKey) === pending) {
        inFlight.delete(cacheKey);
      }
    });

    inFlight.set(cacheKey, pending);
    return pending;
  };
}

export const getSeriesEpisodePageData = cache(async (
  slug: string,
  includeNsfw: boolean,
): Promise<SeriesEpisodeData | null> => {
  const { getSeriesEpisodeBySlug } = await import('@/lib/adapters/series');
  return getSeriesEpisodeBySlug(slug, { includeNsfw });
});

export const getSeriesEpisodePageDataByNumber = cache(async (
  seriesSlug: string,
  episodeNumber: string,
  includeNsfw: boolean,
): Promise<SeriesEpisodeData | null> => {
  const { getSeriesEpisodeByNumber } = await import('@/lib/adapters/series');
  return getSeriesEpisodeByNumber(seriesSlug, episodeNumber, { includeNsfw });
});

export const getSeriesEpisodePageDataBySpecialSlug = cache(async (
  seriesSlug: string,
  episodeSlug: string,
  includeNsfw: boolean,
): Promise<SeriesEpisodeData | null> => {
  const { getSeriesEpisodeBySpecialSlug } = await import('@/lib/adapters/series');
  return getSeriesEpisodeBySpecialSlug(seriesSlug, episodeSlug, { includeNsfw });
});
