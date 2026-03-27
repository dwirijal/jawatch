'use client';

import * as React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { getDramaboxDetailByBookId, type DramaboxDetailData } from '@/lib/drama-source';

interface DramaboxDetailClientProps {
  bookId: string;
}

export default function DramaboxDetailClient({ bookId }: DramaboxDetailClientProps) {
  const [detail, setDetail] = React.useState<DramaboxDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    getDramaboxDetailByBookId(bookId)
      .then((nextData) => {
        if (!cancelled) {
          setDetail(nextData);
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
  }, [bookId]);

  return (
    <div className="app-shell bg-background text-white">
      <main className="app-container-wide app-section-stack py-6 md:py-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/drachin">Back to Drama China</Link>
          </Button>
        </div>

        {loading ? (
          <Paper tone="muted" shadow="sm" className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-28 rounded-full bg-white/10" />
              <div className="h-10 w-full max-w-2xl rounded-2xl bg-white/10" />
              <div className="h-4 w-full max-w-xl rounded-full bg-white/10" />
            </div>
          </Paper>
        ) : !detail ? (
          <StateInfo
            type="error"
            title="Drama detail unavailable"
            description="This title page is not ready right now. Try another story from the shared drama hub."
          />
        ) : (
          <Paper tone="muted" shadow="sm" className="overflow-hidden p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2">
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
                  <Badge variant="drama">DramaBox</Badge>
                  {detail.totalEpisodes ? <Badge variant="outline">{detail.totalEpisodes}</Badge> : null}
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
      </main>
    </div>
  );
}
