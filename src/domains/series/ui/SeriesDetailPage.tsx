import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs';
import { TitleCommunityPanel } from '@/components/organisms/CommunityPanel';
import { DeferredHeroActions } from '@/components/organisms/DeferredHeroActions';
import { HorizontalMediaDetailPage } from '@/components/organisms/HorizontalMediaDetailPage';
import { LazyTrailerEmbed } from '@/components/organisms/LazyTrailerEmbed';
import { SeriesRecommendationsSection } from '@/components/organisms/SeriesRecommendationsSection';
import { VideoDetailHero } from '@/components/organisms/VideoDetailHero';
import { getSeriesDetailPageData } from '@/domains/series/server/series-detail-data';
import { SeriesEpisodeSection } from '@/domains/series/ui/SeriesEpisodeSection';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildMetadata, buildSeriesDetailJsonLd } from '@/lib/seo';
import {
  formatSeriesDetailEpisodeCount,
  formatSeriesDetailRating,
  formatSeriesDetailText,
} from '@/lib/series-detail-presentation';
import { getSeriesTheme } from '@/lib/series-presentation';
import { resolveSeriesCanonicalRedirect } from '@/lib/adapters/series-canonical-utils';
import { searchSeriesCatalog } from '@/lib/adapters/series-browse';
import {
  buildSeriesAliasSearchQueries,
  pickPreferredSeriesRouteCandidate,
  resolveKnownSeriesRouteAlias,
} from '@/lib/adapters/series-route-alias';
import { isReservedSeriesSlug } from '@/lib/canonical-route-guards';
import { resolveMediaBackgroundUrl } from '@/lib/utils';

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

