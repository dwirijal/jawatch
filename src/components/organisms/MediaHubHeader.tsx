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

  if (layoutVariant === 'editorial') {
    return (
      <header className="surface-panel-elevated relative overflow-hidden px-4 py-9 sm:px-6 sm:py-10 md:px-8 md:py-12">
        <div className={cn("pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-[0.18] blur-3xl", config.primary)} />
        <div className="pointer-events-none absolute left-0 top-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl" />
        <div className={cn(containerClassName, "relative z-10 space-y-6 md:space-y-8")}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-8">
            <div className="min-h-[10.5rem] space-y-5 md:min-h-0 md:space-y-6">
              {eyebrow ? (
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-500">{eyebrow}</p>
              ) : null}

              <div className="max-w-4xl space-y-4">
                <div className="flex items-start gap-3.5 md:gap-4">
                  <div className={cn("rounded-[var(--radius-lg)] p-2.5 md:p-3.5", config.primary, 'hard-shadow-sm')}>
                    {Icon ? (
                      <Icon className="h-6 w-6 fill-white text-white md:h-8 md:w-8" />
                    ) : iconName ? (
                      renderLucideIcon(iconName, 'h-6 w-6 fill-white text-white md:h-8 md:w-8')
                    ) : (
                      <Grid3X3 className="h-6 w-6 fill-white text-white md:h-8 md:w-8" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-2 md:space-y-3">
                    <h1 className="type-display text-balance text-white">
                      {title}
                    </h1>
                    <div className={cn("h-1 w-16 rounded-full md:w-24", config.primary)} />
                  </div>
                </div>

                <p className="line-clamp-2 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground md:line-clamp-none md:text-[1.05rem]">
                  {description}
                </p>
              </div>
            </div>

            {children ? (
              <div className="flex min-h-[3rem] flex-wrap items-center gap-2.5 md:gap-3 xl:max-w-[28rem] xl:justify-end">
                {children}
              </div>
            ) : null}
          </div>

          {footer ? (
            <div className="flex min-h-[3.5rem] flex-col gap-3 border-t border-white/8 pt-4 md:min-h-0 md:flex-row md:items-center md:justify-between md:gap-4">
              {footer}
            </div>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="surface-panel-elevated relative overflow-hidden px-4 py-8 sm:px-6 sm:py-9 md:px-8 md:py-10">
      <div className={cn("pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-[0.18] blur-3xl", config.primary)} />
      <div className={cn(containerClassName, "relative z-10 space-y-6 md:space-y-8")}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-8">
          {/* Brand & Info */}
          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={cn("rounded-[var(--radius-lg)] p-2.5 transition-transform duration-500 hover:scale-110 md:p-3", config.primary, 'hard-shadow-sm')}>
                {Icon ? (
                  <Icon className="h-6 w-6 fill-white text-white md:h-8 md:w-8" />
                ) : iconName ? (
                  renderLucideIcon(iconName, 'h-6 w-6 fill-white text-white md:h-8 md:w-8')
                ) : (
                  <Grid3X3 className="h-6 w-6 fill-white text-white md:h-8 md:w-8" />
                )}
              </div>
              <div className="space-y-1">
                <h1 className="type-display text-white">
                  {title}
                </h1>
                <div className={cn("h-1 w-14 md:w-20", config.primary)} />
              </div>
            </div>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-muted-foreground md:text-[1.05rem]">
              {description}
            </p>
          </div>

          {/* Action Slots Area (Filters, Surprise Button, etc) */}
          {children && (
            <div className="flex flex-wrap items-center gap-2.5 md:gap-3 lg:pb-1">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
