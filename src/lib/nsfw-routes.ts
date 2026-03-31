export function getNsfwSeriesDetailHref(slug: string): string {
  return `/nsfw/series/${slug}`;
}

export function getNsfwSeriesWatchHref(slug: string): string {
  return `/nsfw/series/watch/${slug}`;
}

export function getNsfwMovieDetailHref(slug: string): string {
  return `/nsfw/movies/${slug}`;
}

export function getNsfwMovieWatchHref(slug: string): string {
  return `/nsfw/movies/watch/${slug}`;
}

export function getNsfwComicDetailHref(slug: string): string {
  return `/nsfw/comic/${slug}`;
}

export function getNsfwComicChapterHref(slug: string, chapterSlug: string): string {
  return `/nsfw/comic/${slug}/${chapterSlug}`;
}
