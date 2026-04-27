import { getComicJikanEnrichment } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-jikan', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const { slug } = await context.params;
  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const payload = await getComicJikanEnrichment(slug, { includeNsfw }).catch(() => null);

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
