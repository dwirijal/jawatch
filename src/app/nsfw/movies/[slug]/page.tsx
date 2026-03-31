import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CardRail } from '@/components/molecules/card';
import { CastRail } from '@/components/organisms/CastRail';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { getMovieDetailBySlug } from '@/lib/adapters/movie';
import { getNsfwMovieDetailHref, getNsfwMovieWatchHref } from '@/lib/nsfw-routes';
import { requireNsfwAccess } from '../../access';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NsfwMovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await requireNsfwAccess(getNsfwMovieDetailHref(slug));

  const movie = await getMovieDetailBySlug(slug, {
    includeNsfw: true,
  });

  if (!movie) {
    notFound();
  }

  const watchHubHref = getNsfwMovieWatchHref(slug);
  const quickLinks = [
    { href: '#overview', label: 'Overview' },
    ...(movie.cast.length > 0 ? [{ href: '#cast', label: 'Cast' }] : []),
    ...(movie.recommendations.length > 0 ? [{ href: '#related', label: 'More Like This' }] : []),
  ];

  return (
    <HorizontalMediaDetailPage
      theme="movie"
      hero={
        <VideoDetailHero
          theme="movie"
          backHref="/nsfw#movies"
          backLabel="Back to NSFW"
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
          controls={<ShareButton title={movie.title} theme="movie" />}
          primaryAction={
            <Button variant="movie" size="lg" className="h-11 rounded-[var(--radius-lg)] px-5" asChild>
              <Link href={watchHubHref}>
                Start Watching
                <Info className="ml-2 h-4 w-4" />
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
            description="Route NSFW ini menjaga playback tetap di namespace tertutup yang sama."
            actions={[{ href: watchHubHref, label: 'Start Watching' }]}
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
        </>
      }
      footer={<CommunityCTA mediaId={`nsfw:${slug}`} title={movie.title} type="movie" theme="movie" />}
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
          <CardRail variant="default">
            {movie.recommendations.map((item) => (
              <MediaCard
                key={item.slug}
                href={getNsfwMovieDetailHref(item.slug)}
                image={item.poster}
                title={item.title}
                subtitle={item.year}
                badgeText={item.rating ? `★ ${item.rating}` : undefined}
                theme="movie"
              />
            ))}
          </CardRail>
        </section>
      ) : null}
    </HorizontalMediaDetailPage>
  );
}
