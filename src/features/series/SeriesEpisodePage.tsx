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
import {
  getSeriesEpisodePageData,
  getSeriesEpisodePageDataByNumber,
  getSeriesEpisodePageDataBySpecialSlug,
} from '@/domains/series/server/series-episode-data';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildMetadata, buildSeriesEpisodeJsonLd } from '@/lib/seo';
import { getSeriesBadgeText, getSeriesTheme } from '@/lib/series-presentation';

interface LegacyPageProps {
  params: Promise<{ slug: string; episodeSlug: string }>;
}

interface EpisodeNumberPageProps {
  params: Promise<{ slug: string; episodeNumber: string }>;
}

interface SpecialPageProps {
  params: Promise<{ slug: string; episodeSlug: string }>;
}

type EpisodeRouteInput =
  | { mode: 'legacy'; seriesSlug: string; episodeSlug: string }
  | { mode: 'number'; seriesSlug: string; episodeNumber: string }
  | { mode: 'special'; seriesSlug: string; episodeSlug: string };

function buildLegacySeriesEpisodeHref(seriesSlug: string, episodeSlug: string): string {
  return `/series/${seriesSlug}/episodes/${episodeSlug}`;
}

function buildRequestedEpisodePath(route: EpisodeRouteInput): string {
  if (route.mode === 'legacy') {
    return buildLegacySeriesEpisodeHref(route.seriesSlug, route.episodeSlug);
  }

  if (route.mode === 'number') {
    return `/series/${route.seriesSlug}/ep/${route.episodeNumber}`;
  }

  return `/series/${route.seriesSlug}/special/${route.episodeSlug}`;
}

async function loadEpisodeRouteData(route: EpisodeRouteInput, includeNsfw: boolean) {
  if (route.mode === 'legacy') {
    return getSeriesEpisodePageData(route.episodeSlug, includeNsfw);
  }

  if (route.mode === 'number') {
    return getSeriesEpisodePageDataByNumber(route.seriesSlug, route.episodeNumber, includeNsfw);
  }

  return getSeriesEpisodePageDataBySpecialSlug(route.seriesSlug, route.episodeSlug, includeNsfw);
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

async function buildSeriesEpisodeMetadataForRoute(route: EpisodeRouteInput): Promise<Metadata> {
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await loadEpisodeRouteData(route, includeNsfw);

  if (!episode) {
    return buildMetadata({
      title: 'Episode Tidak Ditemukan',
      description: 'Episode yang kamu cari tidak tersedia di katalog series jawatch.',
      path: buildRequestedEpisodePath(route),
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
    path: episode.href,
    image: episode.poster,
  });
}

async function renderSeriesEpisodePageForRoute(route: EpisodeRouteInput) {
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await loadEpisodeRouteData(route, includeNsfw);

  if (!episode) {
    notFound();
  }

  const requestedPath = buildRequestedEpisodePath(route);
  if (episode.seriesSlug !== route.seriesSlug || episode.href !== requestedPath) {
    redirect(episode.href);
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
          episodeHref: episode.href,
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
              {episode.mirrors.length > 0 ? <Badge variant="outline">{episode.mirrors.length} sumber</Badge> : null}
            </div>
            <div className="space-y-2">
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                {episode.seriesTitle}
              </h1>
              <p className="text-base font-bold text-zinc-600 md:text-lg">{episode.title}</p>
            </div>
          </div>
        }
        stage={
          <VideoPlayer
            mirrors={episode.mirrors}
            defaultUrl={episode.defaultUrl}
            theme={theme}
            hasNext={Boolean(episode.nextEpisodeHref)}
          />
        }
        body={
          <>
            <section className="grid gap-6 border-b border-border-subtle/80 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] lg:gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest" asChild>
                    <Link href={episode.detailHref}>Detail series</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest" asChild>
                    <Link href="/watch/series">Series lainnya</Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Konteks episode
                  </p>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-600 md:text-[15px]">
                    {episode.synopsis}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{badgeText}</Badge>
                  <Badge variant="outline">{episode.playlistTotal} episode</Badge>
                  {episode.country ? <Badge variant="outline">{episode.country}</Badge> : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <MetaStat label="Pemutar" value={episode.mirrors.length > 0 ? 'Siap diputar' : 'Menunggu'} />
                <MetaStat label="Episode" value={episodeLabel} />
                <MetaStat label="Playlist" value={`${episode.playlistTotal} episode`} />
                <MetaStat label="Series" value={badgeText} />
              </div>
            </section>

            <MediaWatchExtras
              downloadGroups={episode.downloadGroups}
              community={{
                titleId: `series:${episode.seriesSlug}`,
                titleLabel: episode.seriesTitle,
                unitId: `episode:${episode.slug}`,
                unitLabel: episodeLabel,
                unitHref: episode.href,
                mediaType: theme,
                theme,
              }}
              theme={theme}
            />
          </>
        }
        rail={
          <SeriesWatchRail
            currentEpisodeHref={episode.href}
            seriesHref={episode.detailHref}
            playlist={episode.playlist}
            playlistTotal={episode.playlistTotal}
            prevEpisodeHref={episode.prevEpisodeHref}
            nextEpisodeHref={episode.nextEpisodeHref}
          />
        }
      />
    </>
  );
}

export async function generateMetadata({ params }: LegacyPageProps): Promise<Metadata> {
  const { slug, episodeSlug } = await params;
  return buildSeriesEpisodeMetadataForRoute({
    mode: 'legacy',
    seriesSlug: slug,
    episodeSlug,
  });
}

export async function generateEpisodeNumberMetadata({ params }: EpisodeNumberPageProps): Promise<Metadata> {
  const { slug, episodeNumber } = await params;
  return buildSeriesEpisodeMetadataForRoute({
    mode: 'number',
    seriesSlug: slug,
    episodeNumber,
  });
}

export async function generateSpecialEpisodeMetadata({ params }: SpecialPageProps): Promise<Metadata> {
  const { slug, episodeSlug } = await params;
  return buildSeriesEpisodeMetadataForRoute({
    mode: 'special',
    seriesSlug: slug,
    episodeSlug,
  });
}

export default async function SeriesLegacyEpisodePage({ params }: LegacyPageProps) {
  const { slug, episodeSlug } = await params;
  return renderSeriesEpisodePageForRoute({
    mode: 'legacy',
    seriesSlug: slug,
    episodeSlug,
  });
}

export async function SeriesEpisodeNumberPage({ params }: EpisodeNumberPageProps) {
  const { slug, episodeNumber } = await params;
  return renderSeriesEpisodePageForRoute({
    mode: 'number',
    seriesSlug: slug,
    episodeNumber,
  });
}

export async function SeriesSpecialEpisodePage({ params }: SpecialPageProps) {
  const { slug, episodeSlug } = await params;
  return renderSeriesEpisodePageForRoute({
    mode: 'special',
    seriesSlug: slug,
    episodeSlug,
  });
}
