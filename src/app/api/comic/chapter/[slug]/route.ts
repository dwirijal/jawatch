import { getMangaChapter } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-chapter', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  const session = await getServerAuthStatus(request);

  try {
    const payload = await getMangaChapter(slug, {
      includeNsfw: session.authenticated,
    });
    return Response.json(payload, {
      headers: buildPrivateCacheControl(),
    });
  } catch {
    return Response.json({ message: 'Chapter not found' }, {
      status: 404,
      headers: buildPrivateCacheControl(),
    });
  }
}
