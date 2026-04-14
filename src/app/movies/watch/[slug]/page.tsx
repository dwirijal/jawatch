import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Download, ExternalLink, Info, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildMetadata, buildMovieWatchJsonLd } from '@/lib/seo';
import { getMovieWatchPageData } from './movie-watch-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const includeNsfw = await resolveViewerNsfwAccess();
  const movie = await getMovieWatchPageData(slug, includeNsfw);

  if (!movie) {
    return buildMetadata({
      title: 'Film Tidak Ditemukan',
      description: 'Film yang kamu cari tidak tersedia di katalog movie jawatch.',
      path: `/movies/watch/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Nonton ${movie.title} Subtitle Indonesia`,
    description: `Streaming ${movie.title}${movie.quality ? ` kualitas ${movie.quality}` : ''}${movie.year ? ` rilis ${movie.year}` : ''} dengan subtitle Indonesia di jawatch.`,
    path: `/movies/watch/${movie.slug}`,
    image: movie.poster,
  });
}

export default async function MovieWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const includeNsfw = await resolveViewerNsfwAccess();
  const movie = await getMovieWatchPageData(slug, includeNsfw);

  if (!movie) {
    notFound();
  }

  if (!movie.canInlinePlayback && movie.externalUrl) {
    redirect(movie.externalUrl);
  }

  const activeUrl = movie.defaultUrl;
  const useNativePlayer = Boolean(activeUrl) && isDirectMediaUrl(activeUrl);

  return (
    <>
      <JsonLd
        data={buildMovieWatchJsonLd({
          title: movie.title,
          slug: movie.slug,
          poster: movie.poster,
          description: movie.synopsis,
          year: movie.year,
          duration: movie.duration,
        })}
      />

      <div className="app-shell bg-background text-white" data-theme="movie">
        <main className="app-container-wide flex flex-col gap-6 py-4 md:gap-8 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="movie">Now Watching</Badge>
                <Badge variant="outline">{movie.year}</Badge>
                <Badge variant="outline">{movie.duration}</Badge>
                <Badge variant="outline">{movie.quality}</Badge>
              </div>
              <h1 className="text-2xl font-black tracking-tight md:text-4xl">{movie.title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">{movie.synopsis}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-11 rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4" asChild>
                <Link href={movie.detailHref}>
                  View Details
                  <Info className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="h-11 rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4" asChild>
                <Link href="/movies">More Movies</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_22rem]">
            <div className="space-y-5">
              <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
                <div className="aspect-video w-full bg-black">
                  {activeUrl ? (
                    useNativePlayer ? (
                      <video
                        src={activeUrl}
                        className="h-full w-full object-contain"
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <iframe
                        src={activeUrl}
                        title={movie.title}
                        className="h-full w-full"
                        allowFullScreen
                        scrolling="no"
                        allow="autoplay; encrypted-media"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                      <div className="space-y-3">
                        <Badge variant="movie">Playback Ready</Badge>
                        <p className="text-sm text-zinc-400">Inline playback belum tersedia untuk source ini.</p>
                      </div>
                    </div>
                  )}
                </div>
              </Paper>

              {movie.mirrors.length > 1 ? (
                <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-white">Watch Options</h2>
                    <Badge variant="outline">{movie.mirrors.length} mirrors</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {movie.mirrors.map((mirror) => (
                      <a
                        key={`${mirror.label}-${mirror.embed_url}`}
                        href={mirror.embed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-elevated"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-white">{mirror.label || 'Mirror'}</span>
                          <ExternalLink className="h-4 w-4 text-zinc-500" />
                        </div>
                      </a>
                    ))}
                  </div>
                </Paper>
              ) : null}

              {movie.downloadGroups.length > 0 ? (
                <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-white">Downloads</h2>
                    <Badge variant="outline">{movie.downloadGroups.length} packs</Badge>
                  </div>
                  <div className="grid gap-3">
                    {movie.downloadGroups.map((group) => (
                      <div
                        key={`${group.format}-${group.quality}`}
                        className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="movie">{group.quality}</Badge>
                          <Badge variant="outline">{group.format}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.links.map((link) => (
                            <a
                              key={`${group.quality}-${link.href}`}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-10 items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 text-xs font-black uppercase tracking-[0.15em] text-white transition-colors hover:bg-surface-elevated"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Paper>
              ) : null}
            </div>

            <div className="space-y-5">
              <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
                <h2 className="text-lg font-bold text-white">Playback status</h2>
                <div className="grid gap-3">
                  <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mode</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                      <PlayCircle className="h-4 w-4" />
                      {movie.canInlinePlayback ? 'Inline playback ready' : 'External source'}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mirrors</p>
                    <p className="mt-2 text-sm font-semibold text-white">{movie.mirrors.length}</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Downloads</p>
                    <p className="mt-2 text-sm font-semibold text-white">{movie.downloadGroups.length} packs</p>
                  </div>
                </div>
              </Paper>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
