import 'server-only';

import { cookies } from 'next/headers';

function isSupabaseAuthCookieName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized.includes('sb-') && normalized.includes('auth-token');
}

export function requestHasSupabaseAuthCookie(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  if (!cookieHeader) {
    return false;
  }

  return cookieHeader.split(';').some((part) => {
    const [rawName] = part.split('=');
    return rawName ? isSupabaseAuthCookieName(rawName) : false;
  });
}

export async function hasSupabaseAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.getAll().some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
