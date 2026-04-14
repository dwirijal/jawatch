'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check, Clapperboard, Play, Smartphone } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { VerticalSeriesDetailScaffold } from '@/components/organisms/VerticalSeriesDetailScaffold';
import { getDrachinDetailBySlug, type DrachinDetailData } from '@/lib/adapters/drama';
import { getDrachinPlaybackTarget, getVerticalDramaChunkIndex } from '@/lib/vertical-drama-store';

interface DrachinDetailClientProps {
  slug: string;
  basePath?: string;
}

const EPISODE_CHUNK_SIZE = 20;

export default function DrachinDetailClient({ slug, basePath = '/series/short' }: DrachinDetailClientProps) {
  const [detail, setDetail] = React.useState<DrachinDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [playHref, setPlayHref] = React.useState(`${basePath}/watch/${slug}?index=1`);
  const [resumeEpisodeIndex, setResumeEpisodeIndex] = React.useState(1);
  const [activeChunkIndex, setActiveChunkIndex] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    getDrachinDetailBySlug(slug)
      .then((nextData) => {
        if (!cancelled) {
          setDetail(nextData);
          setError(nextData ? null : 'Story detail is unavailable for this title.');
        }
      })
      .catch((cause) => {
        if (!cancelled) {
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
  }, [slug]);

  const syncResumeTarget = React.useCallback(() => {
    const target = getDrachinPlaybackTarget(slug, 1, basePath);
    setPlayHref(target.href);
    setResumeEpisodeIndex(target.episodeIndex);
  }, [basePath, slug]);

  React.useEffect(() => {
    syncResumeTarget();
    window.addEventListener('focus', syncResumeTarget);
    window.addEventListener('storage', syncResumeTarget);
    return () => {
      window.removeEventListener('focus', syncResumeTarget);
      window.removeEventListener('storage', syncResumeTarget);
    };
  }, [syncResumeTarget]);

  const episodeChunks = React.useMemo(() => {
    if (!detail) {
      return [];
    }

    const chunks: Array<{
      key: string;
      label: string;
      items: DrachinDetailData['episodes'];
    }> = [];

    for (let start = 0; start < detail.episodes.length; start += EPISODE_CHUNK_SIZE) {
      const items = detail.episodes.slice(start, start + EPISODE_CHUNK_SIZE);
      const first = items[0];
      const last = items[items.length - 1];
      chunks.push({
        key: `${first?.index ?? start}-${last?.index ?? start + items.length}`,
        label: `${first?.episode ?? start + 1}-${last?.episode ?? start + items.length}`,
        items,
      });
    }

    return chunks;
  }, [detail]);

  React.useEffect(() => {
    if (!episodeChunks.length) {
      setActiveChunkIndex(0);
      return;
    }

    const nextChunk = Math.min(
      episodeChunks.length - 1,
      getVerticalDramaChunkIndex(resumeEpisodeIndex, EPISODE_CHUNK_SIZE),
    );
    setActiveChunkIndex(nextChunk);
  }, [episodeChunks, resumeEpisodeIndex]);

  const activeChunk = episodeChunks[activeChunkIndex] ?? episodeChunks[0] ?? null;
  const resumeLabel = resumeEpisodeIndex > 1 ? `Resume Episode ${resumeEpisodeIndex}` : 'Start Episode 1';

  return (
    <VerticalSeriesDetailScaffold backHref={basePath} backLabel="Back to Short Series">
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
        <StateInfo type="error" title="Story detail unavailable" description={error || 'The requested story could not be loaded.'} />
      ) : (
        <>
          <Paper tone="muted" shadow="sm" className="overflow-hidden p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2">
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
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <Smartphone className="h-3.5 w-3.5 text-rose-300" />
                  Vertical Series
                </div>
              </div>

              <div className="space-y-4 md:space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="drama">{detail.totalEpisodes} Episodes</Badge>
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
                    <Link href={playHref}>
                      <Play className="h-4 w-4 fill-current" /> {resumeLabel}
                    </Link>
                  </Button>
                  {resumeEpisodeIndex > 1 ? (
                    <Badge variant="outline">Last watched: EP {resumeEpisodeIndex}</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </Paper>

          <AdSection theme="drama" />

          <section className="space-y-4">
            <SectionHeader
              title="Episode Guide"
              subtitle={`${detail.totalEpisodes} short episodes available. The list opens on the chunk that matches your last watched episode.`}
              icon={Clapperboard}
            />

            {episodeChunks.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {episodeChunks.map((chunk, chunkIndex) => {
                  const isActive = chunkIndex === activeChunkIndex;
                  return (
                    <Button
                      key={chunk.key}
                      type="button"
                      variant={isActive ? 'drama' : 'outline'}
                      size="sm"
                      onClick={() => setActiveChunkIndex(chunkIndex)}
                      className="rounded-[var(--radius-lg)]"
                    >
                      {chunk.label}
                    </Button>
                  );
                })}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {activeChunk?.items.map((episode) => {
                const numericIndex = Number.parseInt(episode.index, 10) || 0;
                const isWatched = numericIndex > 0 && numericIndex <= resumeEpisodeIndex;
                const isResumeTarget = numericIndex === resumeEpisodeIndex;
                return (
                  <Paper key={`${episode.slug}:${episode.index}`} asChild tone="muted" shadow="sm" padded={false}>
                    <Link
                      href={`${basePath}/watch/${episode.slug}?index=${episode.index}`}
                      className={`flex min-h-[5rem] flex-col justify-between gap-2 p-4 transition-colors hover:bg-surface-elevated ${
                        isWatched ? 'opacity-80' : ''
                      } ${isResumeTarget ? 'ring-1 ring-rose-500/35' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Episode</span>
                        {isWatched ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-300">
                            <Check className="h-3.5 w-3.5" />
                            Watched
                          </span>
                        ) : null}
                      </div>
                      <span className="text-lg font-semibold tracking-tight text-white">{episode.episode}</span>
                    </Link>
                  </Paper>
                );
              })}
            </div>
          </section>
        </>
      )}
    </VerticalSeriesDetailScaffold>
  );
}
