import { getMovieGenreItems } from '@/lib/adapters/movie';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-movies-genre', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const genre = (searchParams.get('genre') || '').trim().slice(0, 64);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;
  if (!genre) {
    return Response.json([], {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const results = await getMovieGenreItems(genre, limit, {
    includeNsfw,
  }).catch(() => []);
  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
