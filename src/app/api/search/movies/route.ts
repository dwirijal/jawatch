import { searchMovieCatalog } from '@/lib/adapters/movie';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildPrivateCacheControl, buildPublicCacheHeaders } from '@/platform/cache/http/cache-headers';
import { requestHasSupabaseAuthCookie } from '@/lib/auth/supabase-auth-cookie';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

const PUBLIC_SEARCH_CACHE_TTL_SECONDS = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const limitParam = Number.parseInt(searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 8;
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

  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-movies', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const includeNsfw = trustedOriginRequest
    ? await resolveComicRouteIncludeNsfw(request)
    : authenticatedViewerRequest
      ? await resolveViewerNsfwAccess()
      : false;
  const results = await searchMovieCatalog(query, limit, {
    includeNsfw,
  }).catch(() => []);
  return Response.json(results, {
    headers: responseHeaders,
  });
}
