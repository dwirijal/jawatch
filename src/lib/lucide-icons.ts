import { createElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BadgeAlert,
  BookOpen,
  CalendarDays,
  Clapperboard,
  Clock,
  Film,
  Flame,
  Globe2,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Tag,
  Timer,
  Tv,
  Zap,
} from 'lucide-react';

const ICONS = {
  BadgeAlert,
  BookOpen,
  CalendarDays,
  Clapperboard,
  Clock,
  Film,
  Flame,
  Globe2,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Tag,
  Timer,
  Tv,
  Zap,
} satisfies Record<string, LucideIcon>;

export type LucideIconName = keyof typeof ICONS;

export function resolveLucideIcon(iconName?: string | null): LucideIcon | null {
  if (!iconName) {
    return null;
  }

  return ICONS[iconName as LucideIconName] ?? null;
}

export function renderLucideIcon(iconName: string | null | undefined, className: string): ReactNode {
  const Icon = resolveLucideIcon(iconName);

  if (!Icon) {
    return null;
  }

  return createElement(Icon, { className });
}
