'use client';

import * as React from 'react';
import { Grid3X3, type LucideIcon } from 'lucide-react';
import { renderLucideIcon } from '@/lib/lucide-icons';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface MediaHubHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconName?: string;
  theme: ThemeType;
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  containerClassName?: string;
  layoutVariant?: 'default' | 'editorial';
}

export function MediaHubHeader({
  title,
  description,
  icon: Icon,
  iconName,
  theme,
  eyebrow,
  children,
  footer,
  containerClassName = 'app-container',
  layoutVariant = 'default',
}: MediaHubHeaderProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;
  const titleClassName = cn(
    'max-w-4xl text-balance font-[var(--font-heading)] font-bold tracking-[-0.06em] text-foreground',
    layoutVariant === 'editorial'
      ? 'text-[clamp(2.8rem,6vw,4.85rem)] leading-[0.94]'
      : 'text-[clamp(2.35rem,5vw,4rem)] leading-[0.96]'
  );
  const iconWrapperClassName = cn(
    'mt-1 flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border-subtle shadow-[0_18px_44px_-30px_var(--shadow-color)]',
    layoutVariant === 'editorial' ? 'h-12 w-12 md:h-14 md:w-14' : 'h-11 w-11 md:h-12 md:w-12',
    config.primary
  );
  const iconClassName = cn(layoutVariant === 'editorial' ? 'h-6 w-6 md:h-7 md:w-7' : 'h-5 w-5 md:h-6 md:w-6', config.contrast);

  if (layoutVariant === 'editorial') {
    return (
      <header className="surface-panel-elevated relative overflow-hidden px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8">
        <div className={cn('pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full opacity-[0.2] blur-3xl', config.primary)} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />
        <div className={cn(containerClassName, 'relative z-10 space-y-5 md:space-y-6')}>
          <div className={cn('grid gap-5 lg:gap-6', children ? 'xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] xl:items-end' : undefined)}>
            <div className="space-y-4 md:space-y-5">
              {eyebrow ? (
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
              ) : null}

              <div className="max-w-4xl space-y-3 md:space-y-4">
                <div className="flex items-start gap-3.5 md:gap-4">
                  <div className={iconWrapperClassName}>
                    {Icon ? (
                      <Icon className={iconClassName} />
                    ) : iconName ? (
                      renderLucideIcon(iconName, iconClassName)
                    ) : (
                      <Grid3X3 className={iconClassName} />
                    )}
                  </div>

                  <div className="min-w-0 space-y-3">
                    <h1 className={titleClassName}>{title}</h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[1.02rem] md:leading-7">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {children ? (
              <div className="flex min-h-[3rem] flex-wrap items-center gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-3 md:gap-3 md:p-4 xl:justify-end">
                <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
                  {children}
                </div>
              </div>
            ) : null}
          </div>

          {footer ? (
            <div className="flex min-h-[3.5rem] flex-col gap-3 border-t border-border-subtle pt-4 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4">
              {footer}
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="surface-panel-elevated relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <div className={cn('pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-[0.18] blur-3xl', config.primary)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_72%)]" />
      <div className={cn(containerClassName, 'relative z-10 space-y-5 md:space-y-6')}>
        <div className={cn('grid gap-5 lg:gap-6', children ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end' : undefined)}>
          <div className="space-y-4 md:space-y-5">
            {eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
            ) : null}

            <div className="flex items-start gap-3 md:gap-4">
              <div className={iconWrapperClassName}>
                {Icon ? (
                  <Icon className={iconClassName} />
                ) : iconName ? (
                  renderLucideIcon(iconName, iconClassName)
                ) : (
                  <Grid3X3 className={iconClassName} />
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <h1 className={titleClassName}>{title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[1.02rem] md:leading-7">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {children ? (
            <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_92%,white_8%)_0%,var(--surface-1)_100%)] p-3 md:gap-3 md:p-4 lg:justify-end">
              {children}
            </div>
          ) : null}
        </div>

        {footer ? (
          <div className="flex flex-col gap-3 border-t border-border-subtle pt-4 md:flex-row md:items-center md:justify-between md:gap-4">
            {footer}
          </div>
        ) : null}
      </div>
    </header>
  );
}
