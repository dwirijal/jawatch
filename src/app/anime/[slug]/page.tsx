import { notFound } from 'next/navigation';
import { Play, BookOpen } from 'lucide-react';
import { getAnimeDetailBySlug } from '@/lib/adapters/anime';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { CastRail } from '@/components/organisms/CastRail';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { MetadataPanel } from '@/components/organisms/MetadataPanel';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { Link } from '@/components/atoms/Link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const anime = await getAnimeDetailBySlug(slug);

  if (!anime) {
    notFound();
  }

  const watchHref = anime.episodes[0]?.episode_slug ? `/anime/episode/${anime.episodes[0].episode_slug}` : '';
  const quickLinks = [
    { href: '#episodes', label: 'Episode Guide' },
    { href: '#overview', label: 'Overview' },
    ...(anime.cast.length > 0 ? [{ href: '#cast', label: 'Cast' }] : []),
    ...(anime.enrichment ? [{ href: '#insights', label: 'Insights' }] : []),
  ];
  const utilityStats = [
    { label: 'Available Now', value: `${anime.episodes.length || Number(anime.totalEpisodes) || 0} Episodes` },
    { label: 'Genres', value: `${anime.genres.length} Tags` },
    { label: 'Cast', value: anime.cast.length ? `${anime.cast.length} Credits` : 'Unavailable' },
    { label: 'Trailer', value: anime.trailerUrl ? 'Available' : 'Unavailable' },
  ];

  return (
    <HorizontalMediaDetailPage
      theme="anime"
      hero={
        <VideoDetailHero
          theme="anime"
          backHref="/anime"
          backLabel="Back to Anime"
          poster={anime.poster}
          title={anime.title}
          subtitle={anime.alternativeTitle}
          eyebrow={anime.type}
          badges={anime.genres.slice(0, 5)}
          metadata={[
            { label: 'Rating', value: anime.rating || 'N/A' },
            { label: 'Studio', value: anime.studio || 'Unknown' },
            { label: 'Status', value: anime.status || 'Unknown' },
            { label: 'Episodes', value: anime.totalEpisodes || 'Unknown' },
          ]}
          controls={
            <>
              <ShareButton title={anime.title} theme="anime" />
              <BookmarkButton
                item={{
                  id: slug,
                  type: 'anime',
                  title: anime.title,
                  image: anime.poster,
                  timestamp: 0,
                }}
                theme="anime"
              />
            </>
          }
          primaryAction={
            watchHref ? (
              <Button variant="anime" size="lg" className="h-12 rounded-[var(--radius-lg)] px-8" asChild>
                <Link href={watchHref}>
                  Start Watching
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            ) : null
          }
          secondaryAction={
            <Button variant="outline" size="lg" className="h-12 rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 px-6 hover:bg-surface-elevated" asChild>
              <Link href="#episodes">
                Episode Guide
                <BookOpen className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
          trailerUrl={anime.trailerUrl}
          galleryVariant="compact"
        />
      }
      sidebar={
        <>
          <DetailActionCard
            theme="anime"
            title="Ready to watch"
            description="Start instantly, or jump straight to the episode guide if you want to pick manually."
            actions={[
              ...(watchHref ? [{ href: watchHref, label: 'Start Watching', icon: Play }] : []),
              { href: '#episodes', label: 'Open Episode Guide', icon: BookOpen, variant: 'outline' },
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
              {utilityStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-3.5 py-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                  <p className="mt-1.5 text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </Paper>
        </>
      }
      footer={<CommunityCTA mediaId={slug} title={anime.title} type="anime" theme="anime" />}
    >
      <section id="episodes" className="space-y-8">
        <DetailSectionHeading
          title="Episode Guide"
          theme="anime"
          aside={
            <div className="flex items-center gap-2">
              {anime.episodes.length > 0 ? <Badge variant="outline">{anime.episodes.length} Available</Badge> : undefined}
              {watchHref ? (
                <Button variant="outline" size="sm" className="h-10 rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4 hover:bg-surface-elevated" asChild>
                  <Link href={watchHref}>Start Watching</Link>
                </Button>
              ) : null}
            </div>
          }
        />

        {anime.episodes.length > 0 ? (
          <Paper tone="muted" shadow="sm" className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-zinc-400">
                Start from the beginning or jump straight to the episode you want. The guide stays compact even for longer series.
              </p>
              <Badge variant="outline">Latest First</Badge>
            </div>

            <div className="max-h-[760px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {anime.episodes.map((episode) => (
                  <Link key={episode.episode_slug} href={`/anime/episode/${episode.episode_slug}`} className="group block">
                    <Paper
                      tone="muted"
                      padded={false}
                      interactive
                      className="overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface-1 p-4 transition-colors group-hover:bg-surface-elevated"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-600/10 text-sm font-black tracking-[0.08em] text-blue-300 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          {episode.episode_number || '?'}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-black uppercase tracking-[0.14em] text-white">
                              Episode {episode.episode_number || '?'}
                            </p>
                            <Badge variant="outline">Watch</Badge>
                          </div>

                          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">{episode.title}</p>

                          {episode.release_label ? (
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">
                              {episode.release_label}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Paper>
                  </Link>
                ))}
              </div>
            </div>
          </Paper>
        ) : (
          <StateInfo
            title="Episode guide unavailable"
            description="Episode data is unavailable for this title right now."
          />
        )}
      </section>

      <section id="overview" className="space-y-8">
        <DetailSectionHeading title="Overview" theme="anime" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">
            {anime.synopsis}
          </p>
        </Paper>
      </section>

      {anime.cast.length > 0 ? (
        <section id="cast" className="space-y-8">
          <DetailSectionHeading
            title="Cast"
            theme="anime"
            aside={<Badge variant="outline">{anime.cast.length} Available</Badge>}
          />
          <CastRail items={anime.cast} theme="anime" />
        </section>
      ) : null}

      {anime.enrichment ? (
        <section id="insights" className="space-y-8">
          <DetailSectionHeading title="Insights" theme="anime" />
          <MetadataPanel data={anime.enrichment} loading={false} />
        </section>
      ) : null}
    </HorizontalMediaDetailPage>
  );
}
