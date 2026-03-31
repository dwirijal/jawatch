import HomePageClient, { type HomeRecommendationSection, type MixedRecommendationItem } from './HomePageClient';
import type { HeroItem } from '@/components/organisms/HeroCarousel';
import {
  extractSlugFromUrl,
  getHDThumbnail,
  getMangaSubtype,
  getNewManga,
  getPopularManga,
  type MangaSearchResult,
} from '@/lib/adapters/comic-server';
import { getSeriesHubData } from '@/lib/adapters/series';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import { getMovieHubData } from '@/lib/adapters/movie';
import type { MovieCardItem } from '@/lib/types';

const SECTION_LIMIT = 12;
const HERO_TYPE_BY_ROUTE = {
  comic: 'manga',
  movies: 'movie',
  series: 'series',
} as const;

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

function toMovieItems(items: MovieCardItem[], limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      if (!item.slug || !item.title) return null;
      return {
        id: `movie:${item.slug}`,
        title: item.title,
        image: getHDThumbnail(item.poster || ''),
        href: `/movies/${item.slug}`,
        theme: 'movie',
        subtitle: item.year || undefined,
        badgeText: item.rating ? `★ ${item.rating}` : 'MOVIE',
      };
    })
    .filter(notNull)
    .slice(0, limit);
}

function toSeriesItems(items: SeriesCardItem[], limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      if (!item.slug || !item.title) return null;
      return {
        id: `series:${item.slug}`,
        title: item.title,
        image: getHDThumbnail(item.poster || ''),
        href: `/series/${item.slug}`,
        theme: getSeriesTheme(item.type),
        subtitle: formatSeriesCardSubtitle(item) || undefined,
        badgeText: getSeriesBadgeText(item.type),
      };
    })
    .filter(notNull)
    .slice(0, limit);
}

function toSeriesScheduleItems(days: Array<{ label: string; items: SeriesCardItem[] }>, limit = SECTION_LIMIT): MixedRecommendationItem[] {
  const flattened: MixedRecommendationItem[] = [];
  for (const day of days) {
    for (const item of day.items) {
      flattened.push({
        id: `series-schedule:${day.label}:${item.slug}`,
        title: item.title,
        image: getHDThumbnail(item.poster || ''),
        href: `/series/${item.slug}`,
        theme: getSeriesTheme(item.type),
        subtitle: `${day.label} • ${formatSeriesCardSubtitle(item)}`.replace(/\s•\s$/, ''),
        badgeText: getSeriesBadgeText(item.type),
      });
      if (flattened.length >= limit) {
        return flattened;
      }
    }
  }
  return flattened;
}

function toMangaItems(items: MangaSearchResult[], limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      const slug = extractSlugFromUrl(item.link || '') || item.slug;
      if (!slug || !item.title) return null;
      return {
        id: `manga:${slug}`,
        title: item.title,
        image: getHDThumbnail(item.image || item.thumbnail || ''),
        href: `/comic/${slug}`,
        theme: 'manga',
        subtitle: item.chapter || item.time_ago || undefined,
        badgeText: item.type || undefined,
      };
    })
    .filter(notNull)
    .slice(0, limit);
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

