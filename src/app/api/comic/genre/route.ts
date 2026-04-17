import { getMangaByGenre } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-genre', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const genre = (searchParams.get('genre') || '').trim().slice(0, 64);
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 24;
  if (!genre) {
    return Response.json({ comics: [] }, {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const payload = await getMangaByGenre(genre, page, limit, { includeNsfw }).catch(() => ({ comics: [] }));

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
