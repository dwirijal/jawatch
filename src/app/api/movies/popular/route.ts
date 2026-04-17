import { getMovieHomeSection } from '@/lib/adapters/movie';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-movies-popular', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 24;
  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const results = await getMovieHomeSection('popular', limit, {
    includeNsfw,
  }).catch(() => []);

  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
