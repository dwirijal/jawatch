import HomePageClient, { type HomeRecommendationSection } from './HomePageClient';
import type { HeroItem } from '@/components/organisms/HeroCarousel';
import type { MixedRecommendationItem } from './HomePageClient';
import {
  getHDThumbnail,
  extractSlugFromUrl,
  getMangaSubtype,
  getNewManga,
  getPopularManga,
  type MangaSearchResult,
} from '@/lib/adapters/comic';
import { getAnimeHomeItems, getKanataAnimeByGenre } from '@/lib/adapters/anime';
import { donghua } from '@/lib/adapters/donghua';
import { getMovieGenreItems, getMovieHomeSection, getMovieHubData } from '@/lib/adapters/movie';
import type { MovieCardItem, KanataAnime } from '@/lib/types';

const SECTION_LIMIT = 12;

function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

type AnimeLikeItem = {
  slug?: string;
  title?: string;
  thumb?: string;
  image?: string;
  status?: string;
  episode?: string;
  type?: string;
  score?: string | number;
};

function toAnimeItems(items: AnimeLikeItem[], limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      const slug = String(item.slug || '');
      const title = String(item.title || '');
      if (!slug || !title) return null;
      const subtitleParts = [String(item.status || ''), String(item.episode || '')].filter(Boolean);
      return {
        id: `anime:${slug}`,
        title,
        image: getHDThumbnail(String(item.thumb || item.image || '')),
        href: `/anime/${slug}`,
        theme: 'anime' as const,
        subtitle: subtitleParts.join(' • ') || undefined,
        badgeText: String(item.type || 'Anime'),
      };
    })
    .filter(notNull)
    .slice(0, limit);
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
        subtitle: [item.year, item.type?.toUpperCase()].filter(Boolean).join(' • ') || undefined,
        badgeText: item.rating ? `★ ${item.rating}` : item.type?.toUpperCase(),
      };
    })
    .filter(notNull)
    .slice(0, limit);
}

function toDonghuaItems(items: Array<Record<string, unknown>>, limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      const slug = String(item.slug ?? '');
      const title = String(item.title ?? '');
      if (!slug || !title) return null;
      return {
        id: `donghua:${slug}`,
        title,
        image: getHDThumbnail(String(item.thumb ?? item.image ?? '')),
        href: `/donghua/${slug}`,
        theme: 'donghua' as const,
        subtitle: String(item.episode ?? '') || undefined,
        badgeText: String(item.status ?? 'Donghua') || undefined,
      };
    })
    .filter(notNull)
    .slice(0, limit);
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
        href: `/manga/${slug}`,
        theme: 'manga' as const,
        subtitle: item.chapter || item.time_ago || undefined,
        badgeText: item.type || undefined,
      };
    })
    .filter(notNull)
    .slice(0, limit);
}

function toKanataAnimeItems(items: KanataAnime[], limit = SECTION_LIMIT): MixedRecommendationItem[] {
  return items
    .map<MixedRecommendationItem | null>((item) => {
      if (!item.slug || !item.title) return null;
      return {
        id: `anime:${item.slug}`,
        title: item.title,
        image: getHDThumbnail(item.thumb || ''),
        href: `/anime/${item.slug}`,
        theme: 'anime',
        subtitle: item.status || item.episode || undefined,
        badgeText: item.type || 'Anime',
      };
    })
    .filter(notNull)
    .slice(0, limit);
}

function recommendationToHero(item: MixedRecommendationItem): HeroItem | null {
  const segments = item.href.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const [route, slug] = segments;
  const type = route === 'movies' ? 'movie' : route === 'manga' ? 'manga' : route === 'donghua' ? 'donghua' : route === 'anime' ? 'anime' : null;
  if (!type) return null;
  return {
    id: slug,
    title: item.title,
    image: item.image || '/favicon.ico',
    banner: item.image || '/favicon.ico',
    description: item.subtitle || 'Discover your next favorite title.',
    type,
    tags: [item.badgeText || type.toUpperCase(), 'Recommended'].filter(Boolean).slice(0, 3),
    rating: item.badgeText?.replace(/^★\s*/, '') || 'N/A',
  };
}

