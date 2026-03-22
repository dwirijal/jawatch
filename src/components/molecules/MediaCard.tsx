'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { animate } from 'animejs';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';
import { Badge } from '@/components/atoms/Badge';
import { getMovieMetadata, getHDThumbnail } from '@/lib/api';

interface MediaCardProps {
  href: string;
  image: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  theme?: ThemeType;
  className?: string;
}

export function MediaCard({
  href,
  image,
  title,
  subtitle,
  badgeText,
  theme = 'default',
  className,
}: MediaCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [displayImage, setDisplayImage] = React.useState(getHDThumbnail(image));
  const [retryCount, setRetryCount] = React.useState(0);
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  // Enrichment for Movie posters
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

  const onMouseEnter = () => cardRef.current && animate(cardRef.current, { scale: 1.05, translateY: -10, duration: 400, ease: 'outElastic(1, .6)' });
  const onMouseLeave = () => cardRef.current && animate(cardRef.current, { scale: 1, translateY: 0, duration: 300, ease: 'outQuad' });

  return (
    <Link 
      href={href} 
      className={cn("group flex flex-col w-full", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        ref={cardRef}
        className={cn(
          "relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 border border-zinc-800 transition-colors shadow-lg bg-zinc-900",
          config.hoverBorder
        )}
      >
        {displayImage ? (
          <Image 
            src={displayImage} 
            alt={title} 
            fill 
            className="object-cover" 
            sizes="(max-width: 768px) 50vw, 20vw" 
            unoptimized 
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-700 p-4 text-center">
             <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Poster Missing</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100" />
        {badgeText && (
          <div className="absolute bottom-2 left-2">
            <Badge variant={theme}>{badgeText}</Badge>
          </div>
        )}
      </div>

      <div className="px-1 space-y-1">
        <h3 className={cn("font-black text-[11px] md:text-xs line-clamp-2 uppercase italic tracking-tight transition-colors", config.hoverText)}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
