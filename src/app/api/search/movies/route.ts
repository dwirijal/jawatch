import { searchMovieCatalog } from '@/lib/adapters/movie';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const limitParam = Number.parseInt(searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 8;

  if (query.length < 2) {
    return Response.json([]);
  }

  const results = await searchMovieCatalog(query, limit).catch(() => []);
  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(300, 1800),
    },
  });
}
