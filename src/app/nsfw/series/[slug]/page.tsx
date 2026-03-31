import { notFound } from 'next/navigation';
import { Play } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { CardRail } from '@/components/molecules/card';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { ShareButton } from '@/components/molecules/ShareButton';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { getSeriesDetailBySlug } from '@/lib/adapters/series';
import {
  formatSeriesCardSubtitle,
  getSeriesBadgeText,
  getSeriesTheme,
} from '@/lib/series-presentation';
import { getNsfwSeriesDetailHref, getNsfwSeriesWatchHref } from '@/lib/nsfw-routes';
import { requireNsfwAccess } from '../../access';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; sort?: string }>;
}

const EPISODES_PER_PAGE = 24;

type EpisodeSortMode = 'latest' | 'az';

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let videoId = '';

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return null;
  }
}

function normalizeEpisodeSort(value: string | undefined): EpisodeSortMode {
  return value === 'az' ? 'az' : 'latest';
}

function normalizePage(value: string | undefined): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildEpisodeQueryHref(slug: string, page: number, sort: EpisodeSortMode): string {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set('page', String(page));
  }
  if (sort !== 'latest') {
    params.set('sort', sort);
  }
  const query = params.toString();
  const detailHref = getNsfwSeriesDetailHref(slug);
  return query ? `${detailHref}?${query}#episodes` : `${detailHref}#episodes`;
}

