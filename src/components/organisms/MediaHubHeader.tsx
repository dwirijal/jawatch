'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface MediaHubHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  theme: ThemeType;
  children?: React.ReactNode;
}

export function MediaHubHeader({
  title,
  description,
  icon: Icon,
  theme,
  children
}: MediaHubHeaderProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <header className="py-16 md:py-24 px-8 border-b border-zinc-900 bg-zinc-900/20 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className={cn("absolute -top-24 -left-24 w-96 h-96 blur-[120px] rounded-full opacity-10", config.primary)} />
      
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          {/* Brand & Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className={cn("p-4 rounded-[1.5rem] shadow-2xl transition-transform hover:scale-110 duration-500", config.primary, config.shadow)}>
                <Icon className="w-10 h-10 text-white fill-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none">
                  {title}
                </h1>
                <div className={cn("h-1.5 w-24 rounded-full", config.primary)} />
              </div>
            </div>
            <p className="text-zinc-400 font-medium max-w-xl text-lg md:text-xl leading-relaxed italic">
              &quot;{description}&quot;
            </p>
          </div>

          {/* Action Slots Area (Filters, Surprise Button, etc) */}
          {children && (
            <div className="flex flex-wrap items-center gap-4 lg:pb-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
