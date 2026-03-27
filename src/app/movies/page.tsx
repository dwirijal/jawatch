import MoviesPageClient from './MoviesPageClient';
import { getMovieHubData } from '@/lib/adapters/movie';

export default async function MoviesPage() {
  const { popular, latest } = await getMovieHubData(24).catch(() => ({
    popular: [],
    latest: [],
  }));

  return <MoviesPageClient initialPopular={popular} initialLatest={latest} />;
}
