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
        'inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 p-1 text-muted-foreground shadow-[0_18px_36px_-28px_rgba(12,10,9,0.38)] backdrop-blur-xl',
        compact && 'gap-1 p-[3px]',
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
              'focus-tv inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-200',
              compact ? 'h-9 min-w-9 justify-center px-2.5' : 'h-10',
              active
                ? 'border-transparent bg-foreground text-background shadow-[0_20px_40px_-30px_rgba(12,10,9,0.8)]'
                : 'border-transparent bg-transparent text-muted-foreground hover:border-border-subtle hover:bg-surface-elevated hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {!compact ? <span>{option.value}</span> : null}
            {!compact && showResolved ? (
              <span className="rounded-full border border-current/16 px-2 py-0.5 text-[9px] opacity-75">
                {resolved}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
