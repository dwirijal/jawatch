import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/ecp/",
  "/swagger/",
  "/webjars/",
];

function isScannerPath(pathname: string) {
  if (pathname.startsWith("/.") && !pathname.startsWith("/.well-known/")) {
    return true;
  }

  if (BLOCKED_EXACT_PATHS.has(pathname)) {
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

export function proxy(request: NextRequest) {
  if (!isScannerPath(request.nextUrl.pathname)) {
    return NextResponse.next();
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
