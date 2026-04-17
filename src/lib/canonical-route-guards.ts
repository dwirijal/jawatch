const MOVIE_RESERVED_SLUGS = new Set(['latest', 'popular', 'watch']);

const SERIES_RESERVED_SLUGS = new Set([
  'anime',
  'country',
  'donghua',
  'drachin',
  'drama',
  'episode',
  'genre',
  'list',
  'ongoing',
  'short',
  'watch',
  'year',
]);

const COMIC_RESERVED_SLUGS = new Set([
  'chapter',
  'genre',
  'latest',
  'manga',
  'manhua',
  'manhwa',
  'ongoing',
  'popular',
]);

function normalizeRouteSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function isReservedMovieSlug(slug: string) {
  return MOVIE_RESERVED_SLUGS.has(normalizeRouteSlug(slug));
}

export function isReservedSeriesSlug(slug: string) {
  return SERIES_RESERVED_SLUGS.has(normalizeRouteSlug(slug));
}

export function isReservedComicSlug(slug: string) {
  return COMIC_RESERVED_SLUGS.has(normalizeRouteSlug(slug));
}
