import { getComicSubtypePosters } from '@/lib/adapters/comic-server';
import { buildPrivateCacheControl } from '@/lib/cloudflare-cache';
import { resolveComicRouteIncludeNsfw } from '@/lib/server/comic-route-access';
import { allowRequestWithinRateLimit } from '@/lib/server/request-rate-limit';

export async function GET(request: Request) {
  if (!(await allowRequestWithinRateLimit(request, { bucket: 'api-comic-subtype-posters', limit: 120, windowSeconds: 60 }))) {
    return Response.json({}, { status: 429, headers: buildPrivateCacheControl() });
  }

  const includeNsfw = await resolveComicRouteIncludeNsfw(request);
  const payload = await getComicSubtypePosters({ includeNsfw }).catch(() => ({}));

  return Response.json(payload, {
    headers: buildPrivateCacheControl(),
  });
}
