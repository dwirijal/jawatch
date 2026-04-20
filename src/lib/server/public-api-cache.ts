import 'server-only';

import { resolveViewerNsfwAccess } from './viewer-nsfw-access.ts';
import { requestHasSupabaseAuthCookie } from '../auth/supabase-auth-cookie.ts';
import { buildPrivateCacheControl, buildPublicCacheHeaders } from '../cloudflare-cache.ts';
import { resolveComicRouteIncludeNsfw } from './comic-route-access.ts';

export type PublicApiRequestContext = {
  authenticatedViewerRequest: boolean;
  trustedOriginRequest: boolean;
  includeNsfw: boolean;
  responseHeaders: Record<string, string>;
};

export async function resolvePublicApiRequestContext(
  request: Request,
  ttlSeconds: number,
): Promise<PublicApiRequestContext> {
  const trustedOriginRequest = Boolean(request.headers.get('x-comic-origin-token'));
  const authenticatedViewerRequest =
    requestHasSupabaseAuthCookie(request) ||
    Boolean(request.headers.get('authorization'));

  return {
    authenticatedViewerRequest,
    trustedOriginRequest,
    includeNsfw: trustedOriginRequest
      ? await resolveComicRouteIncludeNsfw(request)
      : authenticatedViewerRequest
        ? await resolveViewerNsfwAccess()
        : false,
    responseHeaders:
      trustedOriginRequest || authenticatedViewerRequest
        ? buildPrivateCacheControl()
        : buildPublicCacheHeaders(ttlSeconds),
  };
}
