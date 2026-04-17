import 'server-only';

import { unstable_cache } from 'next/cache';
import { canAccessNsfw } from '@/lib/auth/adult-access';
import { getProfileAdultFields } from '@/lib/auth/profile';
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
import { getOrCreateUserPreferences } from '@/lib/server/user-preferences';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';
import {
  formatComicCardSubtitle,
  formatMovieCardMetaLine,
  formatMovieCardSubtitle,
  getComicCardBadgeText,
  getMovieCardBadgeText,
} from '@/lib/card-presentation';
import { buildSearchWarmDocuments, warmSearchIndexDocuments } from '@/lib/search/search-service';
import type { MovieCardItem } from '@/lib/types';
import type {
  HeroItem,
  HomeRecommendationSection,
  MixedRecommendationItem,
} from './home-page-types';

const SECTION_LIMIT = 12;
const SECTION_SOURCE_LIMIT = 24;
const HOME_FEED_REVALIDATE_SECONDS = 60 * 5;
const HOME_FEED_CACHE_VERSION = 'ia-v2';
const HERO_TYPE_BY_ROUTE = {
  comics: 'manga',
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

export async function resolveViewerNsfwAccess(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return false;
    }

    const [profile, preferences] = await Promise.all([
      getProfileAdultFields(supabase, data.user.id),
      getOrCreateUserPreferences(supabase, data.user.id),
    ]);

    return canAccessNsfw({
      birthDate: profile?.birthDate ?? null,
      adultContentEnabled: preferences.adultContentEnabled,
    });
  } catch {
    return false;
  }
}

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
    items: limitItems(uniqueById(items)),
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
    href: `/comics/${slug}`,
    theme: 'manga',
    subtitle: formatComicCardSubtitle(item),
    badgeText: getComicCardBadgeText(item),
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
    tags: extractHeroTags(item, type),
    rating: extractHeroRating(item.metaLine),
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

  void warmSearchIndexDocuments(buildSearchWarmDocuments({
    series: [
      ...seriesHub.popular.slice(0, 16),
      ...seriesHub.latest.slice(0, 16),
      ...seriesHub.dramaSpotlight.slice(0, 8),
    ],
    movies: [
      ...movieHub.popular.slice(0, 16),
      ...movieHub.latest.slice(0, 16),
    ],
    comics: [
      ...(mangaPopularResponse.comics || []).slice(0, 16),
      ...(mangaLatestResponse.comics || []).slice(0, 16),
    ],
  }));

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
    buildHomeSection('series-latest', 'Series Update Terbaru', 'Judul episodik yang paling baru diperbarui di katalog canonical', 'series', seriesBuckets.latest, '/watch/series#latest'),
    buildHomeSection('series-popular', 'Popular Across Series', 'Judul episodik paling ramai dari katalog series canonical', 'popular', seriesPopularItems, '/watch/series#popular'),
    buildHomeSection('movie-latest', 'Movie Update Terbaru', 'Film yang paling baru diperbarui di katalog movie', 'movie', movieLatestItems, '/watch/movies#latest'),
    buildHomeSection('series-anime', 'Anime in Series', 'Lane anime Jepang yang sekarang dibaca dari series catalog yang sama', 'series', seriesBuckets.anime, '/watch/series?type=anime'),
    buildHomeSection('series-radar', 'Release Radar', 'Jadwal mingguan yang diturunkan langsung dari release_day dan cadence di database', 'series', releaseRadarItems, '/watch/series#release-radar'),
    buildHomeSection('series-donghua', 'Donghua Spotlight', 'Animation dari China yang sekarang sepenuhnya masuk ke series canonical', 'series', seriesBuckets.donghua, '/watch/series?type=donghua'),
    buildHomeSection('series-drama', 'Drama Spotlight', 'Drama episodik canonical dari database, tetap terpisah dari short-drama provider', 'series', seriesDramaItems, '/watch/series?type=drama'),
    buildHomeSection('series-japan', 'Japan Lane', 'Series dengan rilis Jepang dari taxonomy canonical', 'series', seriesBuckets.japan, '/watch/series?type=anime'),
    buildHomeSection('series-china', 'China Lane', 'Series dari China, termasuk donghua dan live-action yang sudah ternormalisasi', 'series', seriesBuckets.china, '/watch/series?type=donghua'),
    buildHomeSection('series-korea', 'South Korea Lane', 'Series Korea dari canonical metadata, terpisah dari short-drama provider', 'series', seriesBuckets.korea, '/watch/series?type=drama'),
    buildHomeSection('manga-latest', 'Manga Update Terbaru', 'Manga yang paling baru diperbarui di katalog comic', 'manga', comicBuckets.manga, '/read/comics?type=manga'),
    buildHomeSection('manhwa-latest', 'Manhwa Update Terbaru', 'Manhwa yang paling baru diperbarui di katalog comic', 'manhwa', comicBuckets.manhwa, '/read/comics?type=manhwa'),
    buildHomeSection('manhua-latest', 'Manhua Update Terbaru', 'Manhua yang paling baru diperbarui di katalog comic', 'manhua', comicBuckets.manhua, '/read/comics?type=manhua'),
    buildHomeSection('popular-media', 'Populer Media', 'Pilihan populer lintas kategori', 'popular', popularMedia),
    buildHomeSection('top-reading', 'Top Reading', 'Judul paling banyak dibaca saat ini', 'reading', comicBuckets.popular, '/read/comics'),
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
  ['home-page-data', HOME_FEED_CACHE_VERSION, 'public'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

const getAuthenticatedHomePageData = unstable_cache(
  async () => buildHomePageData(true),
  ['home-page-data', HOME_FEED_CACHE_VERSION, 'auth'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

export async function getHomePageData(options: { includeNsfw?: boolean } = {}): Promise<HomePageData> {
  const includeNsfw = options.includeNsfw || await resolveViewerNsfwAccess();
  return includeNsfw ? getAuthenticatedHomePageData() : getPublicHomePageData();
}
