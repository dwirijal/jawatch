import 'server-only';

import { unstable_cache } from 'next/cache';
import type { HeroItem } from '@/components/organisms/HeroCarousel';
import {
  extractSlugFromUrl,
  getHDThumbnail,
  getMangaSubtype,
  getNewManga,
  getPopularManga,
  type MangaSearchResult,
} from '@/lib/adapters/comic-server';
import { getMovieHubData } from '@/lib/adapters/movie';
import { getSeriesHubData } from '@/lib/adapters/series';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';
import type { MovieCardItem } from '@/lib/types';
import type {
  HomeRecommendationSection,
  MixedRecommendationItem,
} from './HomePageClient';

const SECTION_LIMIT = 12;
const SECTION_SOURCE_LIMIT = 24;
const HOME_FEED_REVALIDATE_SECONDS = 60 * 5;
const HERO_TYPE_BY_ROUTE = {
  comic: 'manga',
  movies: 'movie',
  series: 'series',
} as const;

type HomePageData = {
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

function uniqueById<T extends { id: string }>(items: T[]): T[] {
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

function buildHomeSection(
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
    items: limitItems(items),
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
    subtitle: item.year || undefined,
    badgeText: item.rating ? `★ ${item.rating}` : 'MOVIE',
  };
}

function toMovieItems(items: MovieCardItem[], limit = SECTION_SOURCE_LIMIT): MixedRecommendationItem[] {
  return items
    .map(toMovieItem)
    .filter(notNull)
    .slice(0, limit);
}

function toSeriesItem(item: SeriesCardItem): MixedRecommendationItem | null {
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

function bucketSeriesItems(items: SeriesCardItem[], limit = SECTION_SOURCE_LIMIT): SeriesItemBuckets {
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

function toSeriesScheduleItems(
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
    href: `/comic/${slug}`,
    theme: 'manga',
    subtitle: item.chapter || item.time_ago || undefined,
    badgeText: item.type || undefined,
  };
}

function bucketComicItems(
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

function recommendationToHero(item: MixedRecommendationItem): HeroItem | null {
  if (!item.image) return null;
  const segments = item.href.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const [route, slug] = segments;
  const type = HERO_TYPE_BY_ROUTE[route as keyof typeof HERO_TYPE_BY_ROUTE] ?? null;
  if (!type) return null;

  return {
    id: slug,
    title: item.title,
    image: item.image,
    banner: item.image,
    description: item.subtitle || 'Discover your next favorite title.',
    type,
    tags: [item.badgeText || type.toUpperCase(), 'Recommended'].filter(Boolean).slice(0, 3),
    rating: item.badgeText?.replace(/^★\s*/, '') || 'N/A',
  };
}

async function buildHomePageData(includeNsfw: boolean): Promise<HomePageData> {
  const [seriesHub, movieHub, mangaPopularResponse, mangaLatestResponse] = await Promise.all([
    getSeriesHubData(32, { includeNsfw }).catch(() => ({
      popular: [],
      latest: [],
      dramaSpotlight: [],
      weeklySchedule: [],
      filters: [],
    })),
    getMovieHubData(32, { includeNsfw }).catch(() => ({ popular: [], latest: [] })),
    getPopularManga(40, { includeNsfw }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw }).catch(() => ({ comics: [] })),
  ]);

  const seriesBuckets = bucketSeriesItems(seriesHub.latest);
  const seriesPopularItems = seriesHub.popular.map(toSeriesItem).filter(notNull).slice(0, SECTION_SOURCE_LIMIT);
  const seriesDramaItems = seriesHub.dramaSpotlight.map(toSeriesItem).filter(notNull).slice(0, SECTION_SOURCE_LIMIT);
  const releaseRadarItems = toSeriesScheduleItems(seriesHub.weeklySchedule);

  const movieLatestItems = toMovieItems(movieHub.latest);
  const moviePopularItems = toMovieItems(movieHub.popular);

  const comicBuckets = bucketComicItems(
    mangaLatestResponse.comics || [],
    mangaPopularResponse.comics || [],
  );

  const popularMedia = uniqueById([
    ...seriesPopularItems.slice(0, 4),
    ...moviePopularItems.slice(0, 4),
    ...comicBuckets.popular.slice(0, 4),
    ...seriesBuckets.donghua.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const loversByCommunity = uniqueById([
    ...comicBuckets.popular.slice(0, 5),
    ...seriesBuckets.donghua.slice(0, 4),
    ...seriesPopularItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const freshThisWeek = uniqueById([
    ...seriesBuckets.latest.slice(0, 4),
    ...movieLatestItems.slice(0, 4),
    ...comicBuckets.latest.slice(0, 4),
    ...seriesBuckets.donghua.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const sections: HomeRecommendationSection[] = [
    buildHomeSection('series-latest', 'Latest Episodes', 'Semua judul episodik canonical: anime, donghua, dan drama hidup di satu lane series', 'series', seriesBuckets.latest, '/series'),
    buildHomeSection('series-popular', 'Popular Across Series', 'Judul episodik paling ramai dari katalog series canonical', 'popular', seriesPopularItems, '/series'),
    buildHomeSection('movie-latest', 'Movie Terbaru', 'Film terbaru siap ditonton', 'movie', movieLatestItems, '/movies'),
    buildHomeSection('series-anime', 'Anime in Series', 'Lane anime Jepang yang sekarang dibaca dari series catalog yang sama', 'series', seriesBuckets.anime, '/series/anime'),
    buildHomeSection('series-radar', 'Release Radar', 'Jadwal mingguan yang diturunkan langsung dari release_day dan cadence di database', 'series', releaseRadarItems, '/series'),
    buildHomeSection('series-donghua', 'Donghua Spotlight', 'Animation dari China yang sekarang sepenuhnya masuk ke series canonical', 'series', seriesBuckets.donghua, '/series/donghua'),
    buildHomeSection('series-drama', 'Drama Spotlight', 'Drama episodik canonical dari database, tetap terpisah dari Drachin', 'series', seriesDramaItems, '/series'),
    buildHomeSection('series-japan', 'Japan Lane', 'Series dengan rilis Jepang dari taxonomy canonical', 'series', seriesBuckets.japan, '/series/country/japan'),
    buildHomeSection('series-china', 'China Lane', 'Series dari China, termasuk donghua dan live-action yang sudah ternormalisasi', 'series', seriesBuckets.china, '/series/country/china'),
    buildHomeSection('series-korea', 'South Korea Lane', 'Series Korea dari canonical metadata, terpisah dari short drama provider', 'series', seriesBuckets.korea, '/series/country/south-korea'),
    buildHomeSection('manga-latest', 'Manga Terbaru', 'Chapter manga terbaru', 'manga', comicBuckets.manga, '/comic/manga'),
    buildHomeSection('manhwa-latest', 'Manhwa Terbaru', 'Update manhwa terbaru', 'manhwa', comicBuckets.manhwa, '/comic/manhwa'),
    buildHomeSection('manhua-latest', 'Manhua Terbaru', 'Update manhua terbaru', 'manhua', comicBuckets.manhua, '/comic/manhua'),
    buildHomeSection('popular-media', 'Populer Media', 'Pilihan populer lintas kategori', 'popular', popularMedia),
    buildHomeSection('top-reading', 'Top Reading', 'Judul paling banyak dibaca saat ini', 'reading', comicBuckets.popular, '/comic'),
    buildHomeSection('community-lovers', 'Lovers by Community', 'Favorit komunitas dari tren terbaru', 'community', loversByCommunity),
    buildHomeSection('fresh-week', 'Fresh This Week', 'Rangkuman rilisan baru yang lagi naik', 'fresh', freshThisWeek),
  ];

  const heroItems = uniqueById([
    ...moviePopularItems.slice(0, 2),
    ...seriesPopularItems.slice(0, 2),
    ...comicBuckets.popular.slice(0, 1),
    ...seriesBuckets.donghua.slice(0, 1),
  ])
    .map(recommendationToHero)
    .filter((item): item is HeroItem => item !== null)
    .slice(0, 5);

  return { sections, heroItems };
}

const getPublicHomePageData = unstable_cache(
  async () => buildHomePageData(false),
  ['home-page-data', 'public'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

const getAuthenticatedHomePageData = unstable_cache(
  async () => buildHomePageData(true),
  ['home-page-data', 'auth'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

export async function getHomePageData(options: { includeNsfw?: boolean } = {}): Promise<HomePageData> {
  return options.includeNsfw ? getAuthenticatedHomePageData() : getPublicHomePageData();
}
