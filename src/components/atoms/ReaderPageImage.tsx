'use client';

import * as React from 'react';
import Image from 'next/image';
import { ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

interface ReaderPageImageProps {
  src: string;
  index: number;
  loading?: 'eager' | 'lazy';
}

export function ReaderPageImage({
  src,
  index,
  loading = 'lazy',
}: ReaderPageImageProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const [retryNonce, setRetryNonce] = React.useState(0);

  React.useEffect(() => {
    setImageFailed(false);
    setRetryNonce(0);
  }, [src]);

  const handleRetry = React.useCallback(() => {
    setImageFailed(false);
    setRetryNonce((value) => value + 1);
  }, []);

  if (!src.trim() || imageFailed) {
    return (
      <div className="flex aspect-[1200/1700] min-h-[18rem] w-full flex-col items-center justify-center gap-[var(--space-md)] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_52%),linear-gradient(160deg,rgba(20,22,34,0.98),rgba(9,11,18,1))] px-[var(--space-xl)] py-8 text-center">
        <div className="inline-flex h-[var(--size-control-lg)] w-[var(--size-control-lg)] items-center justify-center rounded-full border border-border-subtle bg-surface-1 text-[var(--signal-warning)]">
          <TriangleAlert className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Halaman {index + 1}</p>
          <h3 className="text-lg font-black tracking-[var(--type-tracking-normal)] text-foreground">Gambar belum bisa dibuka</h3>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Halaman ini gagal dimuat dari sumber upstream. Coba muat ulang atau buka gambar asli di tab baru.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-[var(--space-sm)]">
          <Button type="button" variant="outline" className="h-[var(--size-control-md)] rounded-[var(--radius-sm)] px-4.5" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </Button>
          {src.trim() ? (
            <Button type="button" variant="ghost" className="h-[var(--size-control-md)] rounded-[var(--radius-sm)] px-4.5 text-foreground/80 hover:text-[var(--accent-contrast)]" asChild>
              <a href={src} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Buka gambar asli
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      key={`${src}-${retryNonce}`}
      src={src}
      alt={`Halaman ${index + 1}`}
      width={1200}
      height={1700}
      sizes="(max-width: 1200px) 100vw, 1200px"
      className="h-auto w-full select-none"
      unoptimized
      loading={loading}
      onError={() => setImageFailed(true)}
    />
  );
}
