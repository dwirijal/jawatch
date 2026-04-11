import { getSeriesFilteredItems } from '@/lib/adapters/series';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-series-filter', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { searchParams } = new URL(request.url);
  const value = (searchParams.get('value') || '').trim().slice(0, 64);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;
  if (!value) {
    return Response.json([], {
      headers: buildPrivateCacheControl(),
    });
  }

  const includeNsfw = await resolveViewerNsfwAccess();
  const results = await getSeriesFilteredItems(value, limit, {
    includeNsfw,
  }).catch(() => []);

  return Response.json(results, {
    headers: buildPrivateCacheControl(),
  });
}
