import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Info, MessageSquare } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { getAnimeDetailBySlug, getAnimeEpisodeBySlug, getAnimeHomeItems } from '@/lib/anime-source';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { ScrollArea } from '@/components/atoms/ScrollArea';
import { AdSection } from '@/components/organisms/AdSection';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CardGrid } from '@/components/molecules/card';
import { CastRail } from '@/components/organisms/CastRail';
import MediaDownloadOptionsPanel from '@/components/organisms/MediaDownloadOptionsPanel';
import { VideoPlaybackScaffold } from '@/components/organisms/VideoPlaybackScaffold';
import { cn } from '@/lib/utils';
import AnimeEpisodeHistoryTracker from './AnimeEpisodeHistoryTracker';
import EpisodePlaybackPanel from './EpisodePlaybackPanel';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatEpisodeLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '?';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, '');
}

function StatusBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="inline-flex items-center gap-2 border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[10px] tracking-[0.2em] text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-300" />
      {label}
    </Badge>
  );
}

export default async function EpisodePage({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getAnimeEpisodeBySlug(slug);

  if (!episode) {
    notFound();
  }

  const [anime, fallbackRecommendations] = await Promise.all([
    getAnimeDetailBySlug(episode.animeSlug).catch(() => null),
    getAnimeHomeItems(15).catch(() => []),
  ]);

  const routeHref = `/anime/episode/${episode.episodeSlug}`;
  const hasDownloads = episode.downloadGroups.length > 0;
  const recommendationItems = fallbackRecommendations.filter((item) => item.slug !== episode.animeSlug).slice(0, 12);
  const metaItems = [
    `Episode ${episode.episodeNumber}`,
    anime?.type || 'Anime',
    anime?.status || 'Unknown Status',
    episode.mirrors.length > 0 ? `${episode.mirrors.length} Mirrors` : `${episode.serverOptions.length} Sources`,
    `${episode.playlist.length} Queue`,
    hasDownloads ? `${episode.downloadGroups.length} Download Packs` : 'Downloads Pending',
  ];

  return (
    <>
      <AnimeEpisodeHistoryTracker
        animeSlug={episode.animeSlug}
        animeTitle={episode.animeTitle}
        image={episode.poster}
        episodeTitle={episode.title}
        href={routeHref}
      />

      <VideoPlaybackScaffold
        backHref={episode.animeDetailHref}
        eyebrow="Now Watching"
        title={episode.title}
        subtitle={
          <>
            <span>{episode.animeTitle}</span>
            {episode.releaseLabel ? (
              <>
                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                <span>{episode.releaseLabel}</span>
              </>
            ) : null}
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span>Episode {episode.episodeNumber}</span>
          </>
        }
        stage={
          <>
            <EpisodePlaybackPanel
              mirrors={episode.mirrors}
              defaultUrl={episode.defaultUrl}
              title={episode.title}
              downloadHref={hasDownloads ? '#downloads' : undefined}
              serverOptions={episode.serverOptions}
            />

            <section className="space-y-4">
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max items-center gap-2 pb-1">
                  <Button variant="outline" size="sm" className="h-11 rounded-full border-border-subtle bg-surface-1 px-4 hover:bg-surface-elevated" asChild>
                    <Link href={episode.animeDetailHref}>
                      <Info className="mr-2 h-3.5 w-3.5 text-blue-400" />
                      View Details
                    </Link>
                  </Button>

                  {hasDownloads ? (
                    <Button variant="outline" size="sm" className="h-11 rounded-full border-border-subtle bg-surface-1 px-4 hover:bg-surface-elevated" asChild>
                      <Link href="#downloads">
                        Downloads
                        <Download className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}

                  <Button variant="outline" size="sm" className="h-11 rounded-full border-sky-400/20 bg-sky-500/10 px-4 text-sky-300 hover:bg-sky-500/15" asChild>
                    <a href="https://discord.gg/gu5bgTXxhQ" target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      Join Community
                    </a>
                  </Button>

                  <ShareButton title={episode.title} theme="anime" className="h-11 w-11 rounded-full border-border-subtle bg-surface-1" />

                  <BookmarkButton
                    item={{
                      id: routeHref,
                      type: 'anime',
                      title: episode.title,
                      image: episode.poster,
                      timestamp: 0,
                    }}
                    theme="anime"
                    className="h-11 rounded-full border-border-subtle bg-surface-1 px-4"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="space-y-6">
                <Paper as="article" tone="muted" className="rounded-[var(--radius-2xl)] p-4 md:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {episode.genres.slice(0, 4).map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className="bg-surface-2 px-3 py-2 text-[10px] tracking-[0.22em] text-zinc-300"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    <StatusBadge label="Playback Ready" />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <SectionHeader title="Overview" className="border-b-0 pb-0" contentClassName="space-y-0" />
                      <p className="max-w-4xl text-sm leading-6 text-zinc-400">{episode.synopsis}</p>
                    </div>

                    {anime?.cast.length ? (
                      <div className="space-y-4">
                        <SectionHeader title="Cast" className="border-b-0 pb-0" contentClassName="space-y-0" />
                        <CastRail items={anime.cast} theme="anime" layout="scroll" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
                    {metaItems.map((item) => (
                      <Paper
                        key={item}
                        as="div"
                        tone="outline"
                        padded={false}
                        className="rounded-[var(--radius-md)] bg-surface-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300"
                      >
                        {item}
                      </Paper>
                    ))}
                  </div>
                </Paper>

                {hasDownloads ? <MediaDownloadOptionsPanel groups={episode.downloadGroups} accent="blue" /> : null}
              </div>
            </section>
          </>
        }
        sidebar={
          <Paper as="section" tone="muted" padded={false} className="overflow-hidden rounded-[var(--radius-2xl)]">
              <div className="px-4 py-4 md:px-5">
                <SectionHeader
                  title="Queue"
                  subtitle="Up next and full playlist rail"
                  className="pb-0"
                  action={
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!episode.prevEpisodeSlug}
                        asChild={Boolean(episode.prevEpisodeSlug)}
                        className="h-10 w-10 rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 hover:bg-surface-elevated"
                      >
                        {episode.prevEpisodeSlug ? (
                          <Link href={`/anime/episode/${episode.prevEpisodeSlug}`}>
                            <ChevronLeft className="h-4 w-4" />
                          </Link>
                        ) : (
                          <ChevronLeft className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!episode.nextEpisodeSlug}
                        asChild={Boolean(episode.nextEpisodeSlug)}
                        className="h-10 w-10 rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 hover:bg-surface-elevated"
                      >
                        {episode.nextEpisodeSlug ? (
                          <Link href={`/anime/episode/${episode.nextEpisodeSlug}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  }
                />
              </div>

              <ScrollArea className="max-h-[calc(100vh-3rem)]">
                <div className="space-y-2 p-2.5 md:p-3">
                  {episode.playlist.map((item) => {
                    const isActive = item.episode_slug === episode.episodeSlug;

                    return (
                      <Paper
                        key={item.episode_slug}
                        asChild
                        tone={isActive ? 'muted' : 'outline'}
                        padded={false}
                        className={cn(
                          'overflow-hidden p-2.5 transition-colors md:p-3',
                          isActive
                            ? 'border-blue-500/35 bg-blue-500/10'
                            : 'hover:bg-surface-elevated'
                        )}
                      >
                        <Link href={`/anime/episode/${item.episode_slug}`} className="flex gap-3 text-left">
                          <div className="relative w-36 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-surface-2">
                            <Image
                              src={episode.poster || '/favicon.ico'}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="160px"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-2 right-2 rounded-[var(--radius-sm)] bg-black/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                              EP {formatEpisodeLabel(item.episode_number)}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                              Episode {formatEpisodeLabel(item.episode_number)}
                            </p>
                            <p className="line-clamp-2 text-sm font-black leading-5 text-white/90">{item.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                              {item.release_label ? <span>{item.release_label}</span> : <span>Queue Item</span>}
                              {isActive ? (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                                  <span className="text-blue-300">Now Playing</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      </Paper>
                    );
                  })}
                </div>
              </ScrollArea>
            </Paper>
        }
      >
        {recommendationItems.length > 0 ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Recommended Anime</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">More Like This</h2>
              </div>
              <Button variant="outline" size="sm" className="h-11 rounded-full border-border-subtle bg-surface-1 px-5 hover:bg-surface-elevated" asChild>
                <Link href="/anime">See All</Link>
              </Button>
            </div>

            <CardGrid>
              {recommendationItems.slice(0, 12).map((item) => (
                <Card
                  key={item.slug}
                  href={`/anime/${item.slug}`}
                  image={item.thumb}
                  title={item.title}
                  subtitle={item.status || item.episode}
                  badgeText={item.type || 'Anime'}
                  theme="anime"
                />
              ))}
            </CardGrid>
          </section>
        ) : null}

        <AdSection />

        <CommunityCTA mediaId={slug} title={episode.title} type="anime" theme="anime" />
      </VideoPlaybackScaffold>
    </>
  );
}
