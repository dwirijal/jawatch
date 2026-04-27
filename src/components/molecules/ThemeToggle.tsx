'use client';

import { Monitor, MoonStar, SunMedium } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useColorModeStore } from '@/store/useColorModeStore';
import type { ColorModePreference } from '@/lib/color-mode';

const THEME_OPTIONS: Array<{
  icon: typeof SunMedium;
  label: string;
  value: ColorModePreference;
}> = [
  { icon: Monitor, label: 'System theme', value: 'system' },
  { icon: SunMedium, label: 'Light theme', value: 'light' },
  { icon: MoonStar, label: 'Dark theme', value: 'dark' },
];

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const preference = useColorModeStore((state) => state.preference);
  const resolved = useColorModeStore((state) => state.resolved);
  const setPreference = useColorModeStore((state) => state.setPreference);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-[var(--space-2xs)] rounded-full border border-border-subtle bg-surface-1 p-[var(--space-2xs)] text-muted-foreground shadow-[0_18px_36px_-28px_var(--shadow-color)] backdrop-blur-xl',
        compact && 'p-[calc(var(--space-2xs)*0.75)]',
        className,
      )}
      role="group"
      aria-label="Choose color theme"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        const showResolved = option.value === 'system';

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => setPreference(option.value)}
            className={cn(
              'focus-tv inline-flex cursor-pointer items-center gap-[var(--space-xs)] rounded-full border px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] transition-all duration-300 active:scale-95',
              compact ? 'h-[var(--size-control-sm)] min-w-[var(--size-control-sm)] justify-center px-[calc(var(--space-xs)+var(--space-2xs))]' : 'h-[calc(var(--size-control-md)-var(--space-2xs))]',
              active
                ? 'scale-100 border-transparent bg-foreground text-background shadow-[0_12px_24px_-10px_var(--shadow-color-strong)]'
                : 'border-transparent bg-transparent text-muted-foreground hover:scale-105 hover:border-border-subtle hover:bg-surface-elevated hover:text-foreground hover:shadow-sm',
            )}
          >
            <Icon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            {!compact ? <span>{option.value}</span> : null}
            {!compact && showResolved ? (
              <span className="rounded-full border border-current/16 px-[var(--space-xs)] py-[calc(var(--space-2xs)/2)] text-[var(--type-size-xs)] opacity-75">
                {resolved}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
