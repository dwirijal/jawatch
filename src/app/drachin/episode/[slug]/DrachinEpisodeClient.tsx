'use client';

import * as React from 'react';
import Image from 'next/image';
import { LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { AdSection } from '@/components/organisms/AdSection';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { VideoPlaybackScaffold } from '@/components/organisms/VideoPlaybackScaffold';
import { getDrachinDetailBySlug, getDrachinEpisodeBySlug, type DrachinDetailData, type DrachinEpisodeData } from '@/lib/drama-source';
import { saveVerticalDramaProgress } from '@/lib/vertical-drama-store';

interface DrachinEpisodeClientProps {
  slug: string;
}

export default function DrachinEpisodeClient({ slug }: DrachinEpisodeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = searchParams.get('index') || '1';
  const episodeIndex = Number.parseInt(index, 10) || 1;

  const [detail, setDetail] = React.useState<DrachinDetailData | null>(null);
  const [episode, setEpisode] = React.useState<DrachinEpisodeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([getDrachinDetailBySlug(slug), getDrachinEpisodeBySlug(slug, episodeIndex)])
      .then(([detailData, episodeData]) => {
        if (!cancelled) {
          setDetail(detailData);
          setEpisode(episodeData);
          setError(detailData && episodeData ? null : 'Drachin playback data is unavailable for this episode.');
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load Drachin playback.');
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
  }, [slug, episodeIndex]);

  React.useEffect(() => {
    if (!loading && episode) {
      saveVerticalDramaProgress('drachin', slug, episodeIndex);
    }
  }, [episode, episodeIndex, loading, slug]);

  if (loading) {
    return (
      <div className="app-shell bg-background text-white">
        <main className="app-container-immersive py-6">
          <Paper tone="muted" shadow="sm" className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-32 rounded-full bg-white/10" />
              <div className="aspect-video rounded-[var(--radius-lg)] bg-white/10" />
            </div>
          </Paper>
        </main>
      </div>
    );
  }

  if (!detail || !episode || error) {
    return (
      <div className="app-shell bg-background text-white">
        <main className="app-container-immersive py-6">
          <StateInfo type="error" title="Playback unavailable" description={error || 'This Drachin episode could not be loaded.'} />
        </main>
      </div>
    );
  }

  const currentIndex = detail.episodes.findIndex((item) => item.index === String(episodeIndex));
  const previousEpisode = currentIndex > 0 ? detail.episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex >= 0 && currentIndex < detail.episodes.length - 1 ? detail.episodes[currentIndex + 1] : null;
  const nextEpisodeHref = nextEpisode ? `/drachin/episode/${nextEpisode.slug}?index=${nextEpisode.index}` : null;
  const followingEpisodes = currentIndex >= 0 ? detail.episodes.slice(currentIndex + 1, currentIndex + 9) : detail.episodes.slice(0, 8);

  return (
    <VideoPlaybackScaffold
      backHref="/drachin"
      eyebrow="Now Watching"
      title={detail.title}
      subtitle={
        <>
          <Badge variant="drama" className="px-2 py-0.5 text-[10px]">Episode {episode.episode}</Badge>
          <p className="text-[10px] md:text-xs">Vertical drama flow with auto-resume and auto-next</p>
        </>
      }
      headerActions={
        <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
          <Link href="/drachin">
            <LayoutGrid className="mr-2 h-4 w-4" /> More Drachin
          </Link>
        </Button>
      }
      stage={
        <VideoPlayer
          mirrors={episode.mirrors}
          defaultUrl={episode.defaultUrl}
          title={episode.title}
          theme="drama"
          format="vertical"
          hasNext={Boolean(nextEpisode)}
          onNext={nextEpisodeHref ? () => router.push(nextEpisodeHref) : undefined}
          onEnded={nextEpisodeHref ? () => router.push(nextEpisodeHref) : undefined}
        />
      }
      sidebar={
        <div className="space-y-5">
          <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
            <div className="flex gap-4">
              <div className="relative hidden aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle md:block">
                {episode.poster ? (
                  <Image
                    src={episode.poster}
                    alt={detail.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="drama">Drachin</Badge>
                  <Badge variant="outline">{detail.totalEpisodes} Episodes</Badge>
                  <Badge variant="outline">EP {episode.episode}</Badge>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-white">{detail.title}</h2>
                <p className="text-sm leading-6 text-zinc-400">
                  Saved locally in your browser. Open the title again and playback will resume from the last viewed episode.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/drachin/${slug}`}>View Details</Link>
                  </Button>
                  {previousEpisode ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/drachin/episode/${previousEpisode.slug}?index=${previousEpisode.index}`}>Previous</Link>
                    </Button>
                  ) : null}
                  {nextEpisodeHref ? (
                    <Button variant="drama" size="sm" asChild>
                      <Link href={nextEpisodeHref}>Next</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Paper>

          <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Quick Queue</h3>
                <Badge variant="outline">{detail.totalEpisodes} Total</Badge>
              </div>

              <div className="grid max-h-[28rem] grid-cols-3 gap-2 overflow-auto pr-1">
                {detail.episodes.slice(Math.max(0, episodeIndex - 4), Math.min(detail.totalEpisodes, episodeIndex + 11)).map((item) => {
                  const isActive = item.index === String(episodeIndex);
                  return (
                    <Button key={`${item.slug}:${item.index}`} variant={isActive ? 'drama' : 'outline'} size="sm" asChild className="w-full">
                      <Link href={`/drachin/episode/${item.slug}?index=${item.index}`}>EP {item.episode}</Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </Paper>
        </div>
      }
    >
      <AdSection />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 border-b border-border-subtle pb-3.5 md:pb-4">
          <div className="min-w-0">
            <h2 className="type-section-title text-white">Continue Scrolling</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Next episodes stay below the player so the flow feels like a vertical drama feed, not a heavy detail page.
            </p>
          </div>
          {nextEpisodeHref ? (
            <Button variant="drama" size="sm" asChild>
              <Link href={nextEpisodeHref}>Jump to Next</Link>
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {followingEpisodes.map((item) => (
            <Paper key={`${item.slug}:${item.index}`} asChild tone="muted" shadow="sm" padded={false}>
              <Link href={`/drachin/episode/${item.slug}?index=${item.index}`} className="flex min-h-[7rem] flex-col justify-between gap-3 p-4 transition-colors hover:bg-surface-elevated">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Up Next</p>
                  <h3 className="text-lg font-semibold tracking-tight text-white">Episode {item.episode}</h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Continue the story immediately without going back to the series page.
                </p>
              </Link>
            </Paper>
          ))}
        </div>
      </section>
    </VideoPlaybackScaffold>
  );
}
