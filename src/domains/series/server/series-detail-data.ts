import type { SeriesDetailData } from '@/lib/adapters/series';

type SeriesDetailLoader<T> = (slug: string, options?: { includeNsfw?: boolean }) => Promise<T>;

export function createSeriesDetailRequestCache<T>(loader: SeriesDetailLoader<T>): SeriesDetailLoader<T> {
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

export const getSeriesDetailPageData = createSeriesDetailRequestCache<SeriesDetailData | null>(async (slug, options = {}) => {
  const { getSeriesDetailBySlug } = await import('@/lib/adapters/series');

  return getSeriesDetailBySlug(slug, {
    includeNsfw: options.includeNsfw === true,
    includeRecommendations: false,
  });
});
