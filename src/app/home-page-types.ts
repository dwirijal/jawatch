import type { ThemeType } from '@/lib/utils';

export type HeroItem = {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  type: 'anime' | 'movie' | 'manga' | 'donghua' | 'series';
  tags: string[];
  rating: string;
};

export type HomeSectionIconKey =
  | 'anime'
  | 'movie'
  | 'series'
  | 'donghua'
  | 'manga'
  | 'manhwa'
  | 'manhua'
  | 'popular'
  | 'genre'
  | 'blockbuster'
  | 'mal'
  | 'reading'
  | 'community'
  | 'imdb'
  | 'fresh';

export interface MixedRecommendationItem {
  id: string;
  title: string;
  image: string;
  href: string;
  theme: Exclude<ThemeType, 'default'> | 'novel';
  subtitle?: string;
  badgeText?: string;
}

export interface HomeRecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  iconKey: HomeSectionIconKey;
  viewAllHref?: string;
  items: MixedRecommendationItem[];
}
