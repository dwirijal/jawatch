'use client';

import * as React from 'react';
import Image from 'next/image';
import { Mic2, UserRound } from 'lucide-react';
import { BookCoverArt } from '@/components/atoms/BookCoverArt';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { Typography } from '@/components/atoms/Typography';
import { getMovieMetadata } from '@/lib/enrichment';
import { getHDThumbnail } from '@/lib/adapters/comic';
import { cn, getMediaPosterAspectClass, THEME_CONFIG, ThemeType } from '@/lib/utils';

export interface MediaCardProps {
  href?: string;
  image: string;
  title: string;
  subtitle?: string;
  metaLine?: string;
  badgeText?: string;
  theme?: ThemeType;
  className?: string;
}

export interface CastItem {
  id: string | number;
  name: string;
  role?: string;
  image?: string;
  secondary?: string;
  secondaryLabel?: string;
}

export interface CastCardProps {
  item: CastItem;
  theme: Extract<ThemeType, 'anime' | 'movie'>;
  layout?: 'grid' | 'scroll';
}

function normalizeCardImage(image: string, theme: ThemeType): string {
  const trimmed = image.trim();
  if (!trimmed) {
    return '';
  }

  if (theme === 'movie') {
    return trimmed;
  }

  return getHDThumbnail(trimmed);
}

function shouldUseCompactCopy(title: string): boolean {
  const normalized = title.trim();
  if (!normalized) {
    return false;
  }

  const wordCount = normalized.split(/\s+/).length;
  return normalized.length > 28 || wordCount > 5;
}

