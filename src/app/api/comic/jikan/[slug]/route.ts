import { getComicJikanEnrichment } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-jikan', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const payload = await getComicJikanEnrichment(slug, { includeNsfw }).catch(() => null);

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
