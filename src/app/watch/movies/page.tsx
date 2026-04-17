import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import MoviesPageClient from '@/app/movies/MoviesPageClient';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { loadMoviePageData } from '@/app/movies/movie-page-data';

type MoviesPageProps = {
  searchParams: Promise<{
    genre?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: MoviesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const activeGenre = (params.genre || '').trim().slice(0, 64);

  if (activeGenre) {
    return buildMetadata({
      title: `Watch Movies ${activeGenre} Subtitle Indonesia`,
      description: `Browse film ${activeGenre} subtitle Indonesia from the watch hub.`,
      path: `/watch/movies?genre=${encodeURIComponent(activeGenre)}`,
    });
  }

  return buildMetadata({
    title: 'Watch Movies Subtitle Indonesia',
    description: 'Temukan film subtitle Indonesia dari hub watch yang baru.',
    path: '/watch/movies',
    keywords: ['watch movies subtitle indonesia', 'film subtitle indonesia', 'streaming film'],
  });
}

export const dynamic = 'force-dynamic';

export default async function WatchMoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const activeGenre = (params.genre || '').trim().slice(0, 64) || null;
  const activeSort = (params.sort || '').trim().slice(0, 24) || null;
  const includeNsfw = await resolveViewerNsfwAccess();
  const { popular, latest, initialResults } = await loadMoviePageData({
    activeGenre,
    limit: 24,
    includeNsfw,
  });

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: activeGenre ? `Watch Movies ${activeGenre} Subtitle Indonesia` : 'Watch Movies Subtitle Indonesia',
          description: activeGenre
            ? `Katalog film ${activeGenre} subtitle Indonesia dari hub watch.`
            : 'Katalog film subtitle Indonesia dari hub watch.',
          path: activeGenre ? `/watch/movies?genre=${encodeURIComponent(activeGenre)}` : '/watch/movies',
          items: (initialResults || popular).map((item) => ({
            name: item.title,
            url: `/movies/${item.slug}`,
            image: item.poster,
          })),
        })}
      />
      <MoviesPageClient
        initialPopular={popular}
        initialLatest={latest}
        initialResults={initialResults}
        activeGenre={activeGenre}
        activeSort={activeSort}
      />
    </>
  );
}
