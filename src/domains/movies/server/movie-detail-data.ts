import { cache } from 'react';
import type { MovieDetailData } from '@/lib/adapters/movie';

type MovieDetailLoader<T> = (slug: string, options?: { includeNsfw?: boolean }) => Promise<T>;

export function createMovieDetailRequestCache<T>(loader: MovieDetailLoader<T>): MovieDetailLoader<T> {
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

export const getMovieDetailPageData = cache(async (
  slug: string,
  includeNsfw: boolean,
): Promise<MovieDetailData | null> => {
  const { getMovieDetailBySlug, getMovieWatchBySlug } = await import('@/lib/adapters/movie');
  const detail = await getMovieDetailBySlug(slug, { includeNsfw });
  if (detail) {
    return detail;
  }

  const watch = await getMovieWatchBySlug(slug, { includeNsfw });
  if (!watch) {
    return null;
  }

  return {
    slug: watch.slug,
    title: watch.title,
    poster: watch.poster,
    background: watch.background,
    logo: watch.logo,
    backdrop: watch.backdrop,
    year: watch.year,
    rating: watch.rating,
    genres: [],
    quality: watch.quality,
    duration: watch.duration,
    synopsis: watch.synopsis,
    cast: [],
    director: '',
    trailerUrl: null,
    externalUrl: watch.detailHref,
    recommendations: [],
  };
});
