'use server';

import { redirect } from 'next/navigation';
import { buildAuthCallbackUrl, resolveSuccessfulAuthRedirectPath } from '@/lib/auth/auth-flow';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type AuthRoute = '/login' | '/signup';
type OAuthProvider = 'google' | 'discord';

function buildAuthErrorUrl(route: AuthRoute, nextPath: string, errorCode: string) {
  return `${route}?next=${encodeURIComponent(normalizeVaultAwareNextPath(nextPath))}&error=${errorCode}`;
}

async function redirectAfterSuccessfulAuth(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  nextPath: string,
) {
  try {
    const targetPath = await resolveSuccessfulAuthRedirectPath(supabase, nextPath);
    redirect(targetPath);
  } catch {
    redirect('/?onboarding_error=1');
  }
}

async function startOAuthAuth(route: AuthRoute, provider: OAuthProvider, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const redirectTo = buildAuthCallbackUrl(nextPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    redirect(buildAuthErrorUrl(route, nextPath, 'oauth'));
  }

  redirect(data.url);
}

export async function signInWithOAuth(provider: OAuthProvider, nextPath: string) {
  return startOAuthAuth('/login', provider, nextPath);
}

export async function signUpWithOAuth(provider: OAuthProvider, nextPath: string) {
  return startOAuthAuth('/signup', provider, nextPath);
}

export async function signInWithPassword(formData: FormData) {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');
  const nextValue = formData.get('next');
  const email = typeof emailValue === 'string' ? emailValue.trim() : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const nextPath = normalizeVaultAwareNextPath(typeof nextValue === 'string' ? nextValue : undefined);

  if (!email || !password) {
    redirect(buildAuthErrorUrl('/login', nextPath, 'password'));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildAuthErrorUrl('/login', nextPath, 'password'));
  }

  await redirectAfterSuccessfulAuth(supabase, nextPath);
}

export async function signUpWithPassword(formData: FormData) {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');
  const confirmValue = formData.get('confirmPassword');
  const nextValue = formData.get('next');
  const displayNameValue = formData.get('displayName');
  const email = typeof emailValue === 'string' ? emailValue.trim() : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const confirmPassword = typeof confirmValue === 'string' ? confirmValue : '';
  const displayName = typeof displayNameValue === 'string' ? displayNameValue.trim() : '';
  const nextPath = normalizeVaultAwareNextPath(typeof nextValue === 'string' ? nextValue : undefined);

  if (!email || password.length < 8 || password !== confirmPassword) {
    redirect(buildAuthErrorUrl('/signup', nextPath, 'password'));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(nextPath),
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    redirect(buildAuthErrorUrl('/signup', nextPath, 'signup'));
  }

  if (data.session) {
    await redirectAfterSuccessfulAuth(supabase, nextPath);
  }

  redirect(`/login?next=${encodeURIComponent(nextPath)}&created=1`);
}
