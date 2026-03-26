'use client';

import Image from 'next/image';
import { Mic2, UserRound } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Typography } from '@/components/atoms/Typography';
import { ThemeType, THEME_CONFIG, cn } from '@/lib/utils';

export interface CastItem {
  id: string | number;
  name: string;
  role?: string;
  image?: string;
  secondary?: string;
  secondaryLabel?: string;
}

interface CastRailProps {
  items: CastItem[];
  theme: Extract<ThemeType, 'anime' | 'movie'>;
  layout?: 'grid' | 'scroll';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function CastRail({ items, theme, layout = 'grid' }: CastRailProps) {
  const config = THEME_CONFIG[theme];

  if (layout === 'scroll') {
    return (
      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-start gap-3 pb-1">
          {items.map((item) => (
            <Paper key={item.id} as="article" tone="muted" shadow="sm" padded={false} className="w-[144px] shrink-0 overflow-hidden">
              <div
                className={cn(
                  'relative aspect-[3/4] overflow-hidden border-b border-border-subtle bg-surface-2',
                  item.image ? '' : config.bg,
                  !item.image && config.bg
                )}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="148px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className={cn('text-lg font-black uppercase tracking-tight', config.text)}>{getInitials(item.name)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.role ? <Badge variant={theme}>{item.role}</Badge> : null}
                  {!item.image ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">
                      <UserRound className="h-3 w-3" /> Cast
                    </span>
                  ) : null}
                </div>

                <Typography as="h3" size="base" className="line-clamp-2 text-white">
                  {item.name}
                </Typography>

                {item.secondary ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                      {item.secondaryLabel || 'Featured'}
                    </p>
                    <p className="line-clamp-2 flex items-start gap-2 text-sm font-medium leading-relaxed text-zinc-300">
                      <Mic2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <span>{item.secondary}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            </Paper>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Paper
          key={item.id}
          as="article"
          tone="muted"
          shadow="sm"
          interactive
          className={cn('group flex gap-3 rounded-[var(--radius-sm)] p-3.5')}
        >
          <div
            className={cn(
              'relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2',
              !item.image && config.bg
            )}
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className={cn('text-lg font-black uppercase tracking-tight', config.text)}>{getInitials(item.name)}</span>
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {item.role ? <Badge variant={theme}>{item.role}</Badge> : null}
              {!item.image ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">
                  <UserRound className="h-3 w-3" /> Cast
                </span>
              ) : null}
            </div>

            <Typography as="h3" size="base" className="line-clamp-2 text-sm text-white">
              {item.name}
            </Typography>

            {item.secondary ? (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                  {item.secondaryLabel || 'Featured'}
                </p>
                <p className="line-clamp-2 flex items-center gap-2 text-xs font-medium leading-relaxed text-zinc-300">
                  <Mic2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span>{item.secondary}</span>
                </p>
              </div>
            ) : null}
          </div>
        </Paper>
      ))}
    </div>
  );
}
