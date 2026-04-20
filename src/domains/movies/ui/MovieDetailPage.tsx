import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StaticMediaCard } from '@/components/atoms/StaticMediaCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { UnitCommunityPanel } from '@/components/organisms/CommunityPanel';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import {
  formatMovieCardMetaLine,
  formatMovieCardSubtitle,
  getMovieCardBadgeText,
} from '@/lib/card-presentation';
import { searchMovieCatalog } from '@/lib/adapters/movie';
import {
  pickPreferredMovieRouteCandidate,
  sharesMovieRouteFamily,
  stripMovieRouteYear,
} from '@/lib/adapters/movie-route-alias';
import { isReservedMovieSlug } from '@/lib/canonical-route-guards';
import { buildMetadata, buildMovieDetailJsonLd } from '@/lib/seo';
import { resolveMediaBackgroundUrl } from '@/lib/utils';
import { getMovieDetailPageData } from '@/domains/movies/server/movie-detail-data';
import { resolveMoviePlaybackState } from '@/domains/movies/server/movie-playback-state';
import { getMovieWatchPageData } from '@/domains/movies/server/movie-watch-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function buildMovieAliasSearchQuery(slug: string): string {
  return stripMovieRouteYear(slug).replace(/-/g, ' ').trim();
}

async function resolveMovieDetailAliasSlug(
  requestedSlug: string,
  includeNsfw: boolean,
  exactPlaybackState: ReturnType<typeof resolveMoviePlaybackState> | null,
) {
  const query = buildMovieAliasSearchQuery(requestedSlug);
  if (query.length < 2) {
    return null;
  }

  const candidates = (await searchMovieCatalog(query, 8, { includeNsfw }))
    .filter((item) => sharesMovieRouteFamily(requestedSlug, item.slug));

  if (candidates.length === 0) {
    return null;
  }

  const rankedCandidates = await Promise.all(
    candidates.slice(0, 4).map(async (item) => {
      let hasPlayback = exactPlaybackState ? exactPlaybackState.kind !== 'unavailable' : false;

      if (item.slug !== requestedSlug) {
        const watchCandidate = await getMovieWatchPageData(item.slug, includeNsfw);
        hasPlayback = resolveMoviePlaybackState(
          { slug: item.slug, externalUrl: `/movies/${item.slug}` },
          watchCandidate,
        ).kind !== 'unavailable';
      }

      return {
        slug: item.slug,
        year: item.year,
        hasPlayback,
      };
    }),
  );

  const preferred = pickPreferredMovieRouteCandidate(requestedSlug, rankedCandidates);
  return preferred && preferred.slug !== requestedSlug ? preferred.slug : null;
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

  const playbackState = movie ? resolveMoviePlaybackState(movie, watch) : null;
  if (!movie || playbackState?.kind === 'unavailable') {
    const redirectSlug = await resolveMovieDetailAliasSlug(slug, includeNsfw, playbackState);
    if (redirectSlug) {
      permanentRedirect(`/movies/${redirectSlug}`);
    }
  }

  if (!movie) {
    notFound();
  }

  const effectivePlaybackState = playbackState || resolveMoviePlaybackState(movie, watch);
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
        hero={
          <VideoDetailHero
            theme="movie"
            backHref="/watch/movies"
            backLabel="Kembali ke film"
            poster={movie.poster}
            backgroundImage={resolveMediaBackgroundUrl(movie.background, movie.backdrop, movie.poster)}
            logoSrc={movie.logo}
            logoAlt={movie.title}
            title={movie.title}
            eyebrow={movie.quality}
            badges={movie.genres.slice(0, 5)}
            metadata={[
              { label: 'Rating', value: movie.rating || 'N/A' },
              { label: 'Tahun', value: movie.year || 'N/A' },
              { label: 'Durasi', value: movie.duration || 'N/A' },
              { label: 'Format', value: movie.quality || 'STREAM' },
              { label: 'Sutradara', value: movie.director || 'N/A' },
              { label: 'Pemain', value: String(movie.cast.length) },
            ]}
            controls={
              <DeferredHeroActions
                title={movie.title}
                mediaType="movie"
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
              effectivePlaybackState.href ? (
                <Button variant="movie" size="lg" className="h-11 rounded-[var(--radius-lg)] px-5" asChild>
                  <Link href={effectivePlaybackState.href}>
                    {effectivePlaybackState.ctaLabel}
                    <Play className="ml-2 h-4 w-4 fill-current" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="h-11 rounded-[var(--radius-lg)] px-5" disabled>
                  {effectivePlaybackState.ctaLabel}
                </Button>
              )
            }
          />
        }
        sidebar={null}
      >
        <section id="overview" className="space-y-8">
          <DetailSectionHeading title="Ringkasan" theme="movie" />
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <p className="text-sm leading-7 text-zinc-400 md:text-base">{movie.synopsis}</p>
          </Paper>
        </section>

        {effectivePlaybackState.kind === 'unavailable' ? (
          <section id="availability" className="space-y-8">
            <DetailSectionHeading title="Ketersediaan" theme="movie" />
            <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
              <p className="text-sm leading-7 text-zinc-400 md:text-base">{effectivePlaybackState.message}</p>
            </Paper>
          </section>
        ) : null}

        {effectivePlaybackState.kind === 'inline' && watch ? (
          <section id="player" className="scroll-mt-28 space-y-8">
            <DetailSectionHeading
              title="Pemutar"
              theme="movie"
              aside={<Badge variant="outline">{watch.mirrors.length} sumber</Badge>}
            />
            <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden p-3 md:p-4">
              <VideoPlayer
                mirrors={watch.mirrors}
                defaultUrl={watch.defaultUrl}
                theme="movie"
              />
            </Paper>
          </section>
        ) : null}

        <section id="community" className="space-y-8">
          <DetailSectionHeading title="Komentar" theme="movie" />
          <UnitCommunityPanel
            titleId={`movie:${movie.slug}`}
            titleLabel={movie.title}
            unitId={`movie:${movie.slug}`}
            unitLabel="Movie"
            unitHref={`/movies/${movie.slug}`}
            mediaType="movie"
            theme="movie"
          />
        </section>

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
              title="Pemain"
              theme="movie"
              aside={<Badge variant="outline">{movie.cast.length} orang</Badge>}
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
                title="Mirip ini"
                theme="movie"
                aside={<Badge variant="outline">{movie.recommendations.length} pilihan</Badge>}
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
