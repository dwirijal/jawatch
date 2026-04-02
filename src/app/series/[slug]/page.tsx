import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { CommunityCTA } from '@/components/molecules/CommunityCTA';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { SeriesRecommendationsSection } from '@/components/organisms/SeriesRecommendationsSection';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { getSeriesDetailPageData } from './series-detail-data';
import { SeriesEpisodeSection } from './SeriesEpisodeSection';
import { buildMetadata, buildSeriesDetailJsonLd } from '@/lib/seo';
import { getSeriesTheme } from '@/lib/series-presentation';

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
  return query ? `/series/${slug}?${query}#episodes` : `/series/${slug}#episodes`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesDetailPageData(slug);

  if (!series) {
    return buildMetadata({
      title: 'Series Tidak Ditemukan',
      description: 'Series yang kamu cari tidak tersedia di katalog dwizzyWEEB.',
      path: `/series/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${series.title} Subtitle Indonesia`,
    description: `${series.synopsis} Tonton episode terbaru ${series.title}${series.country ? ` dari ${series.country}` : ''}${series.year ? ` rilis ${series.year}` : ''} di dwizzyWEEB.`,
    path: `/series/${series.slug}`,
    image: series.poster,
    keywords: [...series.genres, series.country, series.mediaType].filter(Boolean),
  });
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const series = await getSeriesDetailPageData(slug);

  if (!series) {
    notFound();
  }

  const theme = getSeriesTheme(series.mediaType);
  const latestEpisodeHref = series.episodes[0] ? `/series/watch/${series.episodes[0].slug}` : null;
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
    <>
      <JsonLd
        data={buildSeriesDetailJsonLd({
          title: series.title,
          slug: series.slug,
          poster: series.poster,
          description: series.synopsis,
          genres: series.genres,
          country: series.country,
          year: series.year,
        })}
      />
      <HorizontalMediaDetailPage
        theme={theme}
        showAdSection={false}
        hero={
          <VideoDetailHero
            theme={theme}
            backHref="/series"
            backLabel="Back to Series"
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
            controls={
              <DeferredHeroActions
                title={series.title}
                theme={theme}
                bookmarkItem={{
                  id: slug,
                  type: series.mediaType,
                  title: series.title,
                  image: series.poster,
                  timestamp: 0,
                }}
              />
            }
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
        footer={<CommunityCTA mediaId={slug} title={series.title} type="series" theme={theme} />}
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
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </Paper>
          </section>
        ) : null}

        <SeriesEpisodeSection
          theme={theme}
          episodeCount={series.episodes.length}
          currentPage={currentPage}
          totalPages={totalPages}
          episodeSort={episodeSort}
          episodes={visibleEpisodes.map((episode) => ({
            slug: episode.slug,
            title: episode.title || episode.label,
            label: episode.label,
          }))}
          pageStart={pageStart}
          totalCount={sortedEpisodes.length}
          latestSortHref={buildEpisodeQueryHref(slug, 1, 'latest')}
          azSortHref={buildEpisodeQueryHref(slug, 1, 'az')}
          previousPageHref={previousPageHref}
          nextPageHref={nextPageHref}
        />

        <Suspense fallback={null}>
          <SeriesRecommendationsSection
            currentSlug={series.slug}
            genres={series.genres}
            country={series.country}
            theme={theme}
          />
        </Suspense>
      </HorizontalMediaDetailPage>
    </>
  );
}
