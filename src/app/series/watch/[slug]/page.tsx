import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { PendingLinkHint } from '@/components/atoms/PendingLinkHint';
import { Paper } from '@/components/atoms/Paper';
import { Typography } from '@/components/atoms/Typography';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { MediaWatchPage } from '@/components/organisms/MediaWatchPage';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { getSeriesEpisodeBySlug } from '@/lib/adapters/series';
import { resolveSeriesCanonicalRedirect } from '@/lib/adapters/series-canonical-utils';
import { buildMetadata, buildSeriesEpisodeJsonLd } from '@/lib/seo';
import { getSeriesBadgeText, getSeriesTheme } from '@/lib/series-presentation';

interface PageProps {
  params: Promise<{ slug: string }>;
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await getSeriesEpisodeBySlug(slug, {
    includeNsfw,
  });

  if (!episode) {
    return buildMetadata({
      title: 'Episode Tidak Ditemukan',
      description: 'Episode yang kamu cari tidak tersedia di katalog series jawatch.',
      path: `/series/watch/${slug}`,
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
    path: `/series/watch/${episode.slug}`,
    image: episode.poster,
  });
}

export default async function SeriesWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const includeNsfw = await resolveViewerNsfwAccess();
  const episode = await getSeriesEpisodeBySlug(slug, {
    includeNsfw,
  });

  if (!episode) {
    notFound();
  }

  const redirectPath = resolveSeriesCanonicalRedirect('/series/watch', slug, episode);
  if (redirectPath) {
    redirect(redirectPath);
  }

  const theme = getSeriesTheme(episode.mediaType);
  const badgeText = getSeriesBadgeText(episode.mediaType);

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
      <MediaWatchPage
        backHref={episode.detailHref}
        eyebrow="Now Watching"
        title={episode.seriesTitle}
        subtitle={
          <>
            <Badge variant={theme} className="px-2 py-0.5 text-[10px]">
              {badgeText}
            </Badge>
            <p className="text-[10px] md:text-xs">{episode.title}</p>
          </>
        }
        browseHref="/series"
        browseLabel="More Series"
        theme={theme}
        stage={
          <VideoPlayer
            mirrors={episode.mirrors}
            defaultUrl={episode.defaultUrl}
            title={episode.title}
            theme={theme}
            hasNext={Boolean(episode.nextEpisodeSlug)}
          />
        }
        sidebar={
          <Paper tone="muted" shadow="sm" className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={theme} className="px-2 py-0.5 text-[10px]">{badgeText}</Badge>
                <Badge variant="outline" className="px-2 py-0.5 text-[10px]">Episode {episode.episodeNumber || '?'}</Badge>
                {episode.year ? <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{episode.year}</Badge> : null}
              </div>
              
              <div className="space-y-1.5">
                <Typography as="h2" size="xl" className="font-black leading-tight text-white">
                  {episode.seriesTitle}
                </Typography>
                <Typography size="sm" className="font-bold text-zinc-500">
                  {episode.title}
                </Typography>
              </div>

              <Typography size="base" className="line-clamp-4 leading-relaxed text-zinc-400">
                {episode.synopsis}
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={!episode.prevEpisodeSlug} asChild={Boolean(episode.prevEpisodeSlug)}>
                {episode.prevEpisodeSlug ? (
                  <Link href={`/series/watch/${episode.prevEpisodeSlug}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Prev
                    <PendingLinkHint label="Membuka episode sebelumnya..." />
                  </Link>
                ) : (
                  <span><ChevronLeft className="mr-2 h-4 w-4" /> Prev</span>
                )}
              </Button>
              <Button variant="outline" disabled={!episode.nextEpisodeSlug} asChild={Boolean(episode.nextEpisodeSlug)}>
                {episode.nextEpisodeSlug ? (
                  <Link href={`/series/watch/${episode.nextEpisodeSlug}`}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                    <PendingLinkHint label="Membuka episode berikutnya..." />
                  </Link>
                ) : (
                  <span>Next <ChevronRight className="ml-2 h-4 w-4" /></span>
                )}
              </Button>
            </div>
          </Paper>
        }
        downloadGroups={episode.downloadGroups}
        community={{
          mediaId: episode.seriesSlug,
          title: episode.seriesTitle,
          type: 'series',
          theme,
        }}
      >
      </MediaWatchPage>
    </>
  );
}
