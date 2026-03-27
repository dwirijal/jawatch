import { notFound } from 'next/navigation';
import { Calendar, Clapperboard, Clock, Film, Play } from 'lucide-react';
import { getMovieDetailBySlug } from '@/lib/adapters/movie';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CastRail } from '@/components/organisms/CastRail';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const movie = await getMovieDetailBySlug(slug);

  if (!movie) {
    notFound();
  }

  const watchHubHref = `/movies/watch/${slug}`;

  return (
    <DetailPageScaffold
      theme="movie"
      hero={
        <VideoDetailHero
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
            <>
              <ShareButton title={movie.title} theme="movie" />
              <BookmarkButton
                item={{
                  id: slug,
                  type: 'movie',
                  title: movie.title,
                  image: movie.poster,
                  timestamp: 0,
                }}
                theme="movie"
              />
            </>
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
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Quick Stats</p>
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
      <section className="space-y-8">
        <DetailSectionHeading title="Overview" theme="movie" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">{movie.synopsis}</p>
        </Paper>
      </section>

      {movie.cast.length > 0 ? (
        <section className="space-y-8">
          <DetailSectionHeading
            title="Cast"
            theme="movie"
            aside={<Badge variant="outline">{movie.cast.length} Available</Badge>}
          />
          <CastRail items={movie.cast} theme="movie" layout="grid" />
        </section>
      ) : null}

      {movie.recommendations.length > 0 ? (
        <section className="space-y-8">
          <DetailSectionHeading
            title="More Like This"
            theme="movie"
            aside={<Badge variant="outline">{movie.recommendations.length} Available</Badge>}
          />
          <div className="media-grid" data-grid-density="default">
            {movie.recommendations.map((item) => (
              <Card
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
    </DetailPageScaffold>
  );
}
