import { searchMovieCatalog } from '@/lib/adapters/movie';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-movies', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const limitParam = Number.parseInt(searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 8;
  if (query.length < 2) {
    return Response.json([], {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = request.headers.get('x-comic-origin-token')
    ? await resolveComicRouteIncludeNsfw(request)
    : await resolveViewerNsfwAccess();
  const results = await searchMovieCatalog(query, limit, {
    includeNsfw,
  }).catch(() => []);
  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
