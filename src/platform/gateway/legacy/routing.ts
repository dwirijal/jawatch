const CANONICAL_APP_ORIGIN = 'https://jawatch.web.id';
const LEGACY_APP_HOSTS = new Set(['weebs.dwizzy.my.id', 'weeb.dwizzy.my.id']);

const BLOCKED_EXACT_PATHS = new Set([
  '/@vite/env',
  '/api/gql',
  '/api/graphql',
  '/graphql',
  '/graphql/api',
  '/login.action',
  '/server',
  '/server-status',
  '/swagger-ui.html',
  '/swagger.json',
  '/trace.axd',
  '/v2/_catalog',
  '/v2/api-docs',
  '/v3/api-docs',
]);

const BLOCKED_PREFIXES = ['/api-docs/', '/debug/', '/nsfw/', '/ecp/', '/swagger/', '/webjars/'];

const REMOVED_PUBLIC_EXACT_PATHS = new Set([
  '/collection',
  '/comic',
  '/drachin',
  '/dramabox',
  '/manga',
  '/manhua',
  '/manhwa',
  '/movies/latest',
  '/movies/popular',
  '/movies/watch',
  '/novel',
  '/series/anime',
  '/series/country',
  '/series/donghua',
  '/series/drachin',
  '/series/drama',
  '/series/episode',
  '/series/genre',
  '/series/list',
  '/series/ongoing',
  '/series/short',
  '/series/watch',
  '/series/year',
]);

const REMOVED_PUBLIC_PREFIXES = [
  '/collection/',
  '/comic/',
  '/drachin/',
  '/dramabox/',
  '/manga/',
  '/manhua/',
  '/manhwa/',
  '/movies/watch/',
  '/novel/',
  '/series/anime/',
  '/series/country/',
  '/series/donghua/',
  '/series/drachin/',
  '/series/drama/',
  '/series/episode/',
  '/series/genre/',
  '/series/list/',
  '/series/ongoing/',
  '/series/short/',
  '/series/watch/',
  '/series/year/',
];

const SESSION_REFRESH_PREFIXES = ['/account/', '/auth/', '/logout/', '/vault/'];
const SESSION_REFRESH_EXACT_PATHS = new Set(['/account', '/auth', '/login', '/logout', '/vault']);

export function buildCanonicalAppRedirectUrl(pathname: string, search: string) {
  return new URL(`${pathname}${search}`, CANONICAL_APP_ORIGIN);
}

export function isLegacyAppHost(hostname: string) {
  return LEGACY_APP_HOSTS.has(hostname);
}

export function shouldRefreshSupabaseSession(pathname: string) {
  if (SESSION_REFRESH_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return SESSION_REFRESH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isScannerPath(pathname: string) {
  if (pathname.startsWith('/.') && !pathname.startsWith('/.well-known/')) {
    return true;
  }

  if (BLOCKED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  if (pathname === '/nsfw') {
    return true;
  }

  if (pathname === '/wp' || pathname.startsWith('/wp-') || pathname.startsWith('/wp/')) {
    return true;
  }

  if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

export function isRemovedPublicRoute(pathname: string) {
  return (
    REMOVED_PUBLIC_EXACT_PATHS.has(pathname) ||
    REMOVED_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
