import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { searchUnifiedTitles } from '@/lib/search/search-service';
import { normalizeSearchDomain } from '@/lib/search/search-contract';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-unified', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const type = normalizeSearchDomain(searchParams.get('type') || undefined);
  const limitParam = Number.parseInt(searchParams.get('limit') || '6', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 6;

  if (query.length < 2) {
    return Response.json({
      query,
      domain: type,
      source: 'empty',
      total: 0,
      topMatch: null,
      groups: [],
    }, {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = request.headers.get('x-comic-origin-token')
    ? await resolveComicRouteIncludeNsfw(request)
    : await resolveViewerNsfwAccess();

  const results = await searchUnifiedTitles(query, {
    domain: type,
    limit,
    includeNsfw,
  });

  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
