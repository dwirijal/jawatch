import type { SeriesCardItem } from './series-presentation';

interface SelectSeriesRecommendationsOptions {
  currentSlug: string;
  currentType?: SeriesCardItem['type'];
  genres: string[];
  country: string;
  items: SeriesCardItem[];
  limit?: number;
}

function normalizeGenreSet(value: string[] | string): Set<string> {
  const rawGenres = Array.isArray(value) ? value : value.split(',');
  const genres = rawGenres
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return new Set(genres);
}

export function selectSeriesRecommendations({
  currentSlug,
  currentType,
  genres,
  country,
  items,
  limit = 8,
}: SelectSeriesRecommendationsOptions): SeriesCardItem[] {
  const currentGenreSet = normalizeGenreSet(genres);
  const normalizedCountry = country.trim().toLowerCase();

  return items
    .filter((item) => item.slug !== currentSlug && (!currentType || item.type === currentType))
    .map((item) => {
      const overlap = [...normalizeGenreSet(item.genres || '')].filter((genre) => currentGenreSet.has(genre)).length;
      const countryBoost = item.country?.trim().toLowerCase() === normalizedCountry ? 1 : 0;

      return {
        item,
        rank: overlap * 10 + countryBoost,
      };
    })
    .sort((left, right) => right.rank - left.rank)
    .slice(0, Math.max(1, limit))
    .map(({ item }) => item);
}
