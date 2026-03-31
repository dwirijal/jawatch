import { notFound, redirect } from 'next/navigation';
import { Info } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { getMovieWatchBySlug } from '@/lib/adapters/movie';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { MediaWatchPage } from '@/components/organisms/MediaWatchPage';
import MovieWatchHistoryTracker from './MovieWatchHistoryTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MovieWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerAuthStatus();
  const movie = await getMovieWatchBySlug(slug, {
    includeNsfw: session.authenticated,
  });

  if (!movie) {
    notFound();
  }

  if (!movie.canInlinePlayback && movie.externalUrl) {
    redirect(movie.externalUrl);
  }

  const routeHref = `/movies/watch/${movie.slug}`;

  return (
    <MediaWatchPage
      historyTracker={
        <MovieWatchHistoryTracker
          slug={movie.slug}
          title={movie.title}
          image={movie.poster}
          href={routeHref}
          quality={movie.quality}
        />
      }
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
      browseHref="/movies"
      browseLabel="More Movies"
      theme="movie"
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
        <Paper tone="muted" shadow="sm" className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="movie" className="px-2 py-0.5 text-[10px]">{movie.year}</Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{movie.duration}</Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{movie.quality}</Badge>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{movie.title}</h2>
            <p className="line-clamp-5 text-sm leading-6 text-zinc-400">{movie.synopsis}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Playback</p>
              <p className="mt-1.5 text-sm font-bold text-white">{movie.canInlinePlayback ? 'Inline Ready' : 'External Source'}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Downloads</p>
              <p className="mt-1.5 text-sm font-bold text-white">{movie.downloadGroups.length} Packs</p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2.5">
            <Button variant="outline" className="h-11 w-full justify-center rounded-[var(--radius-md)] border-border-subtle bg-surface-1 hover:bg-surface-elevated" asChild>
              <Link href={movie.detailHref}>
                View Details
                <Info className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
              Source access is handled automatically when inline playback is unavailable.
            </p>
          </div>
        </Paper>
      }
      downloadGroups={movie.downloadGroups}
      community={{
        mediaId: movie.slug,
        title: movie.title,
        type: 'movie',
        theme: 'movie',
      }}
    />
  );
}
