import type { MovieCardItem } from '@/lib/types';

export type MovieSortMode = 'popular' | 'updated' | 'rating' | 'az';

const MOVIE_SORT_MODES = new Set<MovieSortMode>(['popular', 'updated', 'rating', 'az']);

export function normalizeMovieSortMode(value?: string | null): MovieSortMode {
  return MOVIE_SORT_MODES.has(value as MovieSortMode) ? (value as MovieSortMode) : 'popular';
}

export function getFeaturedMovie(popular: MovieCardItem[], latest: MovieCardItem[]): MovieCardItem | null {
  return popular[0] ?? latest[0] ?? null;
}

export function uniqueMovieCards(items: MovieCardItem[]): MovieCardItem[] {
  const seen = new Set<string>();
  const nextItems: MovieCardItem[] = [];

  for (const item of items) {
    if (seen.has(item.slug)) {
      continue;
    }

    seen.add(item.slug);
    nextItems.push(item);
  }

  return nextItems;
}

export function parseMovieRating(rating?: string | null): number {
  if (!rating) {
    return 0;
  }

  const parsed = Number.parseFloat(rating);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortMovieCards(items: MovieCardItem[], sortMode: MovieSortMode): MovieCardItem[] {
  const nextItems = [...items];

  if (sortMode === 'rating') {
    return nextItems.sort((left, right) => {
      const ratingDiff = parseMovieRating(right.rating) - parseMovieRating(left.rating);
      return ratingDiff || left.title.localeCompare(right.title);
    });
  }

  if (sortMode === 'az') {
    return nextItems.sort((left, right) => left.title.localeCompare(right.title));
  }

  return nextItems;
}

export function movieHasGenre(item: MovieCardItem, genre: string): boolean {
  const needle = genre.trim().toLowerCase();
  if (!needle) {
    return false;
  }

  return (item.genres || '')
    .split(',')
    .map((label) => label.trim().toLowerCase())
    .some((label) => label === needle);
}

export function buildMovieGenreRows(
  items: MovieCardItem[],
  genres: string[],
  limit = 12,
): Array<{ genre: string; items: MovieCardItem[] }> {
  const uniqueItems = uniqueMovieCards(items);

  return genres
    .map((genre) => ({
      genre,
      items: uniqueItems.filter((item) => movieHasGenre(item, genre)).slice(0, limit),
    }))
    .filter((row) => row.items.length > 0);
}
