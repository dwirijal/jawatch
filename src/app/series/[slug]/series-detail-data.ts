import type { SeriesDetailData } from '../../../lib/adapters/series';

type SeriesDetailLoader<T> = (slug: string) => Promise<T>;

export function createSeriesDetailRequestCache<T>(loader: SeriesDetailLoader<T>): SeriesDetailLoader<T> {
  const inFlight = new Map<string, Promise<T>>();

  return async (slug) => {
    const existing = inFlight.get(slug);
    if (existing) {
      return existing;
    }

    const pending = loader(slug).finally(() => {
      if (inFlight.get(slug) === pending) {
        inFlight.delete(slug);
      }
    });

    inFlight.set(slug, pending);
    return pending;
  };
}

export const getSeriesDetailPageData = createSeriesDetailRequestCache<SeriesDetailData | null>(async (slug) => {
  const { getSeriesDetailBySlug } = await import('../../../lib/adapters/series');

  return getSeriesDetailBySlug(slug, {
    includeNsfw: false,
    includeRecommendations: false,
  });
});
