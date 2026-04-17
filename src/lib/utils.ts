import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ThemeType = 'anime' | 'manga' | 'donghua' | 'movie' | 'drama' | 'novel' | 'default';
export type CardAspectRatio = 'default' | 'feature' | 'theme';

function createThemeConfig(token: string) {
  return {
    primary: `bg-[var(--theme-${token}-fill)]`,
    text: `text-[var(--theme-${token}-text)]`,
    hoverText: `group-hover:text-[var(--theme-${token}-text)]`,
    border: `border-[color:var(--theme-${token}-border)]`,
    hoverBorder: `group-hover:border-[color:var(--theme-${token}-border)]`,
    ring: `focus-visible:ring-[color:var(--theme-${token}-border)]`,
    bg: `bg-[var(--theme-${token}-surface)]`,
    shadow: `shadow-[0_18px_42px_-30px_var(--theme-${token}-shadow)]`,
    glow: `shadow-[0_0_0_1px_var(--theme-${token}-border),0_24px_72px_-52px_var(--theme-${token}-shadow)]`,
    contrast: `text-[var(--theme-${token}-contrast)]`,
  };
}

/**
 * Centralized theme configuration aligned with the Luxury Editorial Design System.
 * Focuses on high-contrast typography and subtle premium accents.
 */
export const THEME_CONFIG = {
  anime: createThemeConfig('anime'),
  manga: createThemeConfig('manga'),
  donghua: createThemeConfig('donghua'),
  movie: createThemeConfig('movie'),
  drama: createThemeConfig('drama'),
  novel: createThemeConfig('novel'),
  default: createThemeConfig('default'),
} as const;

export function resolveThemeFromPathname(pathname?: string | null): ThemeType {
  if (!pathname) return 'default';
  if (pathname === '/watch' || pathname.startsWith('/watch/')) return 'movie';
  if (pathname === '/read' || pathname.startsWith('/read/')) return 'manga';
  if (pathname === '/movies' || pathname.startsWith('/movies/')) return 'movie';
  if (pathname === '/series' || pathname.startsWith('/series/')) return 'drama';
  if (
    pathname === '/watch/shorts' ||
    pathname.startsWith('/watch/shorts/') ||
    pathname === '/shorts' ||
    pathname.startsWith('/shorts/')
  ) {
    return 'drama';
  }
  if (
    pathname === '/read/comics' ||
    pathname.startsWith('/read/comics/') ||
    pathname === '/comics' ||
    pathname.startsWith('/comics/')
  ) {
    return 'manga';
  }
  return 'default';
}

export function getMediaPosterAspectClass(theme: ThemeType): string {
  switch (theme) {
    case 'movie':
    case 'anime':
    case 'donghua':
    case 'drama':
    case 'default':
      return 'aspect-[2/3]';
    case 'manga':
      return 'aspect-[3/4]';
    case 'novel':
      return 'aspect-[210/297]';
    default:
      return 'aspect-[2/3]';
  }
}

export function getCardAspectClass(aspectRatio: CardAspectRatio = 'default', theme: ThemeType = 'default'): string {
  switch (aspectRatio) {
    case 'default':
      return 'aspect-[3/4]';
    case 'feature':
      return 'aspect-[2/3]';
    case 'theme':
      return getMediaPosterAspectClass(theme);
    default:
      return 'aspect-[3/4]';
  }
}

export function getMediaKindLabel(theme: ThemeType): 'MOVIE' | 'SERIES' | 'COMIC' | 'NOVEL' | 'MEDIA' {
  switch (theme) {
    case 'movie':
      return 'MOVIE';
    case 'anime':
    case 'donghua':
    case 'drama':
      return 'SERIES';
    case 'manga':
      return 'COMIC';
    case 'novel':
      return 'NOVEL';
    default:
      return 'MEDIA';
  }
}
