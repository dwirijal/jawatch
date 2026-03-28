'use client';

import * as React from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { VerticalSeriesDetailScaffold } from '@/components/organisms/VerticalSeriesDetailScaffold';
import { getDramaboxDetailByBookId, isDramaboxBookId, type DramaboxDetailData } from '@/lib/adapters/drama';

interface DramaboxDetailClientProps {
  bookId: string;
}

export default function DramaboxDetailClient({ bookId }: DramaboxDetailClientProps) {
  const searchParams = useSearchParams();
  const [detail, setDetail] = React.useState<DramaboxDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fallbackTitle = searchParams.get('title')?.trim() || '';
  const fallbackCover = searchParams.get('image')?.trim() || '';
  const fallbackSubtitle = searchParams.get('subtitle')?.trim() || '';
  const fallbackBookId = searchParams.get('bookId')?.trim() || '';
  const resolvedBookId = React.useMemo(() => {
    if (isDramaboxBookId(bookId)) {
      return bookId;
    }

    if (isDramaboxBookId(fallbackBookId)) {
      return fallbackBookId;
    }

    return '';
  }, [bookId, fallbackBookId]);

  React.useEffect(() => {
    let cancelled = false;

    if (!resolvedBookId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getDramaboxDetailByBookId(resolvedBookId)
      .then((nextData) => {
        if (!cancelled) {
          setDetail(nextData);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setDetail(null);
          setError(cause instanceof Error ? cause.message : 'Failed to load story detail.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedBookId]);

  return (
    <VerticalSeriesDetailScaffold backHref="/drachin" backLabel="Back to Drama China">
        {loading ? (
          <Paper tone="muted" shadow="sm" className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-28 rounded-full bg-white/10" />
              <div className="h-10 w-full max-w-2xl rounded-2xl bg-white/10" />
              <div className="h-4 w-full max-w-xl rounded-full bg-white/10" />
            </div>
          </Paper>
        ) : !detail ? (
          fallbackTitle ? (
            <Paper tone="muted" shadow="sm" className="overflow-hidden p-5 md:p-6">
              <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2">
                  {fallbackCover ? (
                    <Image
                      src={fallbackCover}
                      alt={fallbackTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 60vw, 224px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {fallbackSubtitle ? <Badge variant="drama">{fallbackSubtitle}</Badge> : null}
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{fallbackTitle}</h1>
                    <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                      This story is already part of Drama China. Episode playback for this title is still being prepared, so keep exploring the
                      shared catalog while this page fills in.
                    </p>
                    {error ? <p className="text-xs leading-6 text-zinc-500">{error}</p> : null}
                  </div>
                </div>
              </div>
            </Paper>
          ) : (
            <StateInfo
              type="error"
              title="Drama detail unavailable"
              description="This title page is not ready right now. Try another story from the shared drama hub."
            />
          )
        ) : (
          <Paper tone="muted" shadow="sm" className="overflow-hidden p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2">
                {detail.cover ? (
                  <Image
                    src={detail.cover}
                    alt={detail.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 60vw, 224px"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {detail.totalEpisodes ? <Badge variant="drama">{detail.totalEpisodes}</Badge> : null}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{detail.title}</h1>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    {detail.synopsis || 'This title page is still filling in. Browse another story from the shared drama hub and jump straight into playback when available.'}
                  </p>
                </div>
              </div>
            </div>
          </Paper>
        )}
    </VerticalSeriesDetailScaffold>
  );
}
