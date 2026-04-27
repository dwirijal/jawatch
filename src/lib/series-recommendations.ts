import type { SeriesCardItem } from './series-presentation';
import {
  extractSeriesInstallmentHint,
  hasExplicitSeriesInstallmentLabel,
  normalizeSeriesFranchiseStem,
  normalizeSeriesTitle,
  sharesSeriesFranchise,
} from './series-franchise.ts';

interface SelectSeriesRecommendationsOptions {
  currentSlug: string;
  currentTitle?: string;
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
  currentTitle,
  currentType,
  genres,
  country,
  items,
  limit = 8,
}: SelectSeriesRecommendationsOptions): SeriesCardItem[] {
  const currentGenreSet = normalizeGenreSet(genres);
  const normalizedCountry = country.trim().toLowerCase();
  const currentFranchiseStem = normalizeSeriesFranchiseStem(currentTitle || currentSlug);
  const currentNormalizedTitle = normalizeSeriesTitle(currentTitle || '');
  const currentInstallment = extractSeriesInstallmentHint(currentTitle || currentSlug);

  const ranked = items
    .filter((item) => item.slug !== currentSlug && (!currentType || item.type === currentType))
    .filter((item) => normalizeSeriesTitle(item.title) !== currentNormalizedTitle)
    .filter((item) => {
      const itemInstallment = extractSeriesInstallmentHint(item.title || item.slug);
      return !(currentInstallment && itemInstallment === currentInstallment && sharesSeriesFranchise(currentTitle || currentSlug, item.title));
    })
    .map((item) => {
      const overlap = [...normalizeGenreSet(item.genres || '')].filter((genre) => currentGenreSet.has(genre)).length;
      const countryBoost = item.country?.trim().toLowerCase() === normalizedCountry ? 1 : 0;
      const franchiseBoost = currentFranchiseStem && sharesSeriesFranchise(currentTitle || currentSlug, item.title) ? 100 : 0;
      const installmentBoost = hasExplicitSeriesInstallmentLabel(item.title) ? 5 : 0;
      const exactFranchiseTitleBoost = normalizeSeriesFranchiseStem(item.title) === normalizeSeriesTitle(item.title) ? 20 : 0;
      const subtitleOnlyPenalty = item.title.includes(':') && installmentBoost === 0 ? 8 : 0;

      return {
        item,
        rank: franchiseBoost + (overlap * 10) + countryBoost + installmentBoost + exactFranchiseTitleBoost - subtitleOnlyPenalty,
      };
    })
    .sort((left, right) => {
      if (right.rank !== left.rank) {
        return right.rank - left.rank;
      }

      return left.item.title.localeCompare(right.item.title);
    });

  const uniqueByTitle = new Map<string, SeriesCardItem>();
  for (const { item } of ranked) {
    const key = `${item.type}:${normalizeSeriesTitle(item.title)}`;
    if (!uniqueByTitle.has(key)) {
      uniqueByTitle.set(key, item);
    }
  }

  return [...uniqueByTitle.values()].slice(0, Math.max(1, limit));
}
