import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ThemeType = 'anime' | 'manga' | 'donghua' | 'movie' | 'drama' | 'novel' | 'default';

/**
 * Centralized theme configuration with full Tailwind class names
 * for better readability and compiler safety.
 */
export const THEME_CONFIG = {
  anime: {
    primary: "bg-blue-600",
    text: "text-blue-500",
    hoverText: "group-hover:text-blue-400",
    border: "border-blue-500/30",
    hoverBorder: "group-hover:border-blue-500/50",
    ring: "focus:ring-blue-500",
    bg: "bg-blue-600/10",
    shadow: "shadow-blue-600/20",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  },
  manga: {
    primary: "bg-orange-600",
    text: "text-orange-500",
    hoverText: "group-hover:text-orange-400",
    border: "border-orange-500/30",
    hoverBorder: "group-hover:border-orange-500/50",
    ring: "focus:ring-orange-500",
    bg: "bg-orange-600/10",
    shadow: "shadow-orange-600/20",
    glow: "shadow-[0_0_20px_rgba(234,88,12,0.3)]",
  },
  donghua: {
    primary: "bg-red-600",
    text: "text-red-500",
    hoverText: "group-hover:text-red-400",
    border: "border-red-500/30",
    hoverBorder: "group-hover:border-red-500/50",
    ring: "focus:ring-red-500",
    bg: "bg-red-600/10",
    shadow: "shadow-red-600/20",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
  },
  movie: {
    primary: "bg-indigo-600",
    text: "text-indigo-500",
    hoverText: "group-hover:text-indigo-400",
    border: "border-indigo-500/30",
    hoverBorder: "group-hover:border-indigo-500/50",
    ring: "focus:ring-indigo-500",
    bg: "bg-indigo-600/10",
    shadow: "shadow-indigo-600/20",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
  },
  drama: {
    primary: "bg-rose-600",
    text: "text-rose-400",
    hoverText: "group-hover:text-rose-300",
    border: "border-rose-500/30",
    hoverBorder: "group-hover:border-rose-500/50",
    ring: "focus:ring-rose-500",
    bg: "bg-rose-600/10",
    shadow: "shadow-rose-600/20",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.28)]",
  },
  novel: {
    primary: "bg-amber-700",
    text: "text-amber-300",
    hoverText: "group-hover:text-amber-200",
    border: "border-amber-500/30",
    hoverBorder: "group-hover:border-amber-500/50",
    ring: "focus:ring-amber-500",
    bg: "bg-amber-700/10",
    shadow: "shadow-amber-700/20",
    glow: "shadow-[0_0_20px_rgba(180,83,9,0.26)]",
  },
  default: {
    primary: "bg-zinc-100",
    text: "text-zinc-100",
    hoverText: "group-hover:text-white",
    border: "border-zinc-800",
    hoverBorder: "group-hover:border-zinc-700",
    ring: "focus:ring-zinc-700",
    bg: "bg-zinc-900",
    shadow: "shadow-black/20",
    glow: "shadow-none",
  }
} as const;

export function resolveThemeFromPathname(pathname?: string | null): ThemeType {
  if (!pathname) return 'default';
  if (pathname === '/movies' || pathname.startsWith('/movies/')) return 'movie';
  if (pathname === '/anime' || pathname.startsWith('/anime/')) return 'anime';
  if (pathname === '/donghua' || pathname.startsWith('/donghua/')) return 'donghua';
  if (
    pathname === '/drachin' ||
    pathname.startsWith('/drachin/') ||
    pathname === '/dramabox' ||
    pathname.startsWith('/dramabox/')
  ) {
    return 'drama';
  }
  if (
    pathname === '/manga' ||
    pathname.startsWith('/manga/') ||
    pathname === '/manhwa' ||
    pathname.startsWith('/manhwa/') ||
    pathname === '/manhua' ||
    pathname.startsWith('/manhua/')
  ) {
    return 'manga';
  }
  if (pathname === '/novel' || pathname.startsWith('/novel/')) return 'novel';
  return 'default';
}

export function getMediaPosterAspectClass(theme: ThemeType): string {
  switch (theme) {
    case 'movie':
      return 'aspect-[2/3]';
    case 'drama':
      return 'aspect-[9/16]';
    case 'novel':
      return 'aspect-[210/297]';
    case 'anime':
    case 'manga':
    case 'donghua':
    case 'default':
    default:
      return 'aspect-[3/4]';
  }
}
