import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getOnboardingGateRedirectPath,
  isProxyProtectedPath,
  shouldBypassProxyAuthGates,
} from '@/lib/auth/session';
import { getOnboardingStatus } from '@/lib/onboarding/server';
import { buildLoginRedirect, notFoundResponse } from '@/platform/gateway/legacy/responses';
import {
  buildCanonicalAppRedirectUrl,
  getLegacySeriesEpisodeRedirectPath,
  isLegacyAppHost,
  isRemovedPublicRoute,
  isScannerPath,
  shouldRefreshSupabaseSession,
} from '@/platform/gateway/legacy/routing';
import {
  cloneCookies,
  createProxySupabaseContext,
  hasSupabaseProxyEnv,
} from '@/platform/gateway/legacy/supabase-context';
import { refreshSupabaseSession } from '@/platform/supabase/middleware';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isLegacyAppHost(request.nextUrl.hostname)) {
    const redirectUrl = buildCanonicalAppRedirectUrl(request.nextUrl.pathname, request.nextUrl.search);
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (isScannerPath(pathname) || isRemovedPublicRoute(pathname)) {
    return notFoundResponse();
  }

  const legacySeriesEpisodeRedirectPath = getLegacySeriesEpisodeRedirectPath(pathname);
  if (legacySeriesEpisodeRedirectPath) {
    return NextResponse.redirect(new URL(legacySeriesEpisodeRedirectPath, request.url), 308);
  }

  if (shouldBypassProxyAuthGates(pathname)) {
    if (!shouldRefreshSupabaseSession(pathname) || !hasSupabaseProxyEnv()) {
      return NextResponse.next();
    }

    try {
      return await refreshSupabaseSession(request);
    } catch {
      return NextResponse.next();
    }
  }

  if (!isProxyProtectedPath(pathname)) {
    if (!shouldRefreshSupabaseSession(pathname)) {
      return NextResponse.next();
    }

    try {
      return await refreshSupabaseSession(request);
    } catch {
      return NextResponse.next();
    }
  }

  if (!hasSupabaseProxyEnv()) {
    return buildLoginRedirect(request, pathname + request.nextUrl.search);
  }

  const context = await createProxySupabaseContext(request);
  if (!context) {
    return NextResponse.next();
  }

  const { supabase, response } = context;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const loginRedirect = buildLoginRedirect(request, pathname + request.nextUrl.search);
    cloneCookies(response, loginRedirect);
    return loginRedirect;
  }

  try {
    const status = await getOnboardingStatus(supabase, data.user.id);
    const onboardingRedirectPath = getOnboardingGateRedirectPath(pathname, status.complete);

    if (onboardingRedirectPath) {
      const onboardingRedirect = NextResponse.redirect(new URL(onboardingRedirectPath, request.url));
      cloneCookies(response, onboardingRedirect);
      return onboardingRedirect;
    }
  } catch {
    const fallbackRedirect = NextResponse.redirect(new URL("/?onboarding_error=1", request.url));
    cloneCookies(response, fallbackRedirect);
    return fallbackRedirect;
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
