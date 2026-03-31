const DEFAULT_AUTH_ORIGIN = 'https://auth.dwizzy.my.id';
const ALLOWED_AUTH_HOSTS = new Set(['auth.dwizzy.my.id', 'localhost', '127.0.0.1']);
const CANONICAL_APP_HOST = 'weebs.dwizzy.my.id';
const ALIAS_APP_HOST = 'weeb.dwizzy.my.id';
const ALLOWED_APP_HOSTS = new Set([CANONICAL_APP_HOST, ALIAS_APP_HOST, 'localhost', '127.0.0.1']);
const DEFAULT_APP_ORIGIN = `https://${CANONICAL_APP_HOST}`;

function normalizeOrigin(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate) {
    return DEFAULT_AUTH_ORIGIN;
  }

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate.replace(/\/+$/, '');
  }

  const protocol = candidate === 'localhost' || candidate.startsWith('localhost:') || candidate.startsWith('127.0.0.1:')
    ? 'http'
    : 'https';

  return `${protocol}://${candidate.replace(/\/+$/, '')}`;
}

function isAllowedAuthHostname(hostname: string): boolean {
  return ALLOWED_AUTH_HOSTS.has(hostname);
}

function normalizeAppOrigin(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate) {
    return DEFAULT_APP_ORIGIN;
  }

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate.replace(/\/+$/, '');
  }

  const protocol = candidate === 'localhost' || candidate.startsWith('localhost:') || candidate.startsWith('127.0.0.1:')
    ? 'http'
    : 'https';

  return `${protocol}://${candidate.replace(/\/+$/, '')}`;
}

function isAllowedAppHostname(hostname: string): boolean {
  return ALLOWED_APP_HOSTS.has(hostname);
}

export function resolveAuthOrigin(): string {
  const rawOrigin = process.env.AUTH_ORIGIN ?? process.env.NEXT_PUBLIC_AUTH_ORIGIN ?? DEFAULT_AUTH_ORIGIN;

  try {
    const origin = new URL(normalizeOrigin(rawOrigin));
    if (!isAllowedAuthHostname(origin.hostname)) {
      return DEFAULT_AUTH_ORIGIN;
    }
    return origin.origin;
  } catch {
    return DEFAULT_AUTH_ORIGIN;
  }
}

export function resolveAllowedAppOrigin(rawOrigin: string | undefined): string {
  const candidate = rawOrigin?.trim() || DEFAULT_APP_ORIGIN;

  try {
    const origin = new URL(normalizeAppOrigin(candidate));
    if (!isAllowedAppHostname(origin.hostname)) {
      return DEFAULT_APP_ORIGIN;
    }
    return origin.origin;
  } catch {
    return DEFAULT_APP_ORIGIN;
  }
}

export function resolveAppOrigin(): string {
  const rawOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_APP_ORIGIN;
  return resolveAllowedAppOrigin(rawOrigin);
}

export function canUseBrowserAuthBridge(currentOrigin: string): boolean {
  try {
    const authOrigin = new URL(resolveAuthOrigin());
    const current = new URL(currentOrigin);

    if (authOrigin.origin === current.origin) {
      return true;
    }

    if (!isAllowedAuthHostname(authOrigin.hostname) || !ALLOWED_APP_HOSTS.has(current.hostname)) {
      return false;
    }

    if (authOrigin.hostname === current.hostname) {
      return true;
    }

    return authOrigin.hostname === 'auth.dwizzy.my.id' && ALLOWED_APP_HOSTS.has(current.hostname);
  } catch {
    return false;
  }
}
