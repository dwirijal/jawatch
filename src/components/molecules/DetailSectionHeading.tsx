import * as React from 'react';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface DetailSectionHeadingProps {
  title: string;
  theme: ThemeType;
  aside?: React.ReactNode;
}

export function DetailSectionHeading({ title, theme, aside }: DetailSectionHeadingProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <div className="flex items-center justify-between gap-[var(--space-sm)] border-b border-border-subtle pb-4 md:pb-5">
      <div className="flex items-center gap-[calc(var(--space-xs)+var(--space-2xs))]">
        <div className={cn('h-7 w-1.5 rounded-full', config.primary)} />
        <h2 className="text-xl font-black tracking-[var(--type-tracking-normal)] text-[var(--accent-contrast)] md:text-2xl">{title}</h2>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}
