import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StaticMediaCard } from '@/components/atoms/StaticMediaCard';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import {
  formatMovieCardMetaLine,
  formatMovieCardSubtitle,
  getMovieCardBadgeText,
} from '@/lib/card-presentation';
import { isReservedMovieSlug } from '@/lib/canonical-route-guards';
import { buildMetadata, buildMovieDetailJsonLd } from '@/lib/seo';
import { getMovieDetailPageData } from './movie-detail-data';
import { getMovieWatchPageData } from '../movie-watch-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedMovieSlug(slug)) {
    return buildMetadata({
      title: 'Film Tidak Ditemukan',
      description: 'Film yang kamu cari tidak tersedia di katalog jawatch.',
      path: `/movies/${slug}`,
      noIndex: true,
    });
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const movie = await getMovieDetailPageData(slug, includeNsfw);

  if (!movie) {
    return buildMetadata({
      title: 'Film Tidak Ditemukan',
      description: 'Film yang kamu cari tidak tersedia di katalog jawatch.',
      path: `/movies/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${movie.title} Subtitle Indonesia`,
    description: `${movie.synopsis} Streaming ${movie.title}${movie.year ? ` rilis ${movie.year}` : ''}${movie.quality ? ` kualitas ${movie.quality}` : ''} di jawatch.`,
    path: `/movies/${movie.slug}`,
    image: movie.poster,
    keywords: [...movie.genres, movie.director].filter(Boolean),
  });
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (isReservedMovieSlug(slug)) {
    notFound();
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const [movie, watch] = await Promise.all([
    getMovieDetailPageData(slug, includeNsfw),
    getMovieWatchPageData(slug, includeNsfw),
  ]);

  if (!movie) {
    notFound();
  }

  const watchHref = watch?.canInlinePlayback ? '#player' : watch?.externalUrl || movie.externalUrl || `/movies/${slug}`;
  const trailerEmbedUrl = getYouTubeEmbedUrl(movie.trailerUrl);

  return (
    <>
      <JsonLd
        data={buildMovieDetailJsonLd({
          title: movie.title,
          slug: movie.slug,
          poster: movie.poster,
          description: movie.synopsis,
          year: movie.year,
          duration: movie.duration,
          genres: movie.genres,
        })}
      />
      <HorizontalMediaDetailPage
        theme="movie"
        showAdSection={false}
        hero={
          <VideoDetailHero
            theme="movie"
            backHref="/watch/movies"
            backLabel="Back to Watch Movies"
            poster={movie.poster}
            title={movie.title}
            eyebrow={movie.quality}
            badges={movie.genres.slice(0, 5)}
            metadata={[
              { label: 'Rating', value: movie.rating || 'N/A' },
              { label: 'Year', value: movie.year || 'N/A' },
              { label: 'Runtime', value: movie.duration || 'N/A' },
              { label: 'Format', value: movie.quality || 'STREAM' },
              { label: 'Director', value: movie.director || 'N/A' },
              { label: 'Cast', value: String(movie.cast.length) },
            ]}
            controls={
              <DeferredHeroActions
                title={movie.title}
                theme="movie"
                bookmarkItem={{
                  id: slug,
                  type: 'movie',
                  title: movie.title,
                  image: movie.poster,
                  timestamp: 0,
                }}
              />
            }
            primaryAction={
              <Button variant="movie" size="lg" className="h-11 rounded-[var(--radius-lg)] px-5" asChild>
                <Link href={watchHref}>
                  Watch Now
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            }
          />
        }
        sidebar={null}
        footer={<CommunityCTA mediaId={slug} title={movie.title} type="movie" theme="movie" />}
      >
        <section id="overview" className="space-y-8">
          <DetailSectionHeading title="Overview" theme="movie" />
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <p className="text-sm leading-7 text-zinc-400 md:text-base">{movie.synopsis}</p>
          </Paper>
        </section>

        {watch?.canInlinePlayback ? (
          <section id="player" className="scroll-mt-28 space-y-8">
            <DetailSectionHeading
              title="Player"
              theme="movie"
              aside={<Badge variant="outline">{watch.mirrors.length} Mirrors</Badge>}
            />
            <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden p-3 md:p-4">
              <VideoPlayer
                mirrors={watch.mirrors}
                defaultUrl={watch.defaultUrl}
                title={watch.title}
                theme="movie"
              />
            </Paper>
          </section>
        ) : null}

        {trailerEmbedUrl ? (
          <section id="trailer" className="space-y-8">
            <DetailSectionHeading title="Trailer" theme="movie" />
            <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={trailerEmbedUrl}
                  title={`${movie.title} trailer`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </Paper>
          </section>
        ) : null}

        {movie.cast.length > 0 ? (
          <section id="cast" className="space-y-8">
            <DetailSectionHeading
              title="Cast"
              theme="movie"
              aside={<Badge variant="outline">{movie.cast.length} Available</Badge>}
            />
            <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {movie.cast.slice(0, 12).map((person) => (
                  <div
                    key={String(person.id)}
                    className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{person.name}</p>
                    {person.role ? <p className="mt-1 text-xs text-zinc-400">{person.role}</p> : null}
                  </div>
                ))}
              </div>
            </Paper>
          </section>
        ) : null}

        <Suspense fallback={null}>
          {movie.recommendations.length > 0 ? (
            <section id="related" className="space-y-8">
              <DetailSectionHeading
                title="More Like This"
                theme="movie"
                aside={<Badge variant="outline">{movie.recommendations.length} Available</Badge>}
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {movie.recommendations.map((item) => (
                  <StaticMediaCard
                    key={item.slug}
                    href={`/movies/${item.slug}`}
                    image={item.poster}
                    title={item.title}
                    subtitle={formatMovieCardSubtitle(item)}
                    metaLine={formatMovieCardMetaLine(item)}
                    badgeText={getMovieCardBadgeText()}
                    theme="movie"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </Suspense>
      </HorizontalMediaDetailPage>
    </>
  );
}
