import { cache } from 'react';
import type { MovieWatchData } from '@/lib/adapters/movie';

type MovieWatchLoader<T> = (slug: string, options?: { includeNsfw?: boolean }) => Promise<T>;

export function createMovieWatchRequestCache<T>(loader: MovieWatchLoader<T>): MovieWatchLoader<T> {
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

export const getMovieWatchPageData = cache(async (
  slug: string,
  includeNsfw: boolean,
): Promise<MovieWatchData | null> => {
  const { getMovieWatchBySlug } = await import('@/lib/adapters/movie');
  return getMovieWatchBySlug(slug, { includeNsfw });
});
