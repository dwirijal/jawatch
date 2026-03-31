import { searchSeriesCatalog } from '@/lib/adapters/series';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-search-series', limit: 120, windowSeconds: 60 }))) {
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

  const results = await searchSeriesCatalog(query, limit, {
    includeNsfw: false,
  }).catch(() => []);

  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
