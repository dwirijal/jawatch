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
  children?: React.ReactNode;
  containerClassName?: string;
}

export function MediaHubHeader({
  title,
  description,
  icon: Icon,
  iconName,
  theme,
  children,
  containerClassName = 'app-container',
}: MediaHubHeaderProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

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
