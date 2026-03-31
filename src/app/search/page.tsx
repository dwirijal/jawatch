import SearchResultsPageClient from './SearchResultsPageClient';
import { searchManga } from '@/lib/adapters/comic-server';
import { searchMovieCatalog } from '@/lib/adapters/movie';
import { searchSeriesCatalog } from '@/lib/adapters/series';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import type { MangaSearchResult, MovieCardItem } from '@/lib/types';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
  type SeriesCardItem,
} from '@/lib/series-presentation';

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

function normalizeType(value?: string): 'all' | 'series' | 'movies' | 'comic' {
  if (value === 'series' || value === 'movies' || value === 'comic') {
    return value;
  }
  if (value === 'manga') {
    return 'comic';
  }
  return 'all';
}

type SearchCardItem = {
  id: string;
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  badgeText?: string;
  theme: 'anime' | 'donghua' | 'drama' | 'movie' | 'manga';
};

type SearchDomainStateMap = Record<'series' | 'movies' | 'comic', {
  loading: boolean;
  error: string | null;
  items: SearchCardItem[];
}>;

function emptyDomainState(): SearchDomainStateMap {
  return {
    series: { loading: false, error: null, items: [] },
    movies: { loading: false, error: null, items: [] },
    comic: { loading: false, error: null, items: [] },
  };
}

function mapSeriesItems(items: SeriesCardItem[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `series:${item.slug}`,
    href: `/series/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: formatSeriesCardSubtitle(item) || undefined,
    badgeText: getSeriesBadgeText(item.type || 'anime'),
    theme: getSeriesTheme(item.type || 'anime'),
  }));
}

function mapMovieItems(items: MovieCardItem[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `movies:${item.slug}`,
    href: `/movies/${item.slug}`,
    title: item.title,
    image: item.poster,
    subtitle: [item.year, item.type?.toUpperCase()].filter(Boolean).join(' • ') || undefined,
    badgeText: item.rating ? `★ ${item.rating}` : item.type?.toUpperCase(),
    theme: 'movie',
  }));
}

function mapComicItems(items: MangaSearchResult[]): SearchCardItem[] {
  return items.map((item) => ({
    id: `manga:${item.slug}`,
    href: `/comic/${item.slug}`,
    title: item.title,
    image: item.thumbnail || item.image,
    subtitle: item.chapter || item.time_ago || undefined,
    badgeText: item.type || 'Manga',
    theme: 'manga',
  }));
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const type = normalizeType(params.type);
  const session = await getServerAuthStatus();
  const initialDomainState = emptyDomainState();

  if (query.length >= 2) {
    const domainLimit = type === 'all' ? 6 : 24;
    const options = { includeNsfw: session.authenticated };

    if (type === 'all' || type === 'series') {
      const seriesItems = await searchSeriesCatalog(query, domainLimit, options).catch(() => []);
      initialDomainState.series.items = mapSeriesItems(seriesItems);
    }
    if (type === 'all' || type === 'movies') {
      const movieItems = await searchMovieCatalog(query, domainLimit, options).catch(() => []);
      initialDomainState.movies.items = mapMovieItems(movieItems);
    }
    if (type === 'all' || type === 'comic') {
      const comicItems = await searchManga(query, 1, domainLimit, options).catch(() => ({ data: [] }));
      initialDomainState.comic.items = mapComicItems(comicItems.data || []);
    }
  }

  return <SearchResultsPageClient initialQuery={query} initialType={type} initialDomainState={initialDomainState} />;
}
