import { searchManga } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-comic', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;
  if (query.length < 2) {
    return Response.json([], {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const results = await searchManga(query, Number.isFinite(page) ? page : 1, limit, {
    includeNsfw,
  })
    .then((response) => response.data || []);

  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
