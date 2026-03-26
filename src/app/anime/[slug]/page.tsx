import { notFound } from 'next/navigation';
import { Play, Calendar, Monitor, BookOpen } from 'lucide-react';
import { getAnimeDetailBySlug } from '@/lib/anime-source';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { ScrollArea } from '@/components/atoms/ScrollArea';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { CastRail } from '@/components/organisms/CastRail';
import { DetailPageScaffold } from '@/components/organisms/DetailPageScaffold';
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

  return (
    <DetailPageScaffold
      hero={
        <VideoDetailHero
          theme="anime"
          backHref="/anime"
          backLabel="Back to Browse"
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
              <Button variant="anime" size="lg" className="h-12 rounded-2xl px-8" asChild>
                <Link href={watchHref}>
                  Start Watching
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            ) : null
          }
          trailerUrl={anime.trailerUrl}
        />
      }
      sidebar={
        <>
          <DetailActionCard
            theme="anime"
            title="Ready to watch"
            description="Episode links dibaca via API gateway. Buka daftar episode di bawah untuk lanjut streaming dari flow video yang sama."
            actions={watchHref ? [{ href: watchHref, label: 'Start Watching' }] : []}
          />

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Quick Stats</p>
            <div className="grid gap-2.5">
              <StatCard label="Type" value={anime.type} icon={Play} />
              <StatCard label="Studio" value={anime.studio || 'Unknown'} icon={Monitor} />
              <StatCard label="Status" value={anime.status} icon={Calendar} />
              <StatCard label="Episodes" value={anime.totalEpisodes} icon={BookOpen} />
            </div>
          </Paper>
        </>
      }
      footer={<CommunityCTA mediaId={slug} title={anime.title} type="anime" theme="anime" />}
    >
      <section className="space-y-8">
        <DetailSectionHeading title="Overview" theme="anime" />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <p className="text-sm leading-7 text-zinc-400 md:text-base">
            {anime.synopsis}
          </p>
        </Paper>
      </section>

      {anime.cast.length > 0 ? (
        <section className="space-y-8">
          <DetailSectionHeading
            title="Cast"
            theme="anime"
            aside={<Badge variant="outline">{anime.cast.length} Available</Badge>}
          />
          <CastRail items={anime.cast} theme="anime" />
        </section>
      ) : null}

      <section id="episodes" className="space-y-8">
        <DetailSectionHeading
          title="Episode Guide"
          theme="anime"
          aside={<Badge variant="outline">{anime.episodes.length} Available</Badge>}
        />

        {anime.episodes.length > 0 ? (
          <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
            <ScrollArea className="h-[600px] w-full">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {anime.episodes.map((episode) => (
                  <Paper
                    key={episode.episode_slug}
                    asChild
                    tone="muted"
                    padded={false}
                    interactive
                    className="group overflow-hidden p-4"
                  >
                    <Link href={`/anime/episode/${episode.episode_slug}`} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 transition-colors group-hover:bg-blue-600">
                        <Play className="h-4 w-4 text-blue-400 transition-colors group-hover:text-white group-hover:fill-white" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-white">
                            Episode {episode.episode_number || '?'}
                          </p>
                          <Badge variant="outline">Watch</Badge>
                        </div>
                        <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-400">{episode.title}</p>
                        {episode.release_label ? (
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">
                            {episode.release_label}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </Paper>
                ))}
              </div>
            </ScrollArea>
          </Paper>
        ) : (
          <Paper tone="muted" shadow="sm" className="p-8 text-sm font-medium text-zinc-500">
            Episode data is still being backfilled for this title.
          </Paper>
        )}
      </section>

      {anime.enrichment ? (
        <section className="space-y-8">
          <DetailSectionHeading title="Insights" theme="anime" />
          <MetadataPanel data={anime.enrichment} loading={false} />
        </section>
      ) : null}

      {anime.externalUrl ? (
        <section className="space-y-8">
          <DetailSectionHeading title="Source" theme="anime" />
          <Paper tone="muted" shadow="sm" className="space-y-3 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="anime">Samehadaku</Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Canonical</span>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-zinc-400">
              Source sudah tersinkron ke gateway, jadi kamu bisa lanjut dari daftar episode tanpa membuka source page terpisah.
            </p>
          </Paper>
        </section>
      ) : null}
    </DetailPageScaffold>
  );
}
