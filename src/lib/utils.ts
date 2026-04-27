import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ThemeType = 'anime' | 'manga' | 'donghua' | 'movie' | 'drama' | 'novel' | 'default';
export type CardAspectRatio = 'default' | 'feature' | 'theme' | 'landscape';
export const DEFAULT_MEDIA_BACKGROUND = 'https://imgcdn.dev/i/YRY7Rd';
export const MEDIA_BACKGROUND_FIELD_CANDIDATES = [
  'background_url',
  'background',
  'background_image',
  'backgroundImage',
  'backdrop_url',
  'backdrop',
  'backdrop_image',
  'backdropImage',
] as const;
export const MEDIA_LOGO_FIELD_CANDIDATES = [
  'logo_url',
  'logo',
  'title_logo',
  'title_logo_url',
  'titleLogo',
  'titleLogoUrl',
  'clearlogo',
  'clearlogo_url',
  'clear_logo',
] as const;

export function normalizeAssetUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }

  return normalized;
}

export function pickAssetUrl(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizeAssetUrl(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

export function pickAssetFromRecord(
  record: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): string {
  if (!record) {
    return '';
  }

  return pickAssetUrl(...keys.map((key) => record[key]));
}

export function resolveMediaBackgroundUrl(...values: unknown[]): string {
  return pickAssetUrl(...values) || DEFAULT_MEDIA_BACKGROUND;
}

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
 * Compatibility shim for legacy domain variants.
 * Runtime color tokens now collapse to a single primary family, but consumers
 * still pass domain-flavored variant names across the UI.
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
  if (pathname === '/watch/shorts' || pathname.startsWith('/watch/shorts/')) return 'drama';
  if (pathname === '/read/comics' || pathname.startsWith('/read/comics/')) return 'manga';
  if (pathname === '/shorts' || pathname.startsWith('/shorts/')) return 'drama';
  if (pathname === '/comics' || pathname.startsWith('/comics/')) return 'manga';
  if (pathname === '/watch' || pathname.startsWith('/watch/')) return 'movie';
  if (pathname === '/read' || pathname.startsWith('/read/')) return 'manga';
  if (pathname === '/movies' || pathname.startsWith('/movies/')) return 'movie';
  if (pathname === '/series' || pathname.startsWith('/series/')) return 'drama';
  return 'default';
}

export function getMediaPosterAspectClass(theme: ThemeType): string {
  switch (theme) {
    case 'movie':
      return 'aspect-[2/3]';
    case 'anime':
    case 'donghua':
    case 'drama':
    case 'default':
      return 'aspect-[3/4]';
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
    case 'landscape':
      return 'aspect-[16/9]';
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
