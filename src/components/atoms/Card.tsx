'use client';

import * as React from 'react';
import Image from 'next/image';
import { animate } from 'animejs';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';
import { ANIMATION_PRESETS } from '@/lib/animations';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { getMovieMetadata, getHDThumbnail } from '@/lib/api';

export interface CardProps {
  href: string;
  image: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  theme?: ThemeType;
  className?: string;
}

export function Card({
  href,
  image,
  title,
  subtitle,
  badgeText,
  theme = 'default',
  className,
}: CardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [displayImage, setDisplayImage] = React.useState(getHDThumbnail(image));
  const [retryCount, setRetryCount] = React.useState(0);
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  React.useEffect(() => {
    setDisplayImage(getHDThumbnail(image));
  }, [image]);

  const handleImageError = async () => {
    if (theme === 'movie' && retryCount === 0) {
      setRetryCount(1);
      const meta = await getMovieMetadata(title);
      if (meta.poster) {
        setDisplayImage(meta.poster);
      }
    }
  };

  const onMouseEnter = () => cardRef.current && animate(cardRef.current, ANIMATION_PRESETS.cardHover);
  const onMouseLeave = () => cardRef.current && animate(cardRef.current, ANIMATION_PRESETS.cardSettle);

  return (
    <Paper asChild shadow="none" padded={false} interactive className={className}>
      <Link
        href={href}
        className="focus-tv group flex w-full flex-col overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={cardRef}
          className={cn(
            'relative aspect-[3/4] overflow-hidden border-b border-border-subtle bg-surface-2 transition-colors',
            config.hoverBorder
          )}
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              sizes="(max-width: 500px) 48vw, (max-width: 768px) 33vw, (max-width: 1200px) 20vw, 12vw"
              unoptimized
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-surface-1 p-4 text-center text-muted-foreground">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] leading-tight">Poster Missing</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-35" />
          {badgeText && (
            <div className="absolute left-1.5 top-1.5">
              <Badge variant={theme} className="px-1.5 py-0.5 text-[9px] tracking-[0.14em]">
                {badgeText}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex min-h-[2.9rem] flex-col gap-0.5 bg-surface-1 px-2.5 py-2 sm:min-h-[3.15rem] sm:px-3 sm:py-2">
          <h3
            className={cn(
              'line-clamp-2 text-xs font-black leading-snug tracking-tight text-zinc-100 transition-colors sm:text-sm',
              config.hoverText
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'line-clamp-1 text-[10px] font-semibold text-muted-foreground sm:text-[11px]',
              !subtitle && 'select-none text-transparent'
            )}
          >
            {subtitle || '\u00A0'}
          </p>
        </div>
      </Link>
    </Paper>
  );
}
