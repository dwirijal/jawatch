import type { ThemeType } from '@/lib/utils';

export type SearchGroupKey = 'top' | 'movies' | 'series' | 'comic';

export type SearchDomain = 'all' | 'series' | 'movies' | 'comic';
export type SearchRouteType = Exclude<SearchDomain, 'all'>;
export type SearchTheme = Exclude<ThemeType, 'default'>;
export type SearchSource = 'opensearch' | 'fallback' | 'empty';

export type SearchResultItem = {
  id: string;
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  routeType: SearchRouteType;
  theme: SearchTheme;
  score?: number;
};

export type SearchResultGroup = {
  key: SearchRouteType;
  label: string;
  total: number;
  items: SearchResultItem[];
};

export type UnifiedSearchResult = {
  query: string;
  domain: SearchDomain;
  source: SearchSource;
  total: number;
  topMatch: SearchResultItem | null;
  groups: SearchResultGroup[];
};

export type SearchIndexDocument = {
  id: string;
  slug: string;
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  routeType: SearchRouteType;
  theme: SearchTheme;
  keywords?: string[];
  popularity?: number;
  updatedAt?: string;
};

export function normalizeSearchDomain(value?: string): SearchDomain {
  if (value === 'series' || value === 'movies' || value === 'comic') {
    return value;
  }
  if (value === 'manga' || value === 'comics') {
    return 'comic';
  }
  return 'all';
}

export function getSearchGroupLabel(domain: SearchRouteType): string {
  switch (domain) {
    case 'series':
      return 'Series';
    case 'movies':
      return 'Film';
    case 'comic':
      return 'Komik';
    default:
      return 'Hasil';
  }
}