async function resolveSeriesDetailAliasSlug(requestedSlug: string, includeNsfw: boolean): Promise<string | null> {
  const knownAlias = resolveKnownSeriesRouteAlias(requestedSlug);
  if (knownAlias && knownAlias !== requestedSlug) {
    return knownAlias;
  }

  const queries = buildSeriesAliasSearchQueries(requestedSlug);
  if (queries.length === 0) {
    return null;
  }

  const candidateMap = new Map<string, { slug: string; title: string }>();
  for (const query of queries) {
    const results = await searchSeriesCatalog(query, 12, { includeNsfw });
    for (const item of results) {
      if (!candidateMap.has(item.slug)) {
        candidateMap.set(item.slug, { slug: item.slug, title: item.title });
      }
    }
  }

  const preferred = pickPreferredSeriesRouteCandidate(requestedSlug, [...candidateMap.values()]);

  return preferred && preferred.slug !== requestedSlug ? preferred.slug : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedSeriesSlug(slug)) {
    return buildMetadata({
      title: 'Series Tidak Ditemukan',
      description: 'Series yang kamu cari tidak tersedia di katalog jawatch.',
      path: `/series/${slug}`,
      noIndex: true,
    });
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const series = await getSeriesDetailPageData(slug, { includeNsfw });

  if (!series) {
    return buildMetadata({
      title: 'Series Tidak Ditemukan',
      description: 'Series yang kamu cari tidak tersedia di katalog jawatch.',
      path: `/series/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${series.title} Subtitle Indonesia`,
    description: `${series.synopsis} Tonton episode terbaru ${series.title}${series.country ? ` dari ${series.country}` : ''}${series.year ? ` rilis ${series.year}` : ''} di jawatch.`,
    path: `/series/${series.slug}`,
    image: series.poster,
    keywords: [...series.genres, series.country, series.mediaType].filter(Boolean),
  });
}

export default async function SeriesDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (isReservedSeriesSlug(slug)) {
    notFound();
  }

  const knownAlias = resolveKnownSeriesRouteAlias(slug);
  if (knownAlias && knownAlias !== slug) {
    permanentRedirect(`/series/${knownAlias}`);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const includeNsfw = await resolveViewerNsfwAccess();
  const series = await getSeriesDetailPageData(slug, { includeNsfw });

  if (!series) {
    const redirectSlug = await resolveSeriesDetailAliasSlug(slug, includeNsfw);
    if (redirectSlug) {
      permanentRedirect(`/series/${redirectSlug}`);
    }

    notFound();
  }

  const redirectPath = resolveSeriesCanonicalRedirect('/series', slug, series);
  if (redirectPath) {
    redirect(redirectPath);
  }

  const theme = getSeriesTheme(series.mediaType);
  const seriesCast = series.cast ?? [];
  const productionTeam = series.productionTeam ?? [];
  const latestEpisodeHref = series.episodes[0]?.href ?? null;
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
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Beranda', href: '/' },
              { label: 'Nonton', href: '/watch' },
              { label: 'Series', href: '/watch/series' },
              { label: series.title },
            ]}
          />
        }
        hero={
          <VideoDetailHero
            theme={theme}
            backHref="/watch/series"
            backLabel="Kembali ke series"
            poster={series.poster}
            backgroundImage={resolveMediaBackgroundUrl(series.background, series.backdrop, series.poster)}
            logoSrc={series.logo}
            logoAlt={series.title}
            title={series.title}
            eyebrow={series.seasonLabel}
            badges={series.genres.slice(0, 5)}
            metadata={[
              { label: 'Rating', value: formatSeriesDetailRating(series.rating) },
              { label: 'Tahun', value: formatSeriesDetailText(series.year) },
              { label: 'Negara', value: formatSeriesDetailText(series.country) },
              { label: 'Episode', value: formatSeriesDetailEpisodeCount(series.episodeCount) },
              { label: 'Studio', value: formatSeriesDetailText(series.studio) },
              { label: 'Status', value: formatSeriesDetailText(series.status) },
            ]}
            controls={
              <DeferredHeroActions
                title={series.title}
                mediaType={series.mediaType}
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
                    Mulai episode
                    <Play className="ml-2 h-4 w-4 fill-current" />
                  </Link>
                </Button>
              ) : null
            }
          />
        }
        sidebar={null}
      >
        <section id="overview" className="space-y-8">
        <DetailSectionHeading title="Ringkasan" theme={theme} />
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

        {seriesCast.length > 0 ? (
          <section id="cast" className="space-y-8">
          <DetailSectionHeading
            title={series.mediaType === 'anime' ? 'Pemain & Seiyuu' : 'Pemain'}
            theme={theme}
            aside={<Badge variant="outline">{seriesCast.length} orang</Badge>}
          />
          <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {seriesCast.map((person) => (
                <div
                  key={`${person.name}-${person.role || ''}-${person.voice || ''}`}
                  className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-white">{person.name}</p>
                  {person.role ? <p className="mt-1 text-xs text-zinc-400">{person.role}</p> : null}
                  {person.voice ? <p className="mt-1 text-xs text-zinc-500">Seiyuu: {person.voice}</p> : null}
                </div>
              ))}
            </div>
          </Paper>
          </section>
        ) : null}

        {productionTeam.length > 0 || series.studio || series.director ? (
          <section id="production" className="space-y-8">
          <DetailSectionHeading title="Produksi" theme={theme} />
          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {series.studio ? (
                <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Studio</p>
                  <p className="mt-2 text-sm font-semibold text-white">{series.studio}</p>
                </div>
              ) : null}
              {series.director ? (
                <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sutradara</p>
                  <p className="mt-2 text-sm font-semibold text-white">{series.director}</p>
                </div>
              ) : null}
            </div>

            {productionTeam.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {productionTeam.map((entry) => (
                  <Badge key={entry} variant="outline">{entry}</Badge>
                ))}
              </div>
            ) : null}
          </Paper>
          </section>
        ) : null}

        {trailerEmbedUrl ? (
          <section id="trailer" className="space-y-8">
          <DetailSectionHeading title="Trailer" theme={theme} />
          <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
            <LazyTrailerEmbed embedUrl={trailerEmbedUrl} title={series.title} />
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
            href: episode.href,
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

        <section id="community" className="space-y-8">
          <DetailSectionHeading title="Komentar" theme={theme} />
          <TitleCommunityPanel
            titleId={`series:${series.slug}`}
            titleLabel={series.title}
            titleHref={`/series/${series.slug}`}
            theme={theme}
            units={series.episodes.map((episode) => ({
              id: `episode:${episode.slug}`,
              label: episode.title || episode.label,
              href: episode.href,
            }))}
          />
        </section>

        <Suspense fallback={null}>
          <SeriesRecommendationsSection
            currentSlug={series.slug}
            currentTitle={series.title}
            mediaType={series.mediaType}
            genres={series.genres}
            country={series.country}
            theme={theme}
          />
        </Suspense>
      </HorizontalMediaDetailPage>
    </>
  );
}
