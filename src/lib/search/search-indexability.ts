import { SHORTS_HUB_ENABLED } from '../shorts-paths.js';

const NON_INDEXABLE_PREFIXES = [
  '/api',
  '/_next',
  '/search',
  '/login',
  '/signup',
  '/forgot-password',
  '/auth',
  '/onboarding',
  '/vault',
  '/admin',
];

const INDEXABLE_STATIC_PATHS = new Set([
  '/',
  '/watch',
  '/watch/movies',
  '/watch/series',
  ...(SHORTS_HUB_ENABLED ? ['/watch/shorts'] : []),
  '/read',
  '/read/comics',
]);

function normalizePath(path: string): string {
  const pathname = path.startsWith('http') ? new URL(path).pathname : path.split('?')[0] || '/';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isUnitPath(path: string): boolean {
  const pathname = normalizePath(path);
  return (
    /^\/series\/[^/]+\/episodes\/[^/]+$/.test(pathname) ||
    /^\/shorts\/[^/]+\/episodes\/[^/]+$/.test(pathname) ||
    /^\/comics\/[^/]+\/chapters\/[^/]+$/.test(pathname)
  );
}

export function isCanonicalTitlePath(path: string): boolean {
  const pathname = normalizePath(path);
  return (
    /^\/movies\/[^/]+$/.test(pathname) ||
    /^\/series\/[^/]+$/.test(pathname) ||
    /^\/shorts\/[^/]+$/.test(pathname) ||
    /^\/comics\/[^/]+$/.test(pathname)
  );
}

export function isIndexablePath(path: string): boolean {
  const pathname = normalizePath(path);

  if (NON_INDEXABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  if (isUnitPath(pathname)) {
    return false;
  }

  return INDEXABLE_STATIC_PATHS.has(pathname) || isCanonicalTitlePath(pathname);
}
