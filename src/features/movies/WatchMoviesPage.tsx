import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import MoviesPageClient from './MoviesPageClient';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { loadMoviePageData } from './server/loadMoviePageData';

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
      title: `Nonton Film ${activeGenre} Subtitle Indonesia`,
      description: `Jelajahi film ${activeGenre} subtitle Indonesia dari rak nonton.`,
      path: `/watch/movies?genre=${encodeURIComponent(activeGenre)}`,
    });
  }

  return buildMetadata({
    title: 'Nonton Film Subtitle Indonesia',
    description: 'Temukan film subtitle Indonesia dari rak nonton jawatch.',
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
          title: activeGenre ? `Nonton Film ${activeGenre} Subtitle Indonesia` : 'Nonton Film Subtitle Indonesia',
          description: activeGenre
            ? `Katalog film ${activeGenre} subtitle Indonesia dari rak nonton.`
            : 'Katalog film subtitle Indonesia dari rak nonton.',
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
