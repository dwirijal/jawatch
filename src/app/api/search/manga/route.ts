import { searchManga } from '@/lib/adapters/comic';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 24;

  if (query.length < 2) {
    return Response.json([]);
  }

  const results = await searchManga(query, Number.isFinite(page) ? page : 1)
    .then((response) => (response.data || []).slice(0, limit));

  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(300, 1800),
    },
  });
}
