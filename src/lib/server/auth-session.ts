import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import type { AuthBridgeSessionResponse, AuthStatus, AuthUser } from '@/lib/auth-types';
import { resolveAuthOrigin } from '@/lib/auth-origin';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

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

function parseAuthPayload(payload: AuthBridgeSessionResponse | null | undefined): AuthStatus {
  const user = normalizeUser(payload?.user ?? null);
  return {
    authenticated: payload?.authenticated === true && user !== null,
    user: payload?.authenticated === true ? user : null,
  };
}

async function loadServerAuthStatus(request?: Request): Promise<AuthStatus> {
  const cookieHeader =
    request?.headers.get('cookie') ??
    (await cookies())
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

  if (!cookieHeader) {
    return { authenticated: false, user: null };
  }

  try {
    const response = await fetchWithTimeout(buildSessionUrl(), {
      method: 'GET',
      cache: 'no-store',
      timeoutMs: 2500,
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader,
      },
    });

    if (response.status === 401) {
      return { authenticated: false, user: null };
    }

    if (!response.ok) {
      return { authenticated: false, user: null };
    }

    const payload = (await response.json()) as AuthBridgeSessionResponse | null;
    return parseAuthPayload(payload);
  } catch {
    return { authenticated: false, user: null };
  }
}

const getCachedServerAuthStatus = cache(async (): Promise<AuthStatus> => loadServerAuthStatus());

export async function getServerAuthStatus(request?: Request): Promise<AuthStatus> {
  if (request) {
    return loadServerAuthStatus(request);
  }

  return getCachedServerAuthStatus();
}
