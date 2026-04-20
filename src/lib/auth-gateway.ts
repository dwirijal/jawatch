// Contract: jawatch uses embedded Supabase auth routes.

import type { AuthLogoutRequest, AuthStatus, AuthUser } from '@/lib/auth-types';
import { normalizeVaultAwareNextPath } from './auth/next-path.ts';
import {
  resetSyncedAuthClientState,
  syncAuthenticatedClientState,
  syncAuthStoreOwnership,
} from './auth/auth-client-personalization.ts';
import { createSupabaseBrowserClient } from './supabase/client.ts';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function buildDisplayName(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const metadata = user.user_metadata ?? {};
  const preferredName =
    asString(metadata.display_name) ??
    asString(metadata.full_name) ??
    asString(metadata.name) ??
    asString(metadata.user_name) ??
    asString(metadata.preferred_username);

  if (preferredName) {
    return preferredName;
  }

  if (user.email) {
    const [token] = user.email.split('@');
    if (token && token.length > 0) {
      return token;
    }
    return user.email;
  }

  return `user-${user.id.slice(0, 8)}`;
}

function normalizeUser(user: {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  identities?: Array<{ provider?: string | null } | null>;
} | null): AuthUser | null {
  if (!user || typeof user.id !== 'string') {
    return null;
  }
  const userId = user.id;

  const providerFromAppMetadata = asString(user.app_metadata?.provider);
  const providerFromIdentity = Array.isArray(user.identities)
    ? user.identities.map((identity) => asString(identity?.provider)).find((provider) => provider !== undefined)
    : undefined;

  return {
    id: user.id,
    email: asString(user.email),
    displayName: buildDisplayName({
      id: userId,
      email: user.email,
      user_metadata: user.user_metadata,
    }),
    avatarUrl:
      asString(user.user_metadata?.avatar_url) ??
      asString(user.user_metadata?.picture) ??
      asString(user.user_metadata?.avatar),
    provider: providerFromAppMetadata ?? providerFromIdentity,
  };
}

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function resolveAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jawatch.web.id';
}

// Browser-facing auth status helper. The provider calls this in the client.
export async function getAuthStatus(): Promise<AuthStatus> {
  if (typeof window === 'undefined') {
    return { authenticated: false, user: null };
  }

  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }

  const { data, error } = await browserClient.auth.getUser();
  if (error) {
    resetSyncedAuthClientState();
    syncAuthStoreOwnership(null);
    return { authenticated: false, user: null };
  }

  const user = normalizeUser(data.user ?? null);
  syncAuthStoreOwnership(user?.id ?? null);

  if (user?.id) {
    try {
      await syncAuthenticatedClientState(user.id);
    } catch {
      resetSyncedAuthClientState();
    }
  } else {
    resetSyncedAuthClientState();
  }

  return {
    authenticated: user !== null,
    user,
  };
}

export function buildLoginUrl(nextPath: string): string {
  const url = new URL('/login', resolveAppOrigin());
  url.searchParams.set('next', normalizeVaultAwareNextPath(nextPath));
  return url.toString();
}

export function buildLogoutRequest(nextPath: string): AuthLogoutRequest {
  const appOrigin = resolveAppOrigin();
  const url = new URL('/logout', appOrigin).toString();
  const body = new URLSearchParams();
  body.set('returnTo', normalizeVaultAwareNextPath(nextPath));
  body.set('origin', appOrigin);

  return {
    url,
    method: 'POST',
    credentials: 'include',
    body,
  };
}
