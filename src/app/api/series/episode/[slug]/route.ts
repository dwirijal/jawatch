import { getSeriesEpisodeBySlug } from '@/lib/adapters/series';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolvePublicApiRequestContext } from '@/lib/server/public-api-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

const PUBLIC_CACHE_TTL_SECONDS = 300;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-series-episode', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  const { includeNsfw, responseHeaders } = await resolvePublicApiRequestContext(request, PUBLIC_CACHE_TTL_SECONDS);
  const payload = await getSeriesEpisodeBySlug(slug, {
    includeNsfw,
  });

  if (!payload) {
    return Response.json({ message: 'Episode not found' }, {
      status: 404,
      headers: buildPrivateCacheControl(),
    });
  }

  return Response.json(payload, {
    headers: responseHeaders,
  });
}
