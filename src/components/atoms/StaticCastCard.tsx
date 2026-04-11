import Image from 'next/image';
import { Mic2 } from 'lucide-react';
import { Badge } from './Badge';
import { Paper } from './Paper';
import { Typography } from './Typography';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

export interface CastItem {
  id: string | number;
  name: string;
  role?: string;
  image?: string;
  secondary?: string;
  secondaryLabel?: string;
}

export interface StaticCastCardProps {
  item: CastItem;
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

export function StaticCastCard({ item, theme, layout = 'grid' }: StaticCastCardProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;
  const initials = getInitials(item.name);

  if (layout === 'scroll') {
    return (
      <Paper
        as="article"
        tone="muted"
        shadow="sm"
        padded={false}
        glassy
        className="group relative w-[140px] shrink-0 overflow-hidden rounded-[var(--radius-2xl)] bg-[#0a0a0f] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="140px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_65%),linear-gradient(160deg,rgba(24,24,32,0.98),rgba(10,10,15,1))]">
              <span className={cn('text-xl font-black uppercase tracking-tighter opacity-42', config.text)}>{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
        </div>

        <div className="space-y-1.5 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {item.role ? (
              <Badge variant={theme} className="px-1.5 py-0.5 text-[8px]">
                {item.role}
              </Badge>
            ) : null}
          </div>

          <Typography as="h3" className="line-clamp-2 text-[14px] font-bold tracking-tight text-white/90">
            {item.name}
          </Typography>

          {item.secondary ? (
            <div className="flex items-center gap-1 opacity-60">
              <Mic2 className="h-3 w-3 shrink-0 text-white/40" />
              <p className="line-clamp-1 text-[10px] font-medium leading-tight text-white/70">{item.secondary}</p>
            </div>
          ) : null}
        </div>
      </Paper>
    );
  }

  return (
    <Paper
      as="article"
      tone="muted"
      shadow="sm"
      interactive
      glassy
      className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-[#0a0a0f] shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.38)]"
    >
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[#11131b]">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_65%),linear-gradient(160deg,rgba(24,24,32,0.98),rgba(10,10,15,1))]">
              <span className={cn('text-sm font-black uppercase tracking-tighter opacity-42', config.text)}>{initials}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {item.role ? <Badge variant={theme}>{item.role}</Badge> : null}
          </div>

          <Typography as="h3" className="line-clamp-2 text-base font-bold tracking-tight text-white/92">
            {item.name}
          </Typography>

          {item.secondary ? (
            <div className="flex items-center gap-1.5 opacity-65">
              <Mic2 className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <p className="line-clamp-1 text-xs font-medium text-white/72">{item.secondary}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Paper>
  );
}
