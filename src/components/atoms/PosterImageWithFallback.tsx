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
        <div
          className="jawatch-poster-missing h-full w-full bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--surface-1)_100%)]"
          aria-label={`${fallbackLabel}: ${title}`}
        >
          <span className="sr-only">{fallbackLabel}: {title}</span>
        </div>
      )}
    </div>
  );
}
