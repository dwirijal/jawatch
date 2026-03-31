import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { MediaWatchPage } from '@/components/organisms/MediaWatchPage';
import { getSeriesEpisodeBySlug } from '@/lib/adapters/series';
import { getSeriesBadgeText, getSeriesTheme } from '@/lib/series-presentation';
import { getServerAuthStatus } from '@/lib/server/auth-session';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SeriesWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerAuthStatus();
  const episode = await getSeriesEpisodeBySlug(slug, {
    includeNsfw: session.authenticated,
  });

  if (!episode) {
    notFound();
  }

  const theme = getSeriesTheme(episode.mediaType);
  const badgeText = getSeriesBadgeText(episode.mediaType);

  return (
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={theme} className="px-2 py-0.5 text-[10px]">{badgeText}</Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px]">Episode {episode.episodeNumber || '?'}</Badge>
              {episode.year ? <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{episode.year}</Badge> : null}
              {episode.country ? <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{episode.country}</Badge> : null}
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{episode.seriesTitle}</h2>
            <p className="line-clamp-5 text-sm leading-6 text-zinc-400">{episode.synopsis}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!episode.prevEpisodeSlug} asChild={Boolean(episode.prevEpisodeSlug)}>
              {episode.prevEpisodeSlug ? (
                <Link href={`/series/watch/${episode.prevEpisodeSlug}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Prev
                </Link>
              ) : (
                <span><ChevronLeft className="mr-2 h-4 w-4" /> Prev</span>
              )}
            </Button>
            <Button variant="outline" disabled={!episode.nextEpisodeSlug} asChild={Boolean(episode.nextEpisodeSlug)}>
              {episode.nextEpisodeSlug ? (
                <Link href={`/series/watch/${episode.nextEpisodeSlug}`}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
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
  );
}
