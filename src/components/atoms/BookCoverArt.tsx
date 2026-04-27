'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getBookCoverPalette, splitBookTitle } from '@/components/atoms/book-cover-art-palette';

interface BookCoverArtProps {
  src?: string;
  title: string;
  subtitle?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}

export function BookCoverArt({
  src,
  title,
  subtitle,
  sizes = '208px',
  priority = false,
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
          <div className="absolute inset-x-[14%] bottom-[12%] space-y-[var(--space-sm)]" style={{ color: palette.text }}>
            <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)]" style={{ color: palette.eyebrow }}>Novel Edition</p>
            <h3 className="line-clamp-4 text-[var(--type-size-lg)] font-black leading-[var(--type-line-heading)] tracking-[var(--type-tracking-normal)] text-balance drop-shadow-[0_3px_10px_rgba(0,0,0,0.25)] md:text-[var(--type-size-xl)]">
              {splitTitle.title}
            </h3>
            {coverSubtitle ? (
              <p className="line-clamp-3 max-w-[18ch] text-[var(--type-size-xs)] leading-[var(--type-line-body)]" style={{ color: palette.subtitle }}>
                {coverSubtitle}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0" style={{ background: palette.overlay }} />
    </div>
  );
}
