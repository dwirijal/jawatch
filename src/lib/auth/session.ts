import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthUser } from '@/lib/auth-types';

type AdultEligibilityInput = {
  birthDate?: string | Date | null;
  ageVerifiedAt?: string | Date | null;
};

export type AdultEligibility = {
  isAdultEligible: boolean;
  age: number | null;
  ageVerified: boolean;
};

const ONBOARDING_PATH = '/onboarding';
const DEFAULT_RETURN_PATH = '/';
const VAULT_SAVED_PATH = '/vault/saved';
const PROXY_AUTH_EXEMPT_EXACT_PATHS = new Set(['/login', '/logout', '/onboarding']);
const PROXY_AUTH_EXEMPT_PREFIXES = ['/auth/callback', '/login/', '/logout/', '/onboarding/'];
const PROXY_STATIC_EXACT_PATHS = new Set([
  '/ads.txt',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
]);
const PROXY_PROTECTED_PREFIXES = ['/account/', '/collection/', '/vault/'];
const PROXY_PROTECTED_EXACT_PATHS = new Set(['/account', '/collection', '/vault']);

function parseCookieHeader(cookieHeader: string): Array<{ name: string; value: string }> {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      const delimiterIndex = part.indexOf('=');
      if (delimiterIndex < 0) {
        return null;
      }

      const name = part.slice(0, delimiterIndex).trim();
      const value = part.slice(delimiterIndex + 1).trim();
      if (!name) {
        return null;
      }

      return { name, value };
    })
    .filter((cookie): cookie is { name: string; value: string } => cookie !== null);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function sanitizeRelativePath(nextPath: string | undefined): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_RETURN_PATH;
  }

  return candidate;
}

function isLegacyCollectionPath(pathname: string): boolean {
  return pathname === '/collection' || pathname.startsWith('/collection?') || pathname.startsWith('/collection/');
}

export function normalizeVaultAwareNextPath(nextPath: string | undefined): string {
  const candidate = sanitizeRelativePath(nextPath);

  if (isLegacyCollectionPath(candidate)) {
    return VAULT_SAVED_PATH;
  }

  return candidate;
}

export function resolvePostAuthRedirectPath(nextPath: string | undefined, onboardingComplete: boolean): string {
  if (!onboardingComplete) {
    return ONBOARDING_PATH;
  }

  return normalizeVaultAwareNextPath(nextPath);
}

export function getOnboardingGateRedirectPath(pathname: string | undefined, onboardingComplete: boolean): string | null {
  if (onboardingComplete) {
    return null;
  }

  const target = normalizeVaultAwareNextPath(pathname);
  if (
    target === ONBOARDING_PATH ||
    target.startsWith(`${ONBOARDING_PATH}/`) ||
    target.startsWith(`${ONBOARDING_PATH}?`)
  ) {
    return null;
  }

  return ONBOARDING_PATH;
}

export function isProxyProtectedPath(pathname: string): boolean {
  if (PROXY_PROTECTED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PROXY_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProxyAuthRedirectExemptPath(pathname: string) {
  if (PROXY_AUTH_EXEMPT_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PROXY_AUTH_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasPublicFileExtension(pathname: string) {
  const lastSlash = pathname.lastIndexOf('/');
  const leaf = lastSlash >= 0 ? pathname.slice(lastSlash + 1) : pathname;
  if (!leaf || leaf.startsWith('.')) {
    return false;
  }

  return leaf.includes('.');
}

function isStaticOrPublicPath(pathname: string) {
  if (pathname.startsWith('/_next/')) {
    return true;
  }

  if (PROXY_STATIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return hasPublicFileExtension(pathname);
}

export function shouldBypassProxyAuthGates(pathname: string) {
  if (isProxyAuthRedirectExemptPath(pathname)) {
    return true;
  }

  if (isProxyProtectedPath(pathname)) {
    return false;
  }

  return isStaticOrPublicPath(pathname);
}

function buildDisplayName(user: User): string {
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

function buildProvider(user: User): string | undefined {
  const appProvider = asString(user.app_metadata?.provider);
  if (appProvider) {
    return appProvider;
  }

  if (Array.isArray(user.identities)) {
    for (const identity of user.identities) {
      const provider = asString(identity?.provider);
      if (provider) {
        return provider;
      }
    }
  }

  return undefined;
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? undefined,
    displayName: buildDisplayName(user),
    avatarUrl:
      asString(user.user_metadata?.avatar_url) ??
      asString(user.user_metadata?.picture) ??
      asString(user.user_metadata?.avatar),
    provider: buildProvider(user),
  };
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeAge(birthDate: Date, now = new Date()): number {
  const utcBirthYear = birthDate.getUTCFullYear();
  const utcBirthMonth = birthDate.getUTCMonth();
  const utcBirthDay = birthDate.getUTCDate();

  let age = now.getUTCFullYear() - utcBirthYear;
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > utcBirthMonth ||
    (now.getUTCMonth() === utcBirthMonth && now.getUTCDate() >= utcBirthDay);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function getAdultEligibility(input: AdultEligibilityInput, now = new Date()): AdultEligibility {
  const birthDate = toDate(input.birthDate ?? null);
  const ageVerified = toDate(input.ageVerifiedAt ?? null) !== null;

  if (!birthDate) {
    return {
      isAdultEligible: false,
      age: null,
      ageVerified,
    };
  }

  const age = computeAge(birthDate, now);
  return {
    isAdultEligible: age >= 21,
    age,
    ageVerified,
  };
}

export async function getCurrentUser(request?: Request): Promise<AuthUser | null> {
  try {
    let supabase: SupabaseClient;

    if (request) {
      const { createServerClient } = await import('@supabase/ssr');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return null;
      }

      const requestCookies = parseCookieHeader(request.headers.get('cookie') ?? '');
      supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return requestCookies;
          },
          setAll() {
            // Request-scoped reads do not mutate outgoing cookies here.
          },
        },
      });
    } else {
      const { createSupabaseServerClient } = await import('@/lib/supabase/server');
      supabase = await createSupabaseServerClient();
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return toAuthUser(data.user);
  } catch {
    return null;
  }
}

export async function getRequiredUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  return user;
}

export async function requireUser(nextPath = '/'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (user) {
    return user;
  }

  const { redirect } = await import('next/navigation');
  const target = normalizeVaultAwareNextPath(nextPath);
  redirect(`/login?next=${encodeURIComponent(target)}`);
  throw new Error('UNAUTHENTICATED_REDIRECT');
}

export async function requireCompletedOnboarding(nextPath = '/'): Promise<AuthUser> {
  const user = await requireUser(nextPath);
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const { getOnboardingStatus } = await import('@/lib/onboarding/server');
  let isComplete = false;

  try {
    const supabase = await createSupabaseServerClient();
    const status = await getOnboardingStatus(supabase, user.id);
    isComplete = status.complete;
  } catch {
    const { redirect } = await import('next/navigation');
    redirect('/?onboarding_error=1');
    throw new Error('ONBOARDING_STATUS_ERROR_REDIRECT');
  }

  const redirectPath = getOnboardingGateRedirectPath(nextPath, isComplete);
  if (!redirectPath) {
    return user;
  }

  const { redirect } = await import('next/navigation');
  redirect(redirectPath);
  throw new Error('ONBOARDING_REQUIRED_REDIRECT');
}
