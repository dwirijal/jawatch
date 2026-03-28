import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { getAnimeDetailBySlug, getAnimeEpisodeBySlug, getAnimeHomeItems } from '@/lib/adapters/anime';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { AdSection } from '@/components/organisms/AdSection';
import { BookmarkButton } from '@/components/organisms/BookmarkButton';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { HorizontalPlayerPage } from '@/components/organisms/HorizontalPlayerPage';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { ShareButton } from '@/components/molecules/ShareButton';
import { CastRail } from '@/components/organisms/CastRail';
import MediaDownloadOptionsPanel from '@/components/organisms/MediaDownloadOptionsPanel';
import { cn } from '@/lib/utils';
import AnimeEpisodeHistoryTracker from './AnimeEpisodeHistoryTracker';
import EpisodePlaybackPanel from './EpisodePlaybackPanel';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type EpisodeQueueItem = Awaited<ReturnType<typeof getAnimeEpisodeBySlug>> extends infer T
  ? T extends { playlist: infer P }
    ? P extends Array<infer U>
      ? U
      : never
    : never
  : never;

function formatEpisodeLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '?';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, '');
}

function buildEpisodeQueue(items: EpisodeQueueItem[], animeSlug: string): EpisodeQueueItem[] {
  const seen = new Set<string>();
  const queue: EpisodeQueueItem[] = [];

  for (const item of items) {
    const episodePart = formatEpisodeLabel(item.episode_number);
    const derivedSlug =
      animeSlug && episodePart !== '?'
        ? `${animeSlug}-episode-${episodePart.toLowerCase()}`
        : '';
    const candidates = [item.episode_slug, derivedSlug].filter(Boolean);
    const canonicalSlug = candidates.find((candidate) => !seen.has(candidate)) || candidates[0];

    if (!canonicalSlug || seen.has(canonicalSlug)) {
      continue;
    }

    seen.add(canonicalSlug);
    queue.push({
      ...item,
      episode_slug: canonicalSlug,
    });
  }

  return queue;
}

function getEpisodeSelectorLabel(item: EpisodeQueueItem): string {
  const label = formatEpisodeLabel(item.episode_number);
  return label === '?' ? 'SP' : label;
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
  const queueItems = buildEpisodeQueue(episode.playlist, episode.animeSlug);
  const recommendationItems = fallbackRecommendations.filter((item) => item.slug !== episode.animeSlug).slice(0, 12);
  const metaItems = [
    `Episode ${episode.episodeNumber}`,
    anime?.type || 'Anime',
    anime?.status || 'Unknown Status',
    episode.mirrors.length > 0 ? `${episode.mirrors.length} Mirrors` : `${episode.serverOptions.length} Sources`,
    `${queueItems.length} Queue`,
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

      <HorizontalPlayerPage
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
        desktopColumnsClassName="xl:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] xl:grid-rows-1"
        stretchSidebarToStage
        stage={
          <EpisodePlaybackPanel
            mirrors={episode.mirrors}
            defaultUrl={episode.defaultUrl}
            title={episode.title}
            downloadHref={hasDownloads ? '#downloads' : undefined}
            serverOptions={episode.serverOptions}
          />
        }
        sidebar={
          <Paper as="section" tone="muted" className="flex h-full min-h-0 flex-col gap-4 rounded-[var(--radius-2xl)] p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Episodes</p>
                <h2 className="mt-2 text-lg font-black tracking-tight text-white">Picker</h2>
              </div>
              <Badge variant="outline">{queueItems.length}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!episode.prevEpisodeSlug}
                asChild={Boolean(episode.prevEpisodeSlug)}
                className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 hover:bg-surface-elevated"
              >
                {episode.prevEpisodeSlug ? (
                  <Link href={`/anime/episode/${episode.prevEpisodeSlug}`} aria-label="Previous episode">
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
                className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 hover:bg-surface-elevated"
              >
                {episode.nextEpisodeSlug ? (
                  <Link href={`/anime/episode/${episode.nextEpisodeSlug}`} aria-label="Next episode">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4">
              {queueItems.map((item) => {
                const isActive = item.episode_slug === episode.episodeSlug;
                const label = getEpisodeSelectorLabel(item);

                return (
                  <Button
                    key={item.episode_slug}
                    variant={isActive ? 'anime' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-11 rounded-[var(--radius-md)] px-0 text-[11px] font-black tracking-[0.16em]',
                      !isActive && 'border-border-subtle bg-surface-1 text-zinc-300 hover:bg-surface-elevated'
                    )}
                    asChild
                  >
                    <Link
                      href={`/anime/episode/${item.episode_slug}`}
                      aria-label={label === 'SP' ? `Special episode: ${item.title}` : `Episode ${label}: ${item.title}`}
                    >
                      {label}
                    </Link>
                  </Button>
                );
              })}
              </div>
            </div>
          </Paper>
        }
      >
        <section className="space-y-6">
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
              <Badge variant="outline">{metaItems.length} Stats</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
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

          <Paper as="article" tone="muted" className="rounded-[var(--radius-2xl)] p-4 md:p-5">
            <div className="space-y-3">
              <SectionHeader title="Overview" className="border-b-0 pb-0" contentClassName="space-y-0" />
              <p className="max-w-4xl text-sm leading-6 text-zinc-400">{episode.synopsis}</p>
            </div>
          </Paper>

          {anime?.cast.length ? (
            <Paper as="article" tone="muted" className="rounded-[var(--radius-2xl)] p-4 md:p-5">
              <div className="space-y-4">
                <SectionHeader title="Cast" className="border-b-0 pb-0" contentClassName="space-y-0" />
                <CastRail items={anime.cast} theme="anime" layout="scroll" />
              </div>
            </Paper>
          ) : null}

          {hasDownloads ? <MediaDownloadOptionsPanel groups={episode.downloadGroups} accent="blue" /> : null}

          <AdSection title="Partner Spotlight" subtitle="Take a short break before the next episode." theme="anime" />
        </section>

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

            <div className="media-grid" data-grid-density="default">
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
            </div>
          </section>
        ) : null}

        <AdSection theme="anime" />

        <CommunityCTA mediaId={slug} title={episode.title} type="anime" theme="anime" />
      </HorizontalPlayerPage>
    </>
  );
}
