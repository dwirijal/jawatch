import { getMangaChapter } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/platform/cache/http/cache-headers';
import {
  resolveComicRouteIncludeNsfw,
  resolveComicRouteRecordAccess,
} from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-chapter', limit: 120, windowSeconds: 60 }))) {
    return Response.json({ message: 'Too Many Requests' }, { status: 429, headers: buildPrivateCacheControl() });
  }

  const { slug } = await context.params;
  try {
    const includeNsfw = await resolveComicRouteIncludeNsfw(request);
    const payload = await getMangaChapter(slug, {
      includeNsfw,
      recordAccess: resolveComicRouteRecordAccess(request),
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
