import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, Clapperboard, Clock, Film, Play } from 'lucide-react';
import { getMovieDetailBySlug } from '@/lib/adapters/movie';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StaticMediaCard } from '@/components/atoms/StaticMediaCard';
import { StatCard } from '@/components/molecules/StatCard';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { CastRail } from '@/components/organisms/CastRail';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { VideoDetailHeroWithTrailer } from '@/components/organisms/VideoDetailHeroWithTrailer';
import { buildMetadata, buildMovieDetailJsonLd } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieDetailBySlug(slug, {
    includeNsfw: false,
  });

  if (!movie) {
    return buildMetadata({
      title: 'Film Tidak Ditemukan',
      description: 'Film yang kamu cari tidak tersedia di katalog dwizzyWEEB.',
      path: `/movies/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${movie.title} Subtitle Indonesia`,
    description: `${movie.synopsis} Streaming ${movie.title}${movie.year ? ` rilis ${movie.year}` : ''}${movie.quality ? ` kualitas ${movie.quality}` : ''} di dwizzyWEEB.`,
    path: `/movies/${movie.slug}`,
    image: movie.poster,
    keywords: [...movie.genres, movie.director].filter(Boolean),
  });
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const movie = await getMovieDetailBySlug(slug, {
    includeNsfw: false,
  });

  if (!movie) {
    notFound();
  }

  const watchHubHref = `/movies/watch/${slug}`;
  const quickLinks = [
    { href: '#overview', label: 'Overview' },
    ...(movie.cast.length > 0 ? [{ href: '#cast', label: 'Cast' }] : []),
    ...(movie.recommendations.length > 0 ? [{ href: '#related', label: 'More Like This' }] : []),
  ];

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
          <VideoDetailHeroWithTrailer
            theme="movie"
            backHref="/movies"
            backLabel="Back to Movies"
            poster={movie.poster}
            title={movie.title}
            subtitle={movie.duration}
            eyebrow={movie.quality}
            badges={movie.genres.slice(0, 5)}
            metadata={[
              { label: 'Rating', value: movie.rating || 'N/A' },
              { label: 'Year', value: movie.year || 'N/A' },
              { label: 'Runtime', value: movie.duration || 'N/A' },
              { label: 'Format', value: movie.quality || 'STREAM' },
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
                <Link href={watchHubHref}>
                  Start Watching
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            }
            trailerUrl={movie.trailerUrl}
            galleryVariant="compact"
          />
        }
        sidebar={
          <>
          <DetailActionCard
            theme="movie"
            title="Ready to watch"
            description="Watch page adalah jalur utama streaming. Kalau embed tersedia, player muncul langsung di flow video yang sama."
            actions={[
              { href: watchHubHref, label: 'Start Watching' },
            ]}
          />

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Jump Around</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  size="sm"
                  className="h-11 justify-center rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-3 text-[11px] font-black tracking-[0.16em] hover:bg-surface-elevated"
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </Paper>

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">At A Glance</p>
            <div className="grid gap-2.5">
              <StatCard label="Year" value={movie.year || 'N/A'} icon={Calendar} />
              <StatCard label="Runtime" value={movie.duration || 'N/A'} icon={Clock} />
              <StatCard label="Format" value={movie.quality || 'STREAM'} icon={Film} />
              <StatCard label="Cast" value={String(movie.cast.length)} icon={Play} />
              {movie.director ? <StatCard label="Director" value={movie.director} icon={Clapperboard} /> : null}
            </div>
          </Paper>
          </>
        }
        footer={<CommunityCTA mediaId={slug} title={movie.title} type="movie" theme="movie" />}
      >
        <section id="overview" className="space-y-8">
        <DetailSectionHeading title="Overview" theme="movie" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">{movie.synopsis}</p>
        </Paper>
      </section>

        {movie.cast.length > 0 ? (
          <section id="cast" className="space-y-8">
          <DetailSectionHeading
            title="Cast"
            theme="movie"
            aside={<Badge variant="outline">{movie.cast.length} Available</Badge>}
          />
          <CastRail items={movie.cast} theme="movie" layout="grid" />
          </section>
        ) : null}

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
                subtitle={item.year}
                badgeText={item.rating ? `★ ${item.rating}` : undefined}
                theme="movie"
              />
            ))}
          </div>
          </section>
        ) : null}
      </HorizontalMediaDetailPage>
    </>
  );
}