export default async function NsfwSeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  await requireNsfwAccess(getNsfwSeriesDetailHref(slug));

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const series = await getSeriesDetailBySlug(slug, {
    includeNsfw: true,
  });

  if (!series) {
    notFound();
  }

  const theme = getSeriesTheme(series.mediaType);
  const latestEpisodeHref = series.episodes[0] ? getNsfwSeriesWatchHref(series.episodes[0].slug) : null;
  const trailerEmbedUrl = getYouTubeEmbedUrl(series.trailerUrl);
  const episodeSort = normalizeEpisodeSort(resolvedSearchParams?.sort);
  const sortedEpisodes = [...series.episodes];
  if (episodeSort === 'az') {
    sortedEpisodes.sort((left, right) => {
      const leftLabel = (left.title || left.label).trim().toLowerCase();
      const rightLabel = (right.title || right.label).trim().toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    });
  }
  const totalPages = Math.max(1, Math.ceil(sortedEpisodes.length / EPISODES_PER_PAGE));
  const currentPage = Math.min(normalizePage(resolvedSearchParams?.page), totalPages);
  const pageStart = (currentPage - 1) * EPISODES_PER_PAGE;
  const visibleEpisodes = sortedEpisodes.slice(pageStart, pageStart + EPISODES_PER_PAGE);
  const previousPageHref = currentPage > 1 ? buildEpisodeQueryHref(slug, currentPage - 1, episodeSort) : null;
  const nextPageHref = currentPage < totalPages ? buildEpisodeQueryHref(slug, currentPage + 1, episodeSort) : null;

  return (
    <HorizontalMediaDetailPage
      theme={theme}
      hero={
        <VideoDetailHero
          theme={theme}
          backHref="/nsfw#series"
          backLabel="Back to NSFW"
          poster={series.poster}
          title={series.title}
          eyebrow={series.seasonLabel}
          badges={series.genres.slice(0, 5)}
          metadata={[
            { label: 'Rating', value: series.rating },
            { label: 'Year', value: series.year || 'Tidak Tersedia' },
            { label: 'Country', value: series.country || 'Tidak Tersedia' },
            { label: 'Episodes', value: series.episodeCount || 'Tidak Tersedia' },
            { label: 'Studio', value: series.studio || 'Tidak Tersedia' },
            { label: 'Status', value: series.status || 'Tidak Tersedia' },
          ]}
          controls={<ShareButton title={series.title} theme={theme} />}
          primaryAction={
            latestEpisodeHref ? (
              <Button variant={theme} size="lg" className="h-11 rounded-[var(--radius-lg)] px-5" asChild>
                <Link href={latestEpisodeHref}>
                  Start Episode
                  <Play className="ml-2 h-4 w-4 fill-current" />
                </Link>
              </Button>
            ) : null
          }
        />
      }
      sidebar={null}
      footer={<CommunityCTA mediaId={`nsfw:${slug}`} title={series.title} type="series" theme={theme} />}
    >
      <section id="overview" className="space-y-8">
        <DetailSectionHeading title="Overview" theme={theme} />
        <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
          <details className="group">
            <summary className="list-none cursor-pointer space-y-3">
              <p className="line-clamp-2 text-sm leading-7 text-zinc-400 transition-colors group-open:hidden md:text-base">
                {series.synopsis}
              </p>
              <span className="inline-flex text-sm font-semibold text-white/80 transition-colors hover:text-white group-open:hidden">
                Baca selengkapnya
              </span>
              <span className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white group-open:inline-flex">
                Tutup ringkasan
              </span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-zinc-400 md:text-base">{series.synopsis}</p>
          </details>
        </Paper>
      </section>

      {trailerEmbedUrl ? (
        <section id="trailer" className="space-y-8">
          <DetailSectionHeading title="Trailer" theme={theme} />
          <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
            <div className="aspect-video w-full bg-black">
              <iframe
                src={trailerEmbedUrl}
                title={`${series.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </Paper>
        </section>
      ) : null}

      <section id="episodes" className="space-y-8">
        <DetailSectionHeading
          title="Episodes"
          theme={theme}
          aside={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{series.episodes.length} Tersedia</Badge>
              <Badge variant="outline">Halaman {currentPage} / {totalPages}</Badge>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={episodeSort === 'latest' ? theme : 'outline'} size="sm" asChild>
            <Link href={buildEpisodeQueryHref(slug, 1, 'latest')}>Terbaru</Link>
          </Button>
          <Button variant={episodeSort === 'az' ? theme : 'outline'} size="sm" asChild>
            <Link href={buildEpisodeQueryHref(slug, 1, 'az')}>A-Z</Link>
          </Button>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleEpisodes.map((episode) => (
            <Button
              key={episode.slug}
              variant="outline"
              className="h-full min-h-24 w-full justify-start rounded-[var(--radius-md)] border-border-subtle bg-surface-1 px-4 py-4 text-left hover:bg-surface-elevated"
              asChild
            >
              <Link href={getNsfwSeriesWatchHref(episode.slug)} className="flex h-full flex-col items-start justify-between gap-3">
                <span className="line-clamp-2 text-sm font-semibold text-white">{episode.title || episode.label}</span>
                <span className="text-xs text-zinc-400">{episode.label}</span>
              </Link>
            </Button>
          ))}
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Showing {pageStart + 1}-{Math.min(pageStart + visibleEpisodes.length, sortedEpisodes.length)} of {sortedEpisodes.length} episodes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!previousPageHref} asChild={Boolean(previousPageHref)}>
                {previousPageHref ? <Link href={previousPageHref}>Previous</Link> : <span>Previous</span>}
              </Button>
              <Button variant="outline" size="sm" disabled={!nextPageHref} asChild={Boolean(nextPageHref)}>
                {nextPageHref ? <Link href={nextPageHref}>Next</Link> : <span>Next</span>}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {series.recommendations.length > 0 ? (
        <section id="related" className="space-y-8">
          <DetailSectionHeading
            title="More Like This"
            theme={theme}
            aside={<Badge variant="outline">{series.recommendations.length} Judul Menantimu</Badge>}
          />
          <CardRail variant="default">
            {series.recommendations.map((item) => (
              <MediaCard
                key={item.slug}
                href={getNsfwSeriesDetailHref(item.slug)}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText={getSeriesBadgeText(item.type)}
                theme={getSeriesTheme(item.type)}
              />
            ))}
          </CardRail>
        </section>
      ) : null}
    </HorizontalMediaDetailPage>
  );
}
