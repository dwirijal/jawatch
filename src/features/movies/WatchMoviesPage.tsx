import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JsonLd } from '@/components/atoms/JsonLd';
import MoviesPageClient, { MoviesPageClientFromSearchParams } from './MoviesPageClient';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { loadMoviePageData } from './server/loadMoviePageData';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Film Subtitle Indonesia',
  description: 'Temukan film subtitle Indonesia dari rak nonton jawatch.',
  path: '/watch/movies',
  keywords: ['watch movies subtitle indonesia', 'film subtitle indonesia', 'streaming film'],
});

export default async function WatchMoviesPage() {
  const { popular, latest, initialResults } = await loadMoviePageData({
    activeGenre: null,
    limit: 24,
    includeNsfw: false,
  });

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Nonton Film Subtitle Indonesia',
          description: 'Katalog film subtitle Indonesia dari rak nonton.',
          path: '/watch/movies',
          items: (initialResults || popular).map((item) => ({
            name: item.title,
            url: `/movies/${item.slug}`,
            image: item.poster,
          })),
        })}
      />
      <Suspense
        fallback={(
          <MoviesPageClient
            initialPopular={popular}
            initialLatest={latest}
            initialResults={initialResults}
          />
        )}
      >
        <MoviesPageClientFromSearchParams
          initialPopular={popular}
          initialLatest={latest}
          initialResults={initialResults}
        />
      </Suspense>
    </>
  );
}
