import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getOnboardingStatus } from '../onboarding/server.ts';
import { bootstrapProfileFromSession } from './profile.ts';
import { normalizeVaultAwareNextPath } from './next-path.ts';
import { resolvePostAuthRedirectPath } from './session.ts';

export function resolveAuthAppOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || 'https://jawatch.web.id';
}

export function buildAuthCallbackUrl(nextPath: string): string {
  const callbackUrl = new URL('/auth/callback', resolveAuthAppOrigin());
  callbackUrl.searchParams.set('next', normalizeVaultAwareNextPath(nextPath));
  return callbackUrl.toString();
}

export function buildPasswordRecoveryPath(nextPath: string): string {
  const normalizedNextPath = normalizeVaultAwareNextPath(nextPath);
  return `/forgot-password?mode=reset&next=${encodeURIComponent(normalizedNextPath)}`;
}

export function buildPasswordRecoveryCallbackUrl(nextPath: string): string {
  return buildAuthCallbackUrl(buildPasswordRecoveryPath(nextPath));
}

export async function resolveSuccessfulAuthRedirectPath(
  supabase: SupabaseClient,
  nextPath: string,
): Promise<string> {
  await bootstrapProfileFromSession(supabase);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw error ?? new Error('Missing authenticated user after auth flow');
  }

  const status = await getOnboardingStatus(supabase, data.user.id);
  return resolvePostAuthRedirectPath(nextPath, status.complete);
}
