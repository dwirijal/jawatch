const CANONICAL_APP_HOST = 'jawatch.web.id';
const LEGACY_APP_HOSTS = ['weebs.dwizzy.my.id', 'weeb.dwizzy.my.id'];
const ALLOWED_APP_HOSTS = new Set([CANONICAL_APP_HOST, ...LEGACY_APP_HOSTS, 'localhost', '127.0.0.1']);
const DEFAULT_APP_ORIGIN = `https://${CANONICAL_APP_HOST}`;
const DEFAULT_AUTH_ORIGIN = DEFAULT_APP_ORIGIN;
const ALLOWED_AUTH_HOSTS = new Set(ALLOWED_APP_HOSTS);

function normalizeOrigin(value: string | undefined): string {
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

function isAllowedAuthHostname(hostname: string): boolean {
  return ALLOWED_AUTH_HOSTS.has(hostname);
}

function resolveAllowedOrigin(
  rawOrigin: string | undefined,
  fallbackOrigin: string,
  isAllowedHostname: (hostname: string) => boolean,
): string {
  try {
    const origin = new URL(normalizeOrigin(rawOrigin));
    if (!isAllowedHostname(origin.hostname)) {
      return fallbackOrigin;
    }
    return origin.origin;
  } catch {
    return fallbackOrigin;
  }
}

export function resolveAuthOrigin(): string {
  const rawOrigin =
    process.env.AUTH_ORIGIN ??
    process.env.NEXT_PUBLIC_AUTH_ORIGIN ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_AUTH_ORIGIN;
  return resolveAllowedOrigin(rawOrigin, DEFAULT_AUTH_ORIGIN, isAllowedAuthHostname);
}

export function resolveAllowedAppOrigin(rawOrigin: string | undefined): string {
  return resolveAllowedOrigin(rawOrigin, DEFAULT_APP_ORIGIN, isAllowedAppHostname);
}

export function resolveAppOrigin(): string {
  const rawOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_APP_ORIGIN;
  return resolveAllowedAppOrigin(rawOrigin);
}

export function canUseBrowserAuthBridge(currentOrigin: string): boolean {
  try {
    const authOrigin = new URL(resolveAuthOrigin());
    const current = new URL(currentOrigin);

    if (!isAllowedAuthHostname(authOrigin.hostname) || !ALLOWED_APP_HOSTS.has(current.hostname)) {
      return false;
    }

    return authOrigin.origin === current.origin;
  } catch {
    return false;
  }
}
