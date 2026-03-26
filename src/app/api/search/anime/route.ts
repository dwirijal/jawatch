import { searchAnimeCatalog } from '@/lib/anime-source';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const limitParam = Number.parseInt(searchParams.get('limit') || '5', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 5;

  if (query.length < 2) {
    return Response.json([]);
  }

  const results = await searchAnimeCatalog(query, limit);

  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(300, 1800),
    },
  });
}
