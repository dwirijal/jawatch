import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

const SESSION_REFRESH_PREFIXES = ["/account/", "/auth/", "/collection/", "/logout/"];
const SESSION_REFRESH_EXACT_PATHS = new Set(["/account", "/auth", "/collection", "/login", "/logout"]);

function shouldRefreshSupabaseSession(pathname: string) {
  if (SESSION_REFRESH_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return SESSION_REFRESH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSupabaseProxyEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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
  if (LEGACY_APP_HOSTS.has(request.nextUrl.hostname)) {
    const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_APP_ORIGIN);
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (!isScannerPath(request.nextUrl.pathname)) {
    if (!shouldRefreshSupabaseSession(request.nextUrl.pathname) || !hasSupabaseProxyEnv()) {
      return NextResponse.next();
    }

    try {
      return await refreshSupabaseSession(request);
    } catch {
      return NextResponse.next();
    }
  }

  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
