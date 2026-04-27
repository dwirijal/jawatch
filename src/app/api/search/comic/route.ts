import { searchManga } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl, buildPublicCacheHeaders } from '@/platform/cache/http/cache-headers';
import { requestHasSupabaseAuthCookie } from '@/lib/auth/supabase-auth-cookie';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

const PUBLIC_SEARCH_CACHE_TTL_SECONDS = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;
  const trustedOriginRequest = Boolean(request.headers.get('x-comic-origin-token'));
  const authenticatedViewerRequest = requestHasSupabaseAuthCookie(request) || Boolean(request.headers.get('authorization'));
  const responseHeaders = trustedOriginRequest || authenticatedViewerRequest
    ? buildPrivateCacheControl()
    : buildPublicCacheHeaders(PUBLIC_SEARCH_CACHE_TTL_SECONDS);
  if (query.length < 2) {
    return Response.json([], {
      headers: responseHeaders,
    });
  }

  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-comic', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const includeNsfw = trustedOriginRequest || authenticatedViewerRequest
    ? await resolveComicRouteIncludeNsfw(request)
    : false;
  const results = await searchManga(query, Number.isFinite(page) ? page : 1, limit, {
    includeNsfw,
  })
    .then((response) => response.data || []);

  return Response.json(results, {
    headers: responseHeaders,
  });
}
