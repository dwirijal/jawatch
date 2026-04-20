import type { CSSProperties } from 'react';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';
import type {
  HeroItem,
  HomeRecommendationSection,
  MixedRecommendationItem,
} from '@/features/home/home-page-types';
import type { ThemeType } from '@/lib/utils';
import { SHORTS_HUB_ENABLED } from '@/lib/shorts-paths.ts';

export type SectionLayoutMode = 'rail' | 'grid';
export type CardGridDensity = 'dense' | 'default' | 'comfortable';
export type SectionLayoutConfig = {
  mode: SectionLayoutMode;
  railVariant: CardRailVariant;
  gridDensity: CardGridDensity;
};

export const HERO_TITLE_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export const HERO_DESC_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export const HERO_FALLBACK_DESCRIPTION =
  'Pilihan terbaru dari jawatch buat nemenin waktu nonton dan baca kamu.';

export const HOME_LANE_LINKS = [
  { href: '/watch/movies', label: 'Film' },
  { href: '/watch/series', label: 'Series' },
  { href: '/read/comics', label: 'Komik' },
  ...(SHORTS_HUB_ENABLED ? [{ href: '/watch/shorts', label: 'Shorts' }] : []),
] as const;

const HOMEPAGE_SECTION_LAYOUTS: Partial<Record<string, SectionLayoutConfig>> = {
  'fresh-week': { mode: 'rail', railVariant: 'default', gridDensity: 'default' },
  blockbuster: { mode: 'rail', railVariant: 'default', gridDensity: 'default' },
  'popular-media': { mode: 'rail', railVariant: 'default', gridDensity: 'default' },
  'community-lovers': { mode: 'rail', railVariant: 'default', gridDensity: 'default' },
};

export function getThemeLabel(theme: MixedRecommendationItem['theme'] | HeroItem['type']) {
  switch (theme) {
    case 'anime':
      return 'Anime';
    case 'movie':
      return 'Film';
    case 'manga':
      return 'Komik';
    case 'donghua':
      return 'Donghua';
    case 'series':
    case 'drama':
      return 'Series';
    case 'novel':
      return 'Novel';
    default:
      return 'Konten';
  }
}

export function getSectionIconName(iconKey: HomeRecommendationSection['iconKey']) {
  switch (iconKey) {
    case 'fresh':
      return 'Flame';
    case 'anime':
      return 'Sparkles';
    case 'movie':
    case 'blockbuster':
    case 'imdb':
      return 'Film';
    case 'series':
      return 'Tv';
    case 'manga':
    case 'manhwa':
    case 'manhua':
    case 'reading':
      return 'BookOpen';
    case 'donghua':
      return 'Zap';
    case 'genre':
      return 'Tag';
    case 'popular':
    case 'mal':
    case 'community':
    default:
      return 'Sparkles';
  }
}

export function getThemeFromIconKey(iconKey: string): ThemeType {
  switch (iconKey) {
    case 'anime':
    case 'mal':
      return 'anime';
    case 'movie':
    case 'blockbuster':
    case 'imdb':
      return 'movie';
    case 'series':
      return 'drama';
    case 'manga':
    case 'reading':
    case 'manhwa':
    case 'manhua':
      return 'manga';
    case 'donghua':
      return 'donghua';
    default:
      return 'default';
  }
}

export function getSectionLayoutConfig(section: HomeRecommendationSection): SectionLayoutConfig {
  const explicit = HOMEPAGE_SECTION_LAYOUTS[section.id];
  if (explicit) {
    return explicit;
  }

  if (
    section.iconKey === 'fresh' ||
    section.iconKey === 'blockbuster' ||
    section.iconKey === 'popular' ||
    section.iconKey === 'community'
  ) {
    return {
      mode: 'rail',
      railVariant: 'default',
      gridDensity: 'default',
    };
  }

  return {
    mode: 'grid',
    railVariant: 'default',
    gridDensity: 'default',
  };
}

export function normalizeHeroValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() || '';
  if (!trimmed || trimmed.toUpperCase() === 'N/A') {
    return fallback;
  }

  return trimmed;
}

export function getHeroAuxiliaryTags(item: HeroItem) {
  const themeLabel = getThemeLabel(item.type).toLowerCase();
  const seen = new Set<string>();

  return item.tags
    .filter((tag) => {
      const normalized = tag.trim().toLowerCase();
      if (!normalized || normalized === themeLabel || normalized === 'recommended' || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, 2);
}

export function toDetailHref(item: HeroItem) {
  if (item.type === 'movie') {
    return `/movies/${item.id}`;
  }

  if (item.type === 'series') {
    return `/series/${item.id}`;
  }

  if (item.type === 'manga') {
    return `/comics/${item.id}`;
  }

  return `/${item.type}/${item.id}`;
}
