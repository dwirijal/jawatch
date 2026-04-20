import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/platform/supabase/server';

const DEFAULT_RETURN_PATH = '/';

function sanitizeRelativePath(nextPath: string | null | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

function resolveReturnPath(request: Request, body: FormData | null): string {
  const requestUrl = new URL(request.url);
  if (body) {
    const returnTo = body.get('returnTo');
    if (typeof returnTo === 'string') {
      return sanitizeRelativePath(returnTo);
    }
  }

  return sanitizeRelativePath(requestUrl.searchParams.get('returnTo'));
}

async function handleLogout(request: Request, body: FormData | null) {
  const returnPath = resolveReturnPath(request, body);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(returnPath, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  return handleLogout(request, formData);
}

export async function GET(request: Request) {
  return handleLogout(request, null);
}
