import { getMovieDetailBySlug } from '@/lib/adapters/movie';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolvePublicApiRequestContext } from '@/lib/server/public-api-cache';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

const PUBLIC_CACHE_TTL_SECONDS = 300;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-movies-detail', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const { slug } = await context.params;
  const { includeNsfw, responseHeaders } = await resolvePublicApiRequestContext(request, PUBLIC_CACHE_TTL_SECONDS);
  const payload = await getMovieDetailBySlug(slug, {
    includeNsfw,
  });

  if (!payload) {
    return Response.json({ message: 'Movie not found' }, {
      status: 404,
      headers: buildPrivateCacheControl(),
    });
  }

  return Response.json(payload, {
    headers: responseHeaders,
  });
}
