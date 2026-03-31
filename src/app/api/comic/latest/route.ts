import { getNewManga } from '@/lib/adapters/comic-server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';
import { getServerAuthStatus } from '@/lib/server/auth-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 40) : 24;
  const session = await getServerAuthStatus(request);

  const payload = await getNewManga(page, limit, { includeNsfw: session.authenticated }).catch(() => ({ comics: [] }));

  return Response.json(payload, {
    headers: {
      'Cache-Control': buildEdgeCacheControl(300, 1800),
    },
  });
}