function splitCardTitle(title: string): { title: string; derivedSubtitle?: string } {
  const normalized = title.trim();
  const separatorIndex = normalized.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return { title: normalized };
  }

  const primary = normalized.slice(0, separatorIndex).trim();
  const secondary = normalized.slice(separatorIndex + 1).trim();

  if (!primary || !secondary || secondary.length > 60) {
    return { title: normalized };
  }

  return {
    title: primary,
    derivedSubtitle: secondary,
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function MediaCard({
  href,
  image,
  title,
  subtitle,
  metaLine,
  badgeText,
  theme = 'default',
  className,
}: MediaCardProps) {
  const [displayImage, setDisplayImage] = React.useState(normalizeCardImage(image, theme));
  const [retryCount, setRetryCount] = React.useState(0);
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);
  const splitTitle = React.useMemo(() => splitCardTitle(title), [title]);
  const displayTitle = splitTitle.title || title;
  const effectiveSubtitle = subtitle || splitTitle.derivedSubtitle;
  const compactCopy = shouldUseCompactCopy(displayTitle);
  const isNovelCard = theme === 'novel';
  const accentPalette = React.useMemo(() => {
    const config = THEME_CONFIG[theme] || THEME_CONFIG.default;
    const themedPalette = {
      anime: [config.bg.replace('bg-', '').includes('blue') ? 'rgba(59, 130, 246, 0.24)' : 'rgba(59, 130, 246, 0.24)', 'rgba(96, 165, 250, 0.18)'],
      manga: ['rgba(234, 88, 12, 0.22)', 'rgba(251, 146, 60, 0.18)'],
      donghua: ['rgba(239, 68, 68, 0.22)', 'rgba(248, 113, 113, 0.18)'],
      movie: ['rgba(99, 102, 241, 0.22)', 'rgba(129, 140, 248, 0.18)'],
      drama: ['rgba(244, 63, 94, 0.22)', 'rgba(251, 113, 133, 0.18)'],
      novel: ['rgba(180, 83, 9, 0.24)', 'rgba(245, 158, 11, 0.18)'],
      default: ['rgba(168, 85, 247, 0.24)', 'rgba(56, 189, 248, 0.22)', 'rgba(251, 191, 36, 0.18)'],
    } as const;

    return themedPalette[theme] ?? themedPalette.default;
  }, [theme]);

  const accent = React.useMemo(() => {
    const seed = `${href}:${title}`.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return accentPalette[seed % accentPalette.length];
  }, [accentPalette, href, title]);

  React.useEffect(() => {
    setDisplayImage(normalizeCardImage(image, theme));
    setRetryCount(0);
    setImageLoadFailed(false);
  }, [image, theme]);

  const handleImageError = async () => {
    if (theme === 'movie' && retryCount === 0) {
      setRetryCount(1);
      const meta = await getMovieMetadata(title);
      if (meta.poster) {
        setDisplayImage(meta.poster);
        setImageLoadFailed(false);
        return;
      }
    }

    setDisplayImage('');
    setImageLoadFailed(true);
  };

  const cardBody = (
    <div
      className="refractive-border glass-noise relative h-full overflow-hidden rounded-[18px] bg-[#0a0a0f] shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      style={{ '--hover-glow': accent } as React.CSSProperties}
    >
        <div className="absolute -inset-2 bg-[var(--hover-glow)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-15" />

        <div className="relative h-full overflow-hidden">
          {theme === 'novel' ? (
            <BookCoverArt
              src={displayImage}
              title={title}
              subtitle={effectiveSubtitle}
              sizes="(max-width: 500px) 48vw, (max-width: 768px) 33vw, (max-width: 1200px) 20vw, 12vw"
              imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.028]"
            />
          ) : displayImage && !imageLoadFailed ? (
            <Image
              src={displayImage}
              alt={title}
              fill
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.028]"
              sizes="(max-width: 500px) 48vw, (max-width: 768px) 33vw, (max-width: 1200px) 20vw, 12vw"
              quality={68}
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_52%),linear-gradient(160deg,rgba(32,36,52,0.98),rgba(12,14,21,1))] p-4 text-center text-muted-foreground">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] leading-tight text-zinc-300">Poster Missing</span>
              <span className="mt-2 line-clamp-3 text-[11px] font-bold leading-relaxed tracking-tight text-zinc-500">
                {title}
              </span>
            </div>
          )}

          {!isNovelCard ? <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,4,8,0.96)_0%,rgba(4,4,8,0.62)_26%,rgba(4,4,8,0.18)_48%,rgba(4,4,8,0.2)_100%)]" /> : null}
          <div
            className={cn('absolute inset-0', isNovelCard ? 'opacity-35' : 'opacity-78')}
            style={{ background: `linear-gradient(180deg, ${accent} 0%, transparent 40%)` }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
          <div className="absolute inset-0 bg-white/[0.02] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />

          {badgeText && (
            <div className="absolute left-4 top-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68">
              <span>{badgeText}</span>
              {!isNovelCard ? (
                <>
                  <span className="h-[3px] w-[3px] rounded-full bg-white/35" />
                  <span>Curated</span>
                </>
              ) : null}
            </div>
          )}
          {!isNovelCard ? (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <div className={cn('max-w-[82%] sm:max-w-[78%]', compactCopy && 'sm:max-w-[84%]')}>
                <h3
                  className={cn(
                    'line-clamp-2 text-balance font-extrabold tracking-[-0.026em] text-white/95 drop-shadow-[0_4px_18px_rgba(0,0,0,0.42)] transition-colors duration-500 ease-out group-hover:text-white',
                    compactCopy
                      ? 'text-[20px] leading-[1.06] sm:text-[24px]'
                      : 'text-[22px] leading-[1.03] sm:text-[27px]'
                  )}
                >
                  {displayTitle}
                </h3>

                {effectiveSubtitle ? (
                  <p className="mt-2 max-w-[33ch] line-clamp-2 text-[12px] leading-[1.54] text-white/58 transition-colors duration-500 ease-out group-hover:text-white/68 sm:text-[13px]">
                    {effectiveSubtitle}
                  </p>
                ) : (
                  <p className="mt-2 select-none text-[12px] leading-[1.54] text-transparent sm:text-[13px]">{'\u00A0'}</p>
                )}

                {metaLine ? (
                  <p className="mt-2 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42 transition-colors duration-500 ease-out group-hover:text-white/60">
                    {metaLine}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
  );

  const wrapperClassName = cn(
    href ? 'focus-tv' : 'cursor-default',
    'group relative block',
    getMediaPosterAspectClass(theme),
    className,
  );

  if (!href) {
    return <div className={wrapperClassName}>{cardBody}</div>;
  }

  return (
    <Link href={href} className={wrapperClassName}>
      {cardBody}
    </Link>
  );
}

export function CastCard({ item, theme, layout = 'grid' }: CastCardProps) {
  const config = THEME_CONFIG[theme];

  if (layout === 'scroll') {
    return (
      <Paper as="article" tone="muted" shadow="sm" padded={false} className="w-[144px] shrink-0 overflow-hidden">
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
    );
  }

  return (
    <Paper
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
  );
}

export { MediaCard as Card };
export type { MediaCardProps as CardProps };
