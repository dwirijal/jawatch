import type { MangaSearchResult, MovieCardItem } from '@/lib/types';

export function getMovieCardBadgeText(): string {
  return 'MOVIE';
}

export function formatMovieCardSubtitle(item: Pick<MovieCardItem, 'year'>): string | undefined {
  const year = item.year?.trim();
  return year || undefined;
}

export function formatMovieCardMetaLine(item: Pick<MovieCardItem, 'rating'>): string | undefined {
  const rating = item.rating?.trim();
  return rating ? `★ ${rating}` : undefined;
}

export function formatComicCardSubtitle(item: Pick<MangaSearchResult, 'chapter' | 'time_ago'>): string | undefined {
  const chapter = item.chapter?.trim();
  const timeAgo = item.time_ago?.trim();
  const joined = [chapter, timeAgo].filter(Boolean).join(' • ');
  return joined || undefined;
}

export function getComicCardBadgeText(item: Pick<MangaSearchResult, 'type' | 'subtype'>): string {
  const subtype = item.subtype?.trim();
  if (subtype) {
    return subtype.toUpperCase();
  }

  const type = item.type?.trim();
  return type ? type.toUpperCase() : 'COMIC';
}
