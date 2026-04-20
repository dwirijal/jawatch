import {
  extractSlugFromUrl,
  getHDThumbnail,
  getMangaSubtype,
  type MangaSearchResult,
} from '@/lib/adapters/comic-server';
import {
  formatComicCardSubtitle,
  formatMovieCardMetaLine,
  formatMovieCardSubtitle,
  getComicCardBadgeText,
  getMovieCardBadgeText,
} from '@/lib/card-presentation';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';
import type { MovieCardItem } from '@/lib/types';
import type {
  HeroItem,
  HomeRecommendationSection,
  MixedRecommendationItem,
} from '@/features/home/home-page-types';

export const SECTION_LIMIT = 12;
export const SECTION_SOURCE_LIMIT = 24;

const HERO_TYPE_BY_ROUTE = {
  comics: 'manga',
  movies: 'movie',
  series: 'series',
} as const;

export type HomePageData = {
  heroItems: HeroItem[];
  sections: HomeRecommendationSection[];
};

type SeriesItemBuckets = {
  latest: MixedRecommendationItem[];
  anime: MixedRecommendationItem[];
  donghua: MixedRecommendationItem[];
  japan: MixedRecommendationItem[];
  china: MixedRecommendationItem[];
  korea: MixedRecommendationItem[];
};

type ComicItemBuckets = {
  latest: MixedRecommendationItem[];
  manga: MixedRecommendationItem[];
  manhwa: MixedRecommendationItem[];
  manhua: MixedRecommendationItem[];
  popular: MixedRecommendationItem[];
};

function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function uniqueItemsById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

function limitItems<T>(items: T[], limit = SECTION_LIMIT): T[] {
  return items.slice(0, limit);
}

export function buildHomeSection(
  id: string,
  title: string,
  subtitle: string,
  iconKey: HomeRecommendationSection['iconKey'],
  items: MixedRecommendationItem[],
  viewAllHref?: string,
): HomeRecommendationSection {
  return {
    id,
    title,
    subtitle,
    iconKey,
    viewAllHref,
    items: limitItems(uniqueItemsById(items)),
  };
}

function toMovieItem(item: MovieCardItem): MixedRecommendationItem | null {
  if (!item.slug || !item.title) {
    return null;
  }

  return {
    id: `movie:${item.slug}`,
    title: item.title,
    image: getHDThumbnail(item.poster || ''),
    href: `/movies/${item.slug}`,
    theme: 'movie',
    subtitle: formatMovieCardSubtitle(item),
    metaLine: formatMovieCardMetaLine(item),
    badgeText: getMovieCardBadgeText(),
  };
}

export function toMovieItems(items: MovieCardItem[], limit = SECTION_SOURCE_LIMIT): MixedRecommendationItem[] {
  return items
    .map(toMovieItem)
    .filter(notNull)
    .slice(0, limit);
}

export function toSeriesItem(item: SeriesCardItem): MixedRecommendationItem | null {
  if (!item.slug || !item.title) {
    return null;
  }

  return {
    id: `series:${item.slug}`,
    title: item.title,
    image: getHDThumbnail(item.poster || ''),
    href: `/series/${item.slug}`,
    theme: getSeriesTheme(item.type),
    subtitle: formatSeriesCardSubtitle(item) || undefined,
    badgeText: getSeriesBadgeText(item.type),
  };
}

export function toSeriesItems(items: SeriesCardItem[], limit = SECTION_SOURCE_LIMIT): MixedRecommendationItem[] {
  return items
    .map(toSeriesItem)
    .filter(notNull)
    .slice(0, limit);
}

export function bucketSeriesItems(items: SeriesCardItem[], limit = SECTION_SOURCE_LIMIT): SeriesItemBuckets {
  const buckets: SeriesItemBuckets = {
    latest: [],
    anime: [],
    donghua: [],
    japan: [],
    china: [],
    korea: [],
  };

  for (const item of items) {
    const mapped = toSeriesItem(item);
    if (!mapped) {
      continue;
    }

    if (buckets.latest.length < limit) buckets.latest.push(mapped);
    if (item.type === 'anime' && buckets.anime.length < limit) buckets.anime.push(mapped);
    if (item.type === 'donghua' && buckets.donghua.length < limit) buckets.donghua.push(mapped);
    if (item.country === 'Japan' && buckets.japan.length < limit) buckets.japan.push(mapped);
    if (item.country === 'China' && buckets.china.length < limit) buckets.china.push(mapped);
    if (item.country === 'South Korea' && buckets.korea.length < limit) buckets.korea.push(mapped);
  }

  return buckets;
}

