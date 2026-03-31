import { getPopularManga } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-popular', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 24;
  if (!Number.isFinite(limit) || limit < 1) {
    return Response.json({ comics: [] }, {
      headers: buildPrivateCacheControl(),
    });
  }

  const payload = await getPopularManga(limit, { includeNsfw: false }).catch(() => ({ comics: [] }));

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
