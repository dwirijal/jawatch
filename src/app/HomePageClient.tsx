'use client';

import * as React from 'react';
import { HomePageView } from '@/components/organisms/HomePageView';
import type { HeroItem } from '@/components/organisms/HeroCarousel';
import type { ThemeType } from '@/lib/utils';

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

export interface HomeRecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  iconKey: HomeSectionIconKey;
  viewAllHref?: string;
  items: MixedRecommendationItem[];
}

export interface MixedRecommendationItem {
  id: string;
  title: string;
  image: string;
  href: string;
  theme: Exclude<ThemeType, 'default' | 'drama'>;
  subtitle?: string;
  badgeText?: string;
}

interface HomePageClientProps {
  heroItems: HeroItem[];
  sections: HomeRecommendationSection[];
}

export default function HomePageClient({ heroItems, sections }: HomePageClientProps) {
  return <HomePageView heroItems={heroItems} sections={sections} />;
}
