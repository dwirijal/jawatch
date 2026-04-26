import { getMangaDetail } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolveComicRouteRecordAccess } from '@/lib/server/comic-route-access';
import { resolvePublicApiRequestContext } from '@/lib/server/public-api-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

const PUBLIC_CACHE_TTL_SECONDS = 300;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-title', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  try {
    const { includeNsfw, responseHeaders } = await resolvePublicApiRequestContext(request, PUBLIC_CACHE_TTL_SECONDS);
    const payload = await getMangaDetail(slug, {
      includeNsfw,
      recordAccess: resolveComicRouteRecordAccess(request),
    });
    return Response.json(payload, {
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ message: 'Comic not found' }, {
      status: 404,
      headers: buildPrivateCacheControl(),
    });
  }
}
