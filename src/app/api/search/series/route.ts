import { searchSeriesCatalog } from '@/lib/adapters/series';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim().slice(0, 120);
  const limitParam = Number.parseInt(searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 24) : 8;
  const session = await getServerAuthStatus(request);

  if (query.length < 2) {
    return Response.json([]);
  }

  const results = await searchSeriesCatalog(query, limit, {
    includeNsfw: session.authenticated,
  }).catch(() => []);

  return Response.json(results, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(300, 1800),
    },
  });
}
