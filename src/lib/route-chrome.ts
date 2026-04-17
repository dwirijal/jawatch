const CHROMELESS_ROUTE_PREFIXES = ['/login'];

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) {
    return '/';
  }

  return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
}

export function isChromelessPath(pathname: string | null | undefined): boolean {
  const normalized = normalizePathname(pathname);
  return CHROMELESS_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function isImmersivePlaybackPath(pathname: string | null | undefined): boolean {
  const normalized = normalizePathname(pathname);
  if (normalized.startsWith('/shorts/') && normalized.includes('/episodes/')) {
    return true;
  }
  return normalized.startsWith('/series/') && normalized.includes('/episodes/');
}