async function getHomeSections(): Promise<{ sections: HomeRecommendationSection[]; heroItems: HeroItem[] }> {
  const session = await getServerAuthStatus();
  const [seriesHub, movieHub, mangaPopularResponse, mangaLatestResponse] = await Promise.all([
    getSeriesHubData(32, { includeNsfw: session.authenticated }).catch(() => ({ popular: [], latest: [], dramaSpotlight: [], weeklySchedule: [], filters: [] })),
    getMovieHubData(32, { includeNsfw: session.authenticated }).catch(() => ({ popular: [], latest: [] })),
    getPopularManga(40, { includeNsfw: session.authenticated }).catch(() => ({ comics: [] })),
    getNewManga(1, 40, { includeNsfw: session.authenticated }).catch(() => ({ comics: [] })),
  ]);

  const seriesLatestItems = toSeriesItems(seriesHub.latest, 24);
  const seriesPopularItems = toSeriesItems(seriesHub.popular, 24);
  const animeLaneItems = toSeriesItems(seriesHub.latest.filter((item) => item.type === 'anime'), 24);
  const dramaLaneItems = toSeriesItems(seriesHub.dramaSpotlight, 24);
  const donghuaLaneItems = toSeriesItems(seriesHub.latest.filter((item) => item.type === 'donghua'), 24);
  const releaseRadarItems = toSeriesScheduleItems(seriesHub.weeklySchedule, 24);
  const japanLaneItems = toSeriesItems(seriesHub.latest.filter((item) => item.country === 'Japan'), 24);
  const chinaLaneItems = toSeriesItems(seriesHub.latest.filter((item) => item.country === 'China'), 24);
  const koreaLaneItems = toSeriesItems(seriesHub.latest.filter((item) => item.country === 'South Korea'), 24);
  const movieLatestItems = toMovieItems(movieHub.latest, 24);
  const moviePopularItems = toMovieItems(movieHub.popular, 24);

  const mangaPopularRaw = mangaPopularResponse.comics || [];
  const mangaLatestRaw = mangaLatestResponse.comics || [];
  const mangaPopularItems = toMangaItems(mangaPopularRaw, 24);
  const mangaLatestMapped = toMangaItems(mangaLatestRaw, 40);

  const mangaTypeBySlug = new Map<string, 'manga' | 'manhwa' | 'manhua'>();
  for (const entry of mangaLatestRaw) {
    const slug = extractSlugFromUrl(entry.link || '') || entry.slug;
    if (!slug) continue;
    mangaTypeBySlug.set(slug, getMangaSubtype(entry));
  }

  const mangaLatestItems: MixedRecommendationItem[] = [];
  const manhwaLatestItems: MixedRecommendationItem[] = [];
  const manhuaLatestItems: MixedRecommendationItem[] = [];

  for (const item of mangaLatestMapped) {
    const slug = item.id.replace(/^manga:/, '');
    const normalizedType = mangaTypeBySlug.get(slug) ?? 'manga';
    if (normalizedType === 'manhwa') {
      manhwaLatestItems.push(item);
      continue;
    }
    if (normalizedType === 'manhua') {
      manhuaLatestItems.push(item);
      continue;
    }
    mangaLatestItems.push(item);
  }

  const popularMedia = uniqueById([
    ...seriesPopularItems.slice(0, 4),
    ...moviePopularItems.slice(0, 4),
    ...mangaPopularItems.slice(0, 4),
    ...donghuaLaneItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const loversByCommunity = uniqueById([
    ...mangaPopularItems.slice(0, 5),
    ...donghuaLaneItems.slice(0, 4),
    ...seriesPopularItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const freshThisWeek = uniqueById([
    ...seriesLatestItems.slice(0, 4),
    ...movieLatestItems.slice(0, 4),
    ...mangaLatestMapped.slice(0, 4),
    ...donghuaLaneItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const sections: HomeRecommendationSection[] = [
    buildHomeSection('series-latest', 'Latest Episodes', 'Semua judul episodik canonical: anime, donghua, dan drama hidup di satu lane series', 'series', seriesLatestItems, '/series'),
    buildHomeSection('series-popular', 'Popular Across Series', 'Judul episodik paling ramai dari katalog series canonical', 'popular', seriesPopularItems, '/series'),
    buildHomeSection('movie-latest', 'Movie Terbaru', 'Film terbaru siap ditonton', 'movie', movieLatestItems, '/movies'),
    buildHomeSection('series-anime', 'Anime in Series', 'Lane anime Jepang yang sekarang dibaca dari series catalog yang sama', 'series', animeLaneItems, '/series'),
    buildHomeSection('series-radar', 'Release Radar', 'Jadwal mingguan yang diturunkan langsung dari release_day dan cadence di database', 'series', releaseRadarItems, '/series'),
    buildHomeSection('series-donghua', 'Donghua Spotlight', 'Animation dari China yang sekarang sepenuhnya masuk ke series canonical', 'series', donghuaLaneItems, '/series'),
    buildHomeSection('series-drama', 'Drama Spotlight', 'Drama episodik canonical dari database, tetap terpisah dari Drachin', 'series', dramaLaneItems, '/series'),
    buildHomeSection('series-japan', 'Japan Lane', 'Series dengan rilis Jepang dari taxonomy canonical', 'series', japanLaneItems, '/series'),
    buildHomeSection('series-china', 'China Lane', 'Series dari China, termasuk donghua dan live-action yang sudah ternormalisasi', 'series', chinaLaneItems, '/series'),
    buildHomeSection('series-korea', 'South Korea Lane', 'Series Korea dari canonical metadata, terpisah dari short drama provider', 'series', koreaLaneItems, '/series'),
    buildHomeSection('manga-latest', 'Manga Terbaru', 'Chapter manga terbaru', 'manga', mangaLatestItems, '/comic/manga'),
    buildHomeSection('manhwa-latest', 'Manhwa Terbaru', 'Update manhwa terbaru', 'manhwa', manhwaLatestItems, '/comic/manhwa'),
    buildHomeSection('manhua-latest', 'Manhua Terbaru', 'Update manhua terbaru', 'manhua', manhuaLatestItems, '/comic/manhua'),
    buildHomeSection('popular-media', 'Populer Media', 'Pilihan populer lintas kategori', 'popular', popularMedia),
    buildHomeSection('top-reading', 'Top Reading', 'Judul paling banyak dibaca saat ini', 'reading', mangaPopularItems, '/comic'),
    buildHomeSection('community-lovers', 'Lovers by Community', 'Favorit komunitas dari tren terbaru', 'community', loversByCommunity),
    buildHomeSection('fresh-week', 'Fresh This Week', 'Rangkuman rilisan baru yang lagi naik', 'fresh', freshThisWeek),
  ];

  const heroItems = uniqueById([
    ...moviePopularItems.slice(0, 2),
    ...seriesPopularItems.slice(0, 2),
    ...mangaPopularItems.slice(0, 1),
    ...donghuaLaneItems.slice(0, 1),
  ])
    .map(recommendationToHero)
    .filter((item): item is HeroItem => item !== null)
    .slice(0, 5);

  return { sections, heroItems };
}

export default async function HomePage() {
  const { sections, heroItems } = await getHomeSections();
  return <HomePageClient heroItems={heroItems} sections={sections} />;
}