export function toSeriesScheduleItems(
  days: Array<{ label: string; items: SeriesCardItem[] }>,
  limit = SECTION_SOURCE_LIMIT,
): MixedRecommendationItem[] {
  const flattened: MixedRecommendationItem[] = [];

  for (const day of days) {
    for (const item of day.items) {
      const mapped = toSeriesItem(item);
      if (!mapped) {
        continue;
      }

      flattened.push({
        ...mapped,
        id: `series-schedule:${day.label}:${item.slug}`,
        subtitle: `${day.label} • ${mapped.subtitle || ''}`.replace(/\s•\s$/, ''),
      });

      if (flattened.length >= limit) {
        return flattened;
      }
    }
  }

  return flattened;
}

function toComicItem(item: MangaSearchResult): MixedRecommendationItem | null {
  const slug = extractSlugFromUrl(item.link || '') || item.slug;
  if (!slug || !item.title) {
    return null;
  }

  return {
    id: `manga:${slug}`,
    title: item.title,
    image: getHDThumbnail(item.image || item.thumbnail || ''),
    href: `/comics/${slug}`,
    theme: 'manga',
    subtitle: formatComicCardSubtitle(item),
    badgeText: getComicCardBadgeText(item),
  };
}

export function bucketComicItems(
  latestRaw: MangaSearchResult[],
  popularRaw: MangaSearchResult[],
  limit = SECTION_SOURCE_LIMIT,
): ComicItemBuckets {
  const buckets: ComicItemBuckets = {
    latest: [],
    manga: [],
    manhwa: [],
    manhua: [],
    popular: [],
  };

  for (const item of popularRaw) {
    const mapped = toComicItem(item);
    if (!mapped) {
      continue;
    }

    buckets.popular.push(mapped);
    if (buckets.popular.length >= limit) {
      break;
    }
  }

  for (const item of latestRaw) {
    const mapped = toComicItem(item);
    if (!mapped) {
      continue;
    }

    const subtype = getMangaSubtype(item);
    if (buckets.latest.length < limit) buckets.latest.push(mapped);
    if (subtype === 'manhwa' && buckets.manhwa.length < limit) buckets.manhwa.push(mapped);
    else if (subtype === 'manhua' && buckets.manhua.length < limit) buckets.manhua.push(mapped);
    else if (buckets.manga.length < limit) buckets.manga.push(mapped);
  }

  return buckets;
}

function extractHeroRating(metaLine?: string): string {
  const trimmed = metaLine?.trim();
  if (!trimmed) {
    return 'N/A';
  }

  const match = trimmed.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match?.[1] || 'N/A';
}

function extractHeroTags(item: MixedRecommendationItem, fallbackType: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  const candidates = [
    item.badgeText,
    ...(item.subtitle?.split('•').map((part) => part.trim()) ?? []),
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed || trimmed.toUpperCase() === 'N/A') {
      continue;
    }

    const normalized = trimmed.replace(/^★\s*/, '');
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(normalized);

    if (tags.length >= 3) {
      return tags;
    }
  }

  return tags.length > 0 ? tags : [fallbackType.toUpperCase()];
}

function recommendationToHero(item: MixedRecommendationItem): HeroItem | null {
  if (!item.image) {
    return null;
  }

  const segments = item.href.split('/').filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [route, slug] = segments;
  const type = HERO_TYPE_BY_ROUTE[route as keyof typeof HERO_TYPE_BY_ROUTE] ?? null;
  if (!type) {
    return null;
  }

  return {
    id: slug,
    title: item.title,
    image: item.image,
    banner: item.image,
    description: item.subtitle || 'Temukan judul berikutnya yang bakal kamu suka.',
    type,
    tags: extractHeroTags(item, type),
    rating: extractHeroRating(item.metaLine),
  };
}

export function buildHomeHeroItems(items: MixedRecommendationItem[], limit = 5): HeroItem[] {
  return uniqueItemsById(items)
    .map(recommendationToHero)
    .filter((item): item is HeroItem => item !== null)
    .slice(0, limit);
}
