'use client';

import * as React from 'react';
import Image from 'next/image';
import { Clapperboard, Play } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { getDrachinDetailBySlug, type DrachinDetailData } from '@/lib/drama-source';

interface DrachinDetailClientProps {
  slug: string;
}

export default function DrachinDetailClient({ slug }: DrachinDetailClientProps) {
  const [detail, setDetail] = React.useState<DrachinDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    getDrachinDetailBySlug(slug)
      .then((nextData) => {
        if (!cancelled) {
          setDetail(nextData);
          setError(nextData ? null : 'Drachin detail is unavailable for this title.');
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load Drachin detail.');
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
  }, [slug]);

  return (
    <div className="app-shell bg-background text-white">
      <main className="app-container-wide app-section-stack py-6 md:py-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/drachin">Back to Drachin</Link>
          </Button>
        </div>

        {loading ? (
          <Paper tone="muted" shadow="sm" className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-28 rounded-full bg-white/10" />
              <div className="h-10 w-full max-w-2xl rounded-2xl bg-white/10" />
              <div className="h-4 w-full max-w-3xl rounded-full bg-white/10" />
              <div className="h-4 w-full max-w-2xl rounded-full bg-white/5" />
            </div>
          </Paper>
        ) : error || !detail ? (
          <StateInfo type="error" title="Drachin detail unavailable" description={error || 'The requested Drachin title could not be loaded.'} />
        ) : (
          <>
            <Paper tone="muted" shadow="sm" className="overflow-hidden p-5 md:p-6">
              <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2">
                  {detail.poster ? (
                    <Image
                      src={detail.poster}
                      alt={detail.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 60vw, 224px"
                      unoptimized
                    />
                  ) : null}
                </div>

                <div className="space-y-4 md:space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="drama">Drachin</Badge>
                    <Badge variant="outline">{detail.totalEpisodes} Episodes</Badge>
                    {detail.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{detail.title}</h1>
                    <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{detail.synopsis}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="drama" asChild>
                      <Link href={`/drachin/episode/${detail.slug}?index=1`}>
                        <Play className="h-4 w-4 fill-current" /> Start Watching
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Paper>

            <AdSection />

            <section className="space-y-4">
              <SectionHeader
                title="Episode Guide"
                subtitle={`${detail.totalEpisodes} short episodes available from the live Drachin feed.`}
                icon={Clapperboard}
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {detail.episodes.map((episode) => (
                  <Paper key={`${episode.slug}:${episode.index}`} asChild tone="muted" shadow="sm" padded={false}>
                    <Link
                      href={`/drachin/episode/${episode.slug}?index=${episode.index}`}
                      className="flex min-h-[5rem] flex-col justify-between gap-2 p-4 transition-colors hover:bg-surface-elevated"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Episode</span>
                      <span className="text-lg font-semibold tracking-tight text-white">{episode.episode}</span>
                    </Link>
                  </Paper>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

