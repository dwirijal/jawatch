'use client';

import * as React from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBookCoverPalette, splitBookTitle } from '@/components/atoms/book-cover-art-palette';

interface BookCoverArtProps {
  src?: string;
  title: string;
  subtitle?: string;
  sizes?: string;
  priority?: boolean;
  progress?: number;
  className?: string;
  imageClassName?: string;
}

export function BookCoverArt({
  src,
  title,
  subtitle,
  sizes = '208px',
  priority = false,
  progress,
  className,
  imageClassName,
}: BookCoverArtProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const splitTitle = React.useMemo(() => splitBookTitle(title), [title]);
  const coverSubtitle = subtitle || splitTitle.subtitle;
  const shouldShowImage = Boolean(src?.trim()) && !imageFailed;
  const palette = React.useMemo(() => getBookCoverPalette(title), [title]);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = progress !== undefined ? circumference - (progress / 100) * circumference : 0;

  return (
    <div className={cn('relative h-full w-full overflow-hidden rounded-[var(--radius-lg)] refractive-border glass-noise', className)}>
      {shouldShowImage ? (
        <Image
          src={src as string}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          className={cn('object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: palette.background }}>
          <div className="absolute inset-0" style={{ background: palette.glow }} />
          <div
            className="absolute inset-[7%] rounded-[calc(var(--radius-lg)-2px)] border"
            style={{ borderColor: palette.frameBorder, background: palette.frameFill }}
          />
          <div className="absolute inset-y-0 left-[10%] w-px" style={{ backgroundColor: palette.spine }} />
          <div className="absolute inset-x-[12%] top-[10%] h-px" style={{ backgroundColor: palette.rule }} />
          <div className="absolute inset-x-[14%] bottom-[12%] space-y-3" style={{ color: palette.text }}>
            <p className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: palette.eyebrow }}>Novel Edition</p>
            <h3 className="line-clamp-4 text-[clamp(1rem,2vw,1.45rem)] font-black leading-[1.06] tracking-[-0.03em] text-balance drop-shadow-[0_3px_10px_rgba(0,0,0,0.25)]">
              {splitTitle.title}
            </h3>
            {coverSubtitle ? (
              <p className="line-clamp-3 max-w-[18ch] text-[11px] leading-[1.45]" style={{ color: palette.subtitle }}>
                {coverSubtitle}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0" style={{ background: palette.overlay }} />

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 z-10">
          <svg className="h-8 w-8 -rotate-90 transform">
            <circle
              cx="16"
              cy="16"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="16"
              cy="16"
              r={radius}
              stroke="var(--accent)"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-white/90">{Math.round(progress)}%</span>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 z-20">
        <div className="flex flex-col items-center gap-2 transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0">
          <div className="h-12 w-12 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-xl">
            <BookOpen className="h-6 w-6 text-black" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white drop-shadow-md">Resume Reading</span>
        </div>
      </div>
    </div>
  );
}
