import { getMovieGenreItems } from '@/lib/adapters/movie';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = (searchParams.get('genre') || '').trim().slice(0, 64);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;
  const session = await getServerAuthStatus(request);

  if (!genre) {
    return Response.json([]);
  }

  const results = await getMovieGenreItems(genre, limit, {
    includeNsfw: session.authenticated,
  }).catch(() => []);
  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(900, 3600),
    },
  });
}
