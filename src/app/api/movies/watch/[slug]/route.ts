import { getMovieWatchBySlug } from '@/lib/adapters/movie';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-movies-watch', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const payload = await getMovieWatchBySlug(slug, {
    includeNsfw,
  });

  if (!payload) {
    return Response.json({ message: 'Movie not found' }, {
      status: 404,
      headers: buildPrivateCacheControl(),
    });
  }

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
