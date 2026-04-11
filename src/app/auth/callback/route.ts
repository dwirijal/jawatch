import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { bootstrapProfileFromSession } from '@/lib/auth/profile';
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

async function finalizeSignIn(request: Request, nextPath: string) {
  const supabase = await createSupabaseServerClient();
  const redirectUrl = toRedirectUrl(request, nextPath);
  return { supabase, redirectUrl };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeRelativePath(requestUrl.searchParams.get('next'));
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type');
  const { supabase, redirectUrl } = await finalizeSignIn(request, nextPath);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        await bootstrapProfileFromSession(supabase);
        return NextResponse.redirect(redirectUrl);
      } catch {
        // Failed profile bootstrap should use standard callback error redirect.
      }
    }
  } else if (tokenHash && isEmailOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (!error) {
      try {
        await bootstrapProfileFromSession(supabase);
        return NextResponse.redirect(redirectUrl);
      } catch {
        // Failed profile bootstrap should use standard callback error redirect.
      }
    }
  }

  const fallback = new URL('/login', request.url);
  fallback.searchParams.set('next', nextPath);
  fallback.searchParams.set('error', 'callback');
  return NextResponse.redirect(fallback);
}
