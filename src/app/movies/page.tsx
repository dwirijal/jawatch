import type { Metadata } from 'next';
import { JsonLd } from '@/components/atoms/JsonLd';
import MoviesPageClient from './MoviesPageClient';
import { getMovieGenreItems, getMovieHubData } from '@/lib/adapters/movie';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

type MoviesPageProps = {
  searchParams: Promise<{
    genre?: string;
  }>;
};

export async function generateMetadata({ searchParams }: MoviesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const activeGenre = (params.genre || '').trim().slice(0, 64);

  if (activeGenre) {
    return buildMetadata({
      title: `Film ${activeGenre} Subtitle Indonesia`,
      description: `Browse film ${activeGenre} subtitle Indonesia dengan katalog movie yang cepat dan ringan.`,
      path: `/movies?genre=${encodeURIComponent(activeGenre)}`,
    });
  }

  return buildMetadata({
    title: 'Film Subtitle Indonesia',
    description: 'Temukan film subtitle Indonesia dengan katalog movie yang cepat, ringan, dan siap diputar.',
    path: '/movies',
    keywords: ['film subtitle indonesia', 'streaming film', 'movie subtitle indonesia'],
  });
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const activeGenre = (params.genre || '').trim().slice(0, 64) || null;
  const includeNsfw = await resolveViewerNsfwAccess();
  const options = {
    includeNsfw,
  };
  const { popular, latest } = await getMovieHubData(24, options).catch(() => ({
    popular: [],
    latest: [],
  }));
  const initialResults = activeGenre
    ? await getMovieGenreItems(activeGenre, 24, options).catch(() => [])
    : null;

  return (
    <>
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: activeGenre ? `Film ${activeGenre} Subtitle Indonesia` : 'Film Subtitle Indonesia',
          description: activeGenre
            ? `Katalog film ${activeGenre} subtitle Indonesia.`
            : 'Katalog film subtitle Indonesia yang siap diputar.',
          path: activeGenre ? `/movies?genre=${encodeURIComponent(activeGenre)}` : '/movies',
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
      />
    </>
  );
}
