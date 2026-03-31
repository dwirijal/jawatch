import MoviesPageClient from './MoviesPageClient';
import { getMovieHubData } from '@/lib/adapters/movie';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export default async function MoviesPage() {
  const session = await getServerAuthStatus();
  const { popular, latest } = await getMovieHubData(24, {
    includeNsfw: session.authenticated,
  }).catch(() => ({
    popular: [],
    latest: [],
  }));

  return <MoviesPageClient initialPopular={popular} initialLatest={latest} />;
}
