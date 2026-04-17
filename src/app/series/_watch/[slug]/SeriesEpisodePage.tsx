import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { MediaWatchExtras } from '@/components/organisms/MediaWatchExtras';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { WatchModeSurface } from '@/components/organisms/WatchModeSurface';
import { SeriesWatchRail } from '@/components/organisms/WatchRails';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getSeriesEpisodeBySlug } from '@/lib/adapters/series';
import { buildMetadata, buildSeriesEpisodeJsonLd } from '@/lib/seo';
import { getSeriesBadgeText, getSeriesTheme } from '@/lib/series-presentation';

interface PageProps {
  params: Promise<{ slug: string; episodeSlug?: string }>;
}

function buildSeriesEpisodeHref(seriesSlug: string, episodeSlug: string): string {
  return `/series/${seriesSlug}/episodes/${episodeSlug}`;
}

function collapseRepeatedLeadingPhrase(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const maxChunkSize = Math.floor(parts.length / 2);

  for (let size = maxChunkSize; size >= 1; size -= 1) {
    const left = parts.slice(0, size).join(' ').toLowerCase();
    const right = parts.slice(size, size * 2).join(' ').toLowerCase();

    if (left === right) {
      return [...parts.slice(0, size), ...parts.slice(size * 2)].join(' ');
    }
  }

  return value.trim();
}

function stripSubtitleIndonesia(value: string): string {
  return value.replace(/\s+subtitle indonesia$/i, '').trim();
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border-subtle/70 pb-3">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const requestedEpisodeSlug = resolvedParams.episodeSlug || resolvedParams.slug;
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await getSeriesEpisodeBySlug(requestedEpisodeSlug, {
    includeNsfw,
  });

  if (!episode) {
    return buildMetadata({
      title: 'Episode Tidak Ditemukan',
      description: 'Episode yang kamu cari tidak tersedia di katalog series jawatch.',
      path: buildSeriesEpisodeHref(resolvedParams.slug, requestedEpisodeSlug),
      noIndex: true,
    });
  }

  const episodeLabel = episode.episodeNumber ? `Episode ${episode.episodeNumber}` : episode.episodeLabel || episode.title;
  const normalizedSeriesTitle = stripSubtitleIndonesia(collapseRepeatedLeadingPhrase(episode.seriesTitle));
  const normalizedEpisodeTitle = stripSubtitleIndonesia(collapseRepeatedLeadingPhrase(episode.title));
  const normalizedTitle = normalizedEpisodeTitle.toLowerCase().includes(normalizedSeriesTitle.toLowerCase())
    ? normalizedEpisodeTitle
    : `${normalizedSeriesTitle} ${stripSubtitleIndonesia(episodeLabel)}`.trim();

  return buildMetadata({
    title: `${normalizedTitle} Subtitle Indonesia`,
    description: `Nonton ${normalizedTitle} subtitle Indonesia${episode.country ? ` dari ${episode.country}` : ''}${episode.year ? ` rilis ${episode.year}` : ''}.`,
    path: buildSeriesEpisodeHref(episode.seriesSlug, episode.slug),
    image: episode.poster,
  });
}

export default async function SeriesWatchPage({ params }: PageProps) {
  const resolvedParams = await params;
  const requestedSeriesSlug = resolvedParams.slug;
  const requestedEpisodeSlug = resolvedParams.episodeSlug || resolvedParams.slug;
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await getSeriesEpisodeBySlug(requestedEpisodeSlug, {
    includeNsfw,
  });

  if (!episode) {
    notFound();
  }

  if (episode.seriesSlug !== requestedSeriesSlug || episode.slug !== requestedEpisodeSlug) {
    redirect(buildSeriesEpisodeHref(episode.seriesSlug, episode.slug));
  }

  const theme = getSeriesTheme(episode.mediaType);
  const badgeText = getSeriesBadgeText(episode.mediaType);
  const episodeLabel = episode.episodeNumber ? `Episode ${episode.episodeNumber}` : episode.episodeLabel || episode.title;

  return (
    <>
      <JsonLd
        data={buildSeriesEpisodeJsonLd({
          seriesTitle: episode.seriesTitle,
          seriesSlug: episode.seriesSlug,
          episodeTitle: episode.title,
          episodeSlug: episode.slug,
          poster: episode.poster,
          description: episode.synopsis,
          episodeNumber: episode.episodeNumber,
          country: episode.country,
        })}
      />

      <WatchModeSurface
        kind="series"
        header={
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={theme}>{badgeText}</Badge>
              <Badge variant="outline">{episodeLabel}</Badge>
              {episode.year ? <Badge variant="outline">{episode.year}</Badge> : null}
              {episode.country ? <Badge variant="outline">{episode.country}</Badge> : null}
              {episode.mirrors.length > 0 ? <Badge variant="outline">{episode.mirrors.length} mirrors</Badge> : null}
            </div>
            <div className="space-y-2">
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                {episode.seriesTitle}
              </h1>
              <p className="text-base font-bold text-zinc-600 md:text-lg">{episode.title}</p>
              <p className="max-w-3xl text-sm leading-7 text-zinc-500 md:text-base">
                {episode.synopsis}
              </p>
            </div>
          </div>
        }
        headerActions={
          <>
            <Button variant="outline" className="h-11 rounded-[var(--radius-md)] px-4" asChild>
              <Link href={episode.detailHref}>Series detail</Link>
            </Button>
            <Button variant="outline" className="h-11 rounded-[var(--radius-md)] px-4" asChild>
              <Link href="/watch/series">More series</Link>
            </Button>
          </>
        }
        stage={
          <VideoPlayer
            mirrors={episode.mirrors}
            defaultUrl={episode.defaultUrl}
            title={episode.title}
            theme={theme}
            hasNext={Boolean(episode.nextEpisodeSlug)}
          />
        }
        body={
          <>
            <section className="grid gap-6 border-b border-border-subtle/80 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:gap-8">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Episode context
                  </p>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-600 md:text-[15px]">
                    {episode.synopsis}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{badgeText}</Badge>
                  <Badge variant="outline">{episode.playlist.length} episodes</Badge>
                  {episode.country ? <Badge variant="outline">{episode.country}</Badge> : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <MetaStat label="Playback" value={episode.mirrors.length > 0 ? 'Inline ready' : 'Pending'} />
                <MetaStat label="Current" value={episodeLabel} />
                <MetaStat label="Playlist" value={`${episode.playlist.length} episodes`} />
                <MetaStat label="Series" value={badgeText} />
              </div>
            </section>

            <MediaWatchExtras
              downloadGroups={episode.downloadGroups}
              community={{
                mediaId: episode.seriesSlug,
                title: episode.seriesTitle,
                type: 'series',
                theme,
              }}
              theme={theme}
            />
          </>
        }
        rail={
          <SeriesWatchRail
            seriesSlug={episode.seriesSlug}
            currentEpisodeSlug={episode.slug}
            playlist={episode.playlist}
            prevEpisodeSlug={episode.prevEpisodeSlug}
            nextEpisodeSlug={episode.nextEpisodeSlug}
          />
        }
      />
    </>
  );
}
