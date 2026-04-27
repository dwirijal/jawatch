import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import { buildPrivateCacheControl, buildPublicCacheHeaders } from '@/platform/cache/http/cache-headers';
import { requestHasSupabaseAuthCookie } from '@/lib/auth/supabase-auth-cookie';
import { searchUnifiedTitles } from '@/domains/search/server/search-service';
import { normalizeSearchDomain } from '@/domains/search/contracts/search-contract';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit, buildApiRateLimitResponse } from '@/lib/server/request-rate-limit';

const PUBLIC_SEARCH_CACHE_TTL_SECONDS = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const type = normalizeSearchDomain(searchParams.get('type') || undefined);
  const limitParam = Number.parseInt(searchParams.get('limit') || '6', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 6;
  const trustedOriginRequest = Boolean(request.headers.get('x-comic-origin-token'));
  const authenticatedViewerRequest = requestHasSupabaseAuthCookie(request) || Boolean(request.headers.get('authorization'));
  const responseHeaders = trustedOriginRequest || authenticatedViewerRequest
    ? buildPrivateCacheControl()
    : buildPublicCacheHeaders(PUBLIC_SEARCH_CACHE_TTL_SECONDS);
  const withSearchDiagnostics = (source: string, durationMs: number) => {
    const headers = new Headers(responseHeaders);
    headers.set('x-jawatch-search-source', source);
    headers.set('x-jawatch-search-domain', type);
    headers.set('Server-Timing', `search;dur=${durationMs}, search-source;desc="${source}"`);
    return headers;
  };

  if (query.length < 2) {
    return Response.json({
      query,
      domain: type,
      source: 'empty',
      total: 0,
      topMatch: null,
      groups: [],
    }, {
      headers: withSearchDiagnostics('empty', 0),
    });
  }

  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-unified', limit: 120, windowSeconds: 60 }))) {
    return buildApiRateLimitResponse();
  }

  const includeNsfw = trustedOriginRequest
    ? await resolveComicRouteIncludeNsfw(request)
    : authenticatedViewerRequest
      ? await resolveViewerNsfwAccess()
      : false;

  const startedAt = performance.now();
  const results = await searchUnifiedTitles(query, {
    domain: type,
    limit,
    includeNsfw,
  });
  const durationMs = Math.round(performance.now() - startedAt);

  return Response.json(results, {
    headers: withSearchDiagnostics(results.source, durationMs),
  });
}
