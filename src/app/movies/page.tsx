import MoviesPageClient from './MoviesPageClient';
import { getMovieGenreItems, getMovieHubData } from '@/lib/adapters/movie';

type MoviesPageProps = {
  searchParams: Promise<{
    genre?: string;
  }>;
};

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const activeGenre = (params.genre || '').trim().slice(0, 64) || null;
  const options = {
    includeNsfw: false,
  };
  const { popular, latest } = await getMovieHubData(24, options).catch(() => ({
    popular: [],
    latest: [],
  }));
  const initialResults = activeGenre
    ? await getMovieGenreItems(activeGenre, 24, options).catch(() => [])
    : null;

  return (
    <MoviesPageClient
      initialPopular={popular}
      initialLatest={latest}
      initialResults={initialResults}
      activeGenre={activeGenre}
    />
  );
}
