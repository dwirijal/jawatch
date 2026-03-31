import { getMangaDetail } from '@/lib/adapters/comic-server';
import { buildEdgeCacheControl } from '@/lib/cloudflare-cache';
import { getServerAuthStatus } from '@/lib/server/auth-session';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const session = await getServerAuthStatus(request);

  try {
    const payload = await getMangaDetail(slug, {
      includeNsfw: session.authenticated,
      recordAccess: true,
    });
    return Response.json(payload, {
      headers: {
        'Cache-Control': buildEdgeCacheControl(300, 1800),
      },
    });
  } catch {
    return Response.json({ message: 'Comic not found' }, { status: 404 });
  }
}
