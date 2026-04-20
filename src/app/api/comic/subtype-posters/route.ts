import { getComicSubtypePosters } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolvePublicApiRequestContext } from '@/lib/server/public-api-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

const PUBLIC_CACHE_TTL_SECONDS = 300;

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-subtype-posters', limit: 120, windowSeconds: 60 }))) {
    return Response.json({}, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { includeNsfw, responseHeaders } = await resolvePublicApiRequestContext(request, PUBLIC_CACHE_TTL_SECONDS);
  const payload = await getComicSubtypePosters({ includeNsfw }).catch(() => ({}));

  return Response.json(payload, {
    headers: responseHeaders,
  });
}
