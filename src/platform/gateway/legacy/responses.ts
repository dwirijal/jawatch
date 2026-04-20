import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';

export function notFoundResponse() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'cache-control': 'public, max-age=300, s-maxage=300',
      'x-robots-tag': 'noindex, nofollow, noarchive',
    },
  });
}

export function buildLoginRedirect(request: NextRequest, nextPath: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', normalizeVaultAwareNextPath(nextPath));
  return NextResponse.redirect(loginUrl);
}
