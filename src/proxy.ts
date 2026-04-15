import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeVaultAwareNextPath } from "@/lib/auth/next-path";
import { getOnboardingGateRedirectPath, isProxyProtectedPath, shouldBypassProxyAuthGates } from "@/lib/auth/session";
import { getOnboardingStatus } from "@/lib/onboarding/server";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const CANONICAL_APP_ORIGIN = 'https://jawatch.web.id';
const LEGACY_APP_HOSTS = new Set(['weebs.dwizzy.my.id', 'weeb.dwizzy.my.id']);

const BLOCKED_EXACT_PATHS = new Set([
  "/@vite/env",
  "/api/gql",
  "/api/graphql",
  "/graphql",
  "/graphql/api",
  "/login.action",
  "/server",
  "/server-status",
  "/swagger-ui.html",
  "/swagger.json",
  "/trace.axd",
  "/v2/_catalog",
  "/v2/api-docs",
  "/v3/api-docs",
]);

const BLOCKED_PREFIXES = [
  "/api-docs/",
  "/debug/",
  "/nsfw/",
  "/ecp/",
  "/swagger/",
  "/webjars/",
];

const SESSION_REFRESH_PREFIXES = ["/account/", "/auth/", "/collection/", "/logout/", "/vault/"];
const SESSION_REFRESH_EXACT_PATHS = new Set(["/account", "/auth", "/collection", "/login", "/logout", "/vault"]);

function shouldRefreshSupabaseSession(pathname: string) {
  if (SESSION_REFRESH_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return SESSION_REFRESH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSupabaseProxyEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getSupabaseProxyEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

function cloneCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

async function createProxySupabaseContext(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const proxyEnv = getSupabaseProxyEnv();
  if (!proxyEnv) {
    return null;
  }

  const supabase = createServerClient(proxyEnv.supabaseUrl, proxyEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}

function isScannerPath(pathname: string) {
  if (pathname.startsWith("/.") && !pathname.startsWith("/.well-known/")) {
    return true;
  }

  if (BLOCKED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  if (pathname === "/nsfw") {
    return true;
  }

  if (pathname === "/wp" || pathname.startsWith("/wp-") || pathname.startsWith("/wp/")) {
    return true;
  }

  if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (LEGACY_APP_HOSTS.has(request.nextUrl.hostname)) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_APP_ORIGIN);
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (isScannerPath(pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "cache-control": "public, max-age=300, s-maxage=300",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
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

  if (!isProxyProtectedPath(pathname) || !hasSupabaseProxyEnv()) {
    if (!shouldRefreshSupabaseSession(pathname)) {
      return NextResponse.next();
    }

    try {
      return await refreshSupabaseSession(request);
    } catch {
      return NextResponse.next();
    }
  }

  const context = await createProxySupabaseContext(request);
  if (!context) {
    return NextResponse.next();
  }

  const { supabase, response } = context;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", normalizeVaultAwareNextPath(pathname + request.nextUrl.search));
    const loginRedirect = NextResponse.redirect(loginUrl);
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
