// Contract: auth.dwizzy.my.id is the only auth authority consumed by dwizzyWEEB.

import type { AuthBridgeSessionResponse, AuthLogoutRequest, AuthStatus, AuthUser } from '@/lib/auth-types';
import { canUseBrowserAuthBridge, resolveAuthOrigin } from '@/lib/auth-origin';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const DEFAULT_APP_ORIGIN = 'https://weebs.dwizzy.my.id';
const DEFAULT_RETURN_PATH = '/';

function resolveAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_APP_ORIGIN;
  return candidate.startsWith('http://') || candidate.startsWith('https://')
    ? candidate.replace(/\/+$/, '')
    : `https://${candidate.replace(/\/+$/, '')}`;
}

function shouldSkipBrowserSessionBridge(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !canUseBrowserAuthBridge(window.location.origin);
}

function sanitizeRelativePath(nextPath: string | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

function normalizeUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user || typeof user.id !== 'string' || typeof user.displayName !== 'string') {
    return null;
  }

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
    provider: typeof user.provider === 'string' ? user.provider : undefined,
  };
}

function buildSessionUrl(): string {
  return new URL('/api/session', resolveAuthOrigin()).toString();
}

// Browser-facing session bridge. The provider calls this with credentials included.
export async function getAuthStatus(): Promise<AuthStatus> {
  if (shouldSkipBrowserSessionBridge()) {
    return { authenticated: false, user: null };
  }

  const response = await fetchWithTimeout(buildSessionUrl(), {
    credentials: 'include',
    cache: 'no-store',
    timeoutMs: 2500,
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    return { authenticated: false, user: null };
  }

  if (!response.ok) {
    throw new Error(`Auth bridge request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AuthBridgeSessionResponse | null;
  const user = normalizeUser(payload?.user ?? null);

  return {
    authenticated: payload?.authenticated === true && user !== null,
    user: payload?.authenticated === true ? user : null,
  };
}

export function buildLoginUrl(nextPath: string): string {
  const url = new URL('/login', resolveAuthOrigin());
  url.searchParams.set('next', sanitizeRelativePath(nextPath));
  url.searchParams.set('origin', resolveAppOrigin());
  return url.toString();
}

export function buildLogoutRequest(nextPath: string): AuthLogoutRequest {
  const url = new URL('/logout', resolveAuthOrigin()).toString();
  const body = new URLSearchParams();
  body.set('returnTo', sanitizeRelativePath(nextPath));
  body.set('origin', resolveAppOrigin());

  return {
    url,
    method: 'POST',
    credentials: 'include',
    body,
  };
}