async function getHomeSections(): Promise<{ sections: HomeRecommendationSection[]; heroItems: HeroItem[] }> {
  const [animeHomeRaw, movieHub, movieTrendingRaw, mangaPopularResponse, mangaLatestResponse, donghuaHomeRaw, animeActionRaw, movieActionRaw] = await Promise.all([
    getAnimeHomeItems(32).catch(() => []),
    getMovieHubData(32).catch(() => ({ popular: [], latest: [] })),
    getMovieHomeSection('trending', 32).catch(() => []),
    getPopularManga().catch(() => ({ comics: [] })),
    getNewManga(1, 40).catch(() => ({ comics: [] })),
    donghua.getHome().catch(() => ({ latest_updates: [], ongoing_series: [] })),
    getKanataAnimeByGenre('action').catch(() => []),
    getMovieGenreItems('action', 32).catch(() => []),
  ]);

  const mangaPopularRaw = mangaPopularResponse.comics || [];
  const mangaLatestRaw = mangaLatestResponse.comics || [];

  const animeHomeItems = toAnimeItems(animeHomeRaw, 24);
  const movieLatestItems = toMovieItems(movieHub.latest, 24);
  const moviePopularItems = toMovieItems(movieHub.popular, 24);
  const movieTrendingItems = toMovieItems(movieTrendingRaw, 24);
  const moviePool = uniqueById([...movieTrendingItems, ...moviePopularItems, ...movieLatestItems]);
  const donghuaLatestItems = toDonghuaItems(donghuaHomeRaw.latest_updates as Array<Record<string, unknown>>, 24);
  const donghuaOngoingItems = toDonghuaItems(donghuaHomeRaw.ongoing_series as Array<Record<string, unknown>>, 24);

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

  const animeScoreSorted = toAnimeItems(
    [...animeHomeRaw].sort((left, right) => toNumber(right.score) - toNumber(left.score)),
    SECTION_LIMIT
  );

  const movieRatingSorted = [...moviePool].sort((left, right) => {
    const leftRating = toNumber(left.badgeText);
    const rightRating = toNumber(right.badgeText);
    return rightRating - leftRating;
  });
  const seriesLatestItems = moviePool
    .filter((item) => {
      const subtitle = item.subtitle?.toLowerCase() ?? '';
      const badge = item.badgeText?.toLowerCase() ?? '';
      return subtitle.includes('series') || subtitle.includes('tv') || badge.includes('series') || badge.includes('tv');
    })
    .slice(0, SECTION_LIMIT);

  const genreBlend = uniqueById([
    ...toKanataAnimeItems(animeActionRaw, 8),
    ...toMovieItems(movieActionRaw, 8),
  ]).slice(0, SECTION_LIMIT);

  const popularMedia = uniqueById([
    ...animeHomeItems.slice(0, 4),
    ...moviePopularItems.slice(0, 4),
    ...mangaPopularItems.slice(0, 4),
    ...donghuaLatestItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const loversByCommunity = uniqueById([
    ...mangaPopularItems.slice(0, 5),
    ...donghuaOngoingItems.slice(0, 4),
    ...animeScoreSorted.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const freshThisWeek = uniqueById([
    ...animeHomeItems.slice(0, 4),
    ...movieLatestItems.slice(0, 4),
    ...mangaLatestMapped.slice(0, 4),
    ...donghuaLatestItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const sections: HomeRecommendationSection[] = [
    { id: 'anime-latest', title: 'Anime Terbaru', subtitle: 'Rilis anime terbaru dari katalog live', iconKey: 'anime', viewAllHref: '/anime', items: animeHomeItems.slice(0, SECTION_LIMIT) },
    { id: 'movie-latest', title: 'Movie Terbaru', subtitle: 'Film terbaru siap ditonton', iconKey: 'movie', viewAllHref: '/movies', items: movieLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'series-latest', title: 'Series Terbaru', subtitle: 'Serial terbaru dari berbagai provider', iconKey: 'series', viewAllHref: '/movies', items: seriesLatestItems.length > 0 ? seriesLatestItems : movieLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'donghua-latest', title: 'Donghua Terbaru', subtitle: 'Update donghua paling baru', iconKey: 'donghua', viewAllHref: '/donghua', items: donghuaLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'manga-latest', title: 'Manga Terbaru', subtitle: 'Chapter manga terbaru', iconKey: 'manga', viewAllHref: '/manga', items: mangaLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'manhwa-latest', title: 'Manhwa Terbaru', subtitle: 'Update manhwa terbaru', iconKey: 'manhwa', viewAllHref: '/manhwa', items: manhwaLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'manhua-latest', title: 'Manhua Terbaru', subtitle: 'Update manhua terbaru', iconKey: 'manhua', viewAllHref: '/manhua', items: manhuaLatestItems.slice(0, SECTION_LIMIT) },
    { id: 'popular-media', title: 'Populer Media', subtitle: 'Pilihan populer lintas kategori', iconKey: 'popular', items: popularMedia },
    { id: 'genre-action', title: 'Media by Genre: Action', subtitle: 'Rekomendasi action dari anime dan movie', iconKey: 'genre', items: genreBlend },
    { id: 'blockbuster', title: 'Blockbuster Picks', subtitle: 'Highlight judul dengan hype tertinggi', iconKey: 'blockbuster', viewAllHref: '/movies', items: movieRatingSorted.slice(0, SECTION_LIMIT) },
    { id: 'top-mal', title: 'Top MyAnimeList', subtitle: 'Peringkat tertinggi berdasarkan skor anime', iconKey: 'mal', viewAllHref: '/anime', items: animeScoreSorted.slice(0, SECTION_LIMIT) },
    { id: 'top-reading', title: 'Top Reading', subtitle: 'Judul paling banyak dibaca saat ini', iconKey: 'reading', viewAllHref: '/manga', items: mangaPopularItems.slice(0, SECTION_LIMIT) },
    { id: 'community-lovers', title: 'Lovers by Community', subtitle: 'Favorit komunitas dari tren terbaru', iconKey: 'community', items: loversByCommunity },
    { id: 'top-imdb', title: 'Top IMDb Vibe', subtitle: 'Kurasi berdasarkan skor film tertinggi', iconKey: 'imdb', viewAllHref: '/movies', items: movieRatingSorted.slice(0, SECTION_LIMIT) },
    { id: 'fresh-week', title: 'Fresh This Week', subtitle: 'Rangkuman rilisan baru yang lagi naik', iconKey: 'fresh', items: freshThisWeek },
  ];

  const heroItems = uniqueById([
    ...animeHomeItems.slice(0, 1),
    ...moviePopularItems.slice(0, 1),
    ...mangaPopularItems.slice(0, 1),
    ...donghuaLatestItems.slice(0, 1),
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
