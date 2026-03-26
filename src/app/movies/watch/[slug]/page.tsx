import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { getMovieWatchBySlug } from '@/lib/movie-source';
import { AdSection } from '@/components/organisms/AdSection';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import MediaDownloadOptionsPanel from '@/components/organisms/MediaDownloadOptionsPanel';
import { VideoPlaybackScaffold } from '@/components/organisms/VideoPlaybackScaffold';
import MovieWatchHistoryTracker from './MovieWatchHistoryTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MovieWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const movie = await getMovieWatchBySlug(slug);

  if (!movie) {
    notFound();
  }

  if (!movie.canInlinePlayback && movie.externalUrl) {
    redirect(movie.externalUrl);
  }

  const routeHref = `/movies/watch/${movie.slug}`;

  return (
    <>
      <MovieWatchHistoryTracker
        slug={movie.slug}
        title={movie.title}
        image={movie.poster}
        href={routeHref}
        quality={movie.quality}
      />

      <VideoPlaybackScaffold
        backHref={movie.detailHref}
        eyebrow="Now Watching"
        title={movie.title}
        subtitle={
          <>
            <Badge variant="movie" className="px-2 py-0.5 text-[10px]">
              Playback Ready
            </Badge>
            <p className="text-[10px] md:text-xs">{movie.canInlinePlayback ? `Streaming in ${movie.quality}` : `${movie.quality} source ready`}</p>
          </>
        }
        headerActions={
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/movies">
              <LayoutGrid className="mr-2 h-4 w-4" /> More Movies
            </Link>
          </Button>
        }
        stage={
          movie.canInlinePlayback && movie.defaultUrl ? (
            <VideoPlayer
              mirrors={movie.mirrors}
              defaultUrl={movie.defaultUrl}
              title={movie.title}
              theme="movie"
            />
          ) : (
            <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
              <div className="aspect-video w-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))]">
                <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center md:gap-4 md:p-6">
                  <Badge variant="movie">Playback Ready</Badge>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">Inline playback is not ready yet</h2>
                    <p className="mx-auto max-w-2xl text-sm leading-6 text-zinc-400">
                      Movie data sudah sinkron via API gateway, tapi source saat ini belum menyediakan embed yang bisa diputar langsung di halaman.
                    </p>
                  </div>
                </div>
              </div>
            </Paper>
          )
        }
        sidebar={
          <Paper tone="muted" shadow="sm" className="p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="relative hidden aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle md:block md:w-28">
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="movie" className="px-2 py-0.5 text-[10px]">{movie.year}</Badge>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{movie.duration}</Badge>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{movie.quality}</Badge>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{movie.title}</h2>
                  <p className="max-w-3xl text-sm leading-6 text-zinc-400">{movie.synopsis}</p>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button variant="outline" asChild>
                      <Link href={movie.detailHref}>View Details</Link>
                    </Button>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                    Source access is handled automatically when inline playback is unavailable.
                  </p>
                </div>
              </div>
            </div>
          </Paper>
        }
      >
        <MediaDownloadOptionsPanel
          groups={movie.downloadGroups}
          accent="indigo"
          normalizeLabel={(label) =>
            label
              .replace(/FULLHD/gi, '1080P')
              .replace(/MP4HD/gi, '720P')
              .replace(/\s*\[[^\]]+\]\s*/g, '')
              .trim()
          }
        />

        <AdSection />

        <CommunityCTA mediaId={movie.slug} title={movie.title} type="movie" theme="movie" />
      </VideoPlaybackScaffold>
    </>
  );
}
