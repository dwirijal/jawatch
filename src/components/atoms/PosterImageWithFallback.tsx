'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PosterImageWithFallbackProps {
  src?: string;
  title: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
  unoptimized?: boolean;
}

export function PosterImageWithFallback({
  src,
  title,
  sizes = '208px',
  priority = false,
  className,
  imageClassName,
  fallbackLabel = 'Cover Missing',
  unoptimized = false,
}: PosterImageWithFallbackProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const shouldShowImage = Boolean(src?.trim()) && !imageFailed;

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {shouldShowImage ? (
        <Image
          src={src as string}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className={cn('object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_52%),linear-gradient(160deg,rgba(32,36,52,0.98),rgba(12,14,21,1))] p-4 text-center text-muted-foreground">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] leading-tight text-zinc-300">{fallbackLabel}</span>
          <span className="mt-2 line-clamp-4 text-[13px] font-bold leading-relaxed tracking-tight text-zinc-500">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
