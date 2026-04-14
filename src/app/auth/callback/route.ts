import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { bootstrapProfileFromSession } from '@/lib/auth/profile';
import { resolvePostAuthRedirectPath } from '@/lib/auth/session';
import { getOnboardingStatus } from '@/lib/onboarding/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const DEFAULT_RETURN_PATH = '/';

function sanitizeRelativePath(nextPath: string | null | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

function toRedirectUrl(request: Request, nextPath: string) {
  const url = new URL(nextPath, request.url);
  return url;
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value === 'signup' || value === 'magiclink' || value === 'recovery' || value === 'email_change' || value === 'email';
}

async function finalizeSignIn() {
  const supabase = await createSupabaseServerClient();
  return { supabase };
}

function toOnboardingErrorUrl(request: Request) {
  return toRedirectUrl(request, '/?onboarding_error=1');
}

async function getCallbackRedirectAfterBootstrap(
  request: Request,
  nextPath: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  await bootstrapProfileFromSession(supabase);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw error ?? new Error('Missing callback user');
  }

  const status = await getOnboardingStatus(supabase, data.user.id);
  const targetPath = resolvePostAuthRedirectPath(nextPath, status.complete);
  return toRedirectUrl(request, targetPath);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRelativePath(requestUrl.searchParams.get('next'));
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type');
  const { supabase } = await finalizeSignIn();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const target = await getCallbackRedirectAfterBootstrap(request, nextPath, supabase);
        return NextResponse.redirect(target);
      } catch {
        return NextResponse.redirect(toOnboardingErrorUrl(request));
      }
    }
  } else if (tokenHash && isEmailOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (!error) {
      try {
        const target = await getCallbackRedirectAfterBootstrap(request, nextPath, supabase);
        return NextResponse.redirect(target);
      } catch {
        return NextResponse.redirect(toOnboardingErrorUrl(request));
      }
    }
  }

  const fallback = new URL('/login', request.url);
  fallback.searchParams.set('next', nextPath);
  fallback.searchParams.set('error', 'callback');
  return NextResponse.redirect(fallback);
}
