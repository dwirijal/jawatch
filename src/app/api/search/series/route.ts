import { searchSeriesCatalog } from '@/lib/adapters/series';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildPrivateCacheControl, buildPublicCacheHeaders } from '@/platform/cache/http/cache-headers';
import { requestHasSupabaseAuthCookie } from '@/lib/auth/supabase-auth-cookie';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

const PUBLIC_SEARCH_CACHE_TTL_SECONDS = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const limitParam = Number.parseInt(searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 8;
  const authenticatedViewerRequest = requestHasSupabaseAuthCookie(request) || Boolean(request.headers.get('authorization'));
  const responseHeaders = authenticatedViewerRequest
    ? buildPrivateCacheControl()
    : buildPublicCacheHeaders(PUBLIC_SEARCH_CACHE_TTL_SECONDS);
  if (query.length < 2) {
    return Response.json([], {
      headers: responseHeaders,
    });
  }

  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-series', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const includeNsfw = authenticatedViewerRequest ? await resolveViewerNsfwAccess() : false;
  const results = await searchSeriesCatalog(query, limit, {
    includeNsfw,
  }).catch(() => []);

  return Response.json(results, {
    headers: responseHeaders,
  });
}
