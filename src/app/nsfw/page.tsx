import { redirect } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { SectionCard } from '@/components/organisms/SectionCard';
import { StateInfo } from '@/components/molecules/StateInfo';
import { getNsfwComicPage } from '@/lib/adapters/comic-server';
import { getNsfwMoviePage } from '@/lib/adapters/movie';
import { getNsfwSeriesPage } from '@/lib/adapters/series';
import { buildLoginUrl } from '@/lib/auth-gateway';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import { getSeriesBadgeText, getSeriesTheme, formatSeriesCardSubtitle } from '@/lib/series-presentation';

export const metadata = {
  title: 'NSFW',
  robots: {
    index: false,
    follow: false,
  },
};

const ITEMS_PER_PAGE = 24;

type NsfwPageProps = {
  searchParams?: Promise<{
    seriesPage?: string;
    moviesPage?: string;
    comicsPage?: string;
  }>;
};

function normalizePage(value?: string): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildNsfwHref(
  pages: { seriesPage: number; moviesPage: number; comicsPage: number },
  key: 'seriesPage' | 'moviesPage' | 'comicsPage',
  nextPage: number,
  anchor: string,
): string {
  const params = new URLSearchParams();
  const nextPages = { ...pages, [key]: nextPage };

  if (nextPages.seriesPage > 1) {
    params.set('seriesPage', String(nextPages.seriesPage));
  }
  if (nextPages.moviesPage > 1) {
    params.set('moviesPage', String(nextPages.moviesPage));
  }
  if (nextPages.comicsPage > 1) {
    params.set('comicsPage', String(nextPages.comicsPage));
  }

  const query = params.toString();
  return query ? `/nsfw?${query}#${anchor}` : `/nsfw#${anchor}`;
}

function PaginationRow({
  currentPage,
  hasNext,
  hrefBuilder,
}: {
  currentPage: number;
  hasNext: boolean;
  hrefBuilder: (page: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Page {currentPage}</p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={hrefBuilder(currentPage - 1)}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {hasNext ? (
          <Button variant="drama" size="sm" asChild>
            <Link href={hrefBuilder(currentPage + 1)}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

export default async function NsfwPage({ searchParams }: NsfwPageProps) {
  const session = await getServerAuthStatus();
  if (!session.authenticated) {
    redirect(buildLoginUrl('/nsfw'));
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pages = {
    seriesPage: normalizePage(resolvedSearchParams?.seriesPage),
    moviesPage: normalizePage(resolvedSearchParams?.moviesPage),
    comicsPage: normalizePage(resolvedSearchParams?.comicsPage),
  };

  const [seriesResult, movieResult, comicResult] = await Promise.all([
    getNsfwSeriesPage(pages.seriesPage, ITEMS_PER_PAGE).catch(() => ({ items: [], hasNext: false })),
    getNsfwMoviePage(pages.moviesPage, ITEMS_PER_PAGE).catch(() => ({ items: [], hasNext: false })),
    getNsfwComicPage(pages.comicsPage, ITEMS_PER_PAGE).catch(() => ({ items: [], hasNext: false })),
  ]);

  return (
    <div className="app-shell" data-theme="drama">
      <MediaHubHeader
        title="NSFW"
        description="Adult-tagged titles from the unified catalog. Visible only inside this gated NSFW surface when you are signed in."
        iconName="BadgeAlert"
        theme="drama"
        containerClassName="app-container-wide"
      />

      <main className="app-container-wide mt-8 space-y-10 pb-12">
        <div id="series" className="space-y-4">
          <SectionCard
            title="Series"
            subtitle="Adult-tagged episodic titles across anime, donghua, and drama."
            iconName="Clapperboard"
            mode="grid"
            gridDensity="default"
          >
            {seriesResult.items.length > 0 ? seriesResult.items.map((item) => (
              <MediaCard
                key={item.slug}
                image={item.poster}
                title={item.title}
                subtitle={formatSeriesCardSubtitle(item)}
                badgeText={getSeriesBadgeText(item.type)}
                theme={getSeriesTheme(item.type)}
              />
            )) : (
              <StateInfo title="No adult series yet" description="No NSFW-tagged series are currently available." />
            )}
          </SectionCard>
          {seriesResult.items.length > 0 ? (
            <PaginationRow
              currentPage={pages.seriesPage}
              hasNext={seriesResult.hasNext}
              hrefBuilder={(page) => buildNsfwHref(pages, 'seriesPage', page, 'series')}
            />
          ) : null}
        </div>

        <div id="movies" className="space-y-4">
          <SectionCard
            title="Movies"
            subtitle="Adult-tagged movie titles from the canonical movie catalog."
            iconName="Film"
            mode="grid"
            gridDensity="default"
          >
            {movieResult.items.length > 0 ? movieResult.items.map((item) => (
              <MediaCard
                key={item.slug}
                image={item.poster}
                title={item.title}
                subtitle={item.year}
                badgeText={item.rating ? `★ ${item.rating}` : 'MOVIE'}
                theme="movie"
              />
            )) : (
              <StateInfo title="No adult movies yet" description="No NSFW-tagged movies are currently available." />
            )}
          </SectionCard>
          {movieResult.items.length > 0 ? (
            <PaginationRow
              currentPage={pages.moviesPage}
              hasNext={movieResult.hasNext}
              hrefBuilder={(page) => buildNsfwHref(pages, 'moviesPage', page, 'movies')}
            />
          ) : null}
        </div>

        <div id="comics" className="space-y-4">
          <SectionCard
            title="Comics"
            subtitle="Adult-tagged manga, manhwa, and manhua from the comic library."
            iconName="BookOpen"
            mode="grid"
            gridDensity="default"
          >
            {comicResult.items.length > 0 ? comicResult.items.map((item) => (
              <MediaCard
                key={item.slug}
                image={item.thumbnail || item.image}
                title={item.title}
                subtitle={item.chapter || item.time_ago || undefined}
                badgeText={item.type || 'Comic'}
                theme="manga"
              />
            )) : (
              <StateInfo title="No adult comics yet" description="No NSFW-tagged comics are currently available." />
            )}
          </SectionCard>
          {comicResult.items.length > 0 ? (
            <PaginationRow
              currentPage={pages.comicsPage}
              hasNext={comicResult.hasNext}
              hrefBuilder={(page) => buildNsfwHref(pages, 'comicsPage', page, 'comics')}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
