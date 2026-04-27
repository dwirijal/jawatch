import { getOngoingManga } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import { resolvePublicApiRequestContext } from '@/lib/server/public-api-cache';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

const PUBLIC_CACHE_TTL_SECONDS = 180;

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-ongoing', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 24;
  if (!Number.isFinite(limit) || limit < 1) {
    return Response.json({ comics: [] }, {
      headers: buildPrivateCacheControl(),
    });
  }

  const { includeNsfw, responseHeaders } = await resolvePublicApiRequestContext(request, PUBLIC_CACHE_TTL_SECONDS);
  const payload = await getOngoingManga(limit, { includeNsfw }).catch(() => ({ comics: [] }));

  return Response.json(payload, {
    headers: responseHeaders,
  });
}
