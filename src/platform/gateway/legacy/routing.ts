import {
  buildComicChapterHref,
  extractComicChapterNumber,
} from '../../../lib/comic-chapter-paths.ts';

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
  '/movies',
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

const LEGACY_EXACT_REDIRECTS = new Map<string, string>([
  ['/collection', '/vault'],
  ['/comic', '/read/comics'],
  ['/drachin', '/watch'],
  ['/dramabox', '/watch'],
  ['/manga', '/read/comics'],
  ['/manhua', '/read/comics'],
  ['/manhwa', '/read/comics'],
  ['/movies', '/watch/movies'],
  ['/movies/latest', '/watch/movies'],
  ['/movies/popular', '/watch/movies'],
  ['/movies/watch', '/watch/movies'],
  ['/novel', '/read'],
  ['/placeholder-poster.jpg', '/poster-missing-dark.png'],
  ['/series/anime', '/watch/series'],
  ['/series/country', '/watch/series'],
  ['/series/donghua', '/watch/series'],
  ['/series/drachin', '/watch/series'],
  ['/series/drama', '/watch/series'],
  ['/series/episode', '/watch/series'],
  ['/series/genre', '/watch/series'],
  ['/series/list', '/watch/series'],
  ['/series/ongoing', '/watch/series'],
  ['/series/short', '/watch'],
  ['/series/watch', '/watch/series'],
  ['/series/year', '/watch/series'],
]);

const LEGACY_COMIC_PREFIXES = ['/comic/', '/manga/', '/manhua/', '/manhwa/'];
const LEGACY_SERIES_BROWSE_PREFIXES = [
  '/series/anime/',
  '/series/country/',
  '/series/donghua/',
  '/series/drachin/',
  '/series/drama/',
  '/series/episode/',
  '/series/genre/',
  '/series/list/',
  '/series/ongoing/',
  '/series/year/',
];
const LEGACY_SHORT_PREFIXES = ['/series/short/', '/drachin/', '/dramabox/'];

const SESSION_REFRESH_PREFIXES = ['/account/', '/auth/', '/logout/', '/vault/'];
const SESSION_REFRESH_EXACT_PATHS = new Set(['/account', '/auth', '/login', '/logout', '/vault']);
const LEGACY_COMIC_CHAPTER_ROUTE = /^\/comics\/([^/]+)\/([^/]+)\/?$/;
const LEGACY_COMIC_CHAPTERS_ROUTE = /^\/comics\/([^/]+)\/chapters\/([^/]+)\/?$/;
const LEGACY_SERIES_EPISODE_ROUTE = /^\/series\/([^/]+)\/episodes\/([^/]+)\/?$/;
const LEGACY_SERIES_WATCH_EPISODE_ROUTE = /^\/series\/watch\/([^/]+)\/([^/]+)\/?$/;
const LEGACY_SERIES_WATCH_SLUG_ROUTE = /^\/series\/watch\/([^/]+)\/?$/;
const LEGACY_NUMBERED_EPISODE_SLUG = /(?:^|[-/])(?:episode|ep)-(\d+(?:\.\d+)?)$/i;
const LEGACY_NUMBERED_EPISODE_WITH_TITLE_SLUG = /^(.+)-(?:episode|ep)-(\d+(?:\.\d+)?)$/i;

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

export function getLegacyComicChapterRedirectPath(pathname: string): string | null {
  const chaptersMatch = pathname.match(LEGACY_COMIC_CHAPTERS_ROUTE);
  if (chaptersMatch) {
    const [, comicSlug, chapterSlug] = chaptersMatch;
    return buildComicChapterHref(comicSlug, { slug: chapterSlug });
  }

  const legacyMatch = pathname.match(LEGACY_COMIC_CHAPTER_ROUTE);
  if (!legacyMatch) {
    return null;
  }

  const [, comicSlug, chapterSlug] = legacyMatch;
  return extractComicChapterNumber(chapterSlug)
    ? buildComicChapterHref(comicSlug, { slug: chapterSlug })
    : null;
}

export function getLegacySeriesEpisodeRedirectPath(pathname: string): string | null {
  const match = pathname.match(LEGACY_SERIES_EPISODE_ROUTE);
  if (!match) {
    return null;
  }

  const [, seriesSlug, episodeSlug] = match;
  return buildLegacySeriesEpisodeRedirectPath(seriesSlug, episodeSlug);
}

function buildLegacySeriesEpisodeRedirectPath(seriesSlug: string, episodeSlug: string): string {
  const numberedMatch = episodeSlug.match(LEGACY_NUMBERED_EPISODE_SLUG);
  if (numberedMatch) {
    return `/series/${seriesSlug}/ep/${numberedMatch[1]}`;
  }

  const seriesPrefix = `${seriesSlug}-`;
  const specialSlug = episodeSlug.startsWith(seriesPrefix)
    ? episodeSlug.slice(seriesPrefix.length)
    : episodeSlug;

  return `/series/${seriesSlug}/special/${specialSlug || 'special'}`;
}

export function getLegacyAliasRedirectPath(pathname: string): string | null {
  const exactRedirect = LEGACY_EXACT_REDIRECTS.get(pathname);
  if (exactRedirect) {
    return exactRedirect;
  }

  for (const prefix of LEGACY_COMIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return '/read/comics';
    }
  }

  if (pathname.startsWith('/movies/watch/')) {
    const slug = pathname.slice('/movies/watch/'.length).replace(/\/+$/, '');
    return slug ? `/movies/${slug}` : '/watch/movies';
  }

  const legacySeriesWatchEpisodeMatch = pathname.match(LEGACY_SERIES_WATCH_EPISODE_ROUTE);
  if (legacySeriesWatchEpisodeMatch) {
    const [, seriesSlug, episodeSlug] = legacySeriesWatchEpisodeMatch;
    return buildLegacySeriesEpisodeRedirectPath(seriesSlug, episodeSlug);
  }

  const legacySeriesWatchSlugMatch = pathname.match(LEGACY_SERIES_WATCH_SLUG_ROUTE);
  if (legacySeriesWatchSlugMatch) {
    const [, episodeSlug] = legacySeriesWatchSlugMatch;
    const numberedMatch = episodeSlug.match(LEGACY_NUMBERED_EPISODE_WITH_TITLE_SLUG);
    return numberedMatch ? `/series/${numberedMatch[1]}/ep/${numberedMatch[2]}` : '/watch/series';
  }

  for (const prefix of LEGACY_SHORT_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      const parts = pathname.slice(prefix.length).split('/').filter(Boolean);
      if (parts.length >= 3 && parts[1] === 'episodes') {
        return `/shorts/${parts[0]}/episodes/${parts[2]}`;
      }

      if (parts.length >= 2) {
        return `/shorts/${parts[0]}/episodes/${parts[parts.length - 1]}`;
      }

      return parts[0] ? `/shorts/${parts[0]}` : '/watch';
    }
  }

  if (LEGACY_SERIES_BROWSE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return '/watch/series';
  }

  if (pathname.startsWith('/collection/')) {
    return '/vault';
  }

  if (pathname.startsWith('/novel/')) {
    return '/read';
  }

  return null;
}

export function getLegacyRedirectPath(pathname: string): string | null {
  return (
    getLegacySeriesEpisodeRedirectPath(pathname) ??
    getLegacyComicChapterRedirectPath(pathname) ??
    getLegacyAliasRedirectPath(pathname)
  );
}

function applyRedirectPath(url: URL, redirectPath: string) {
  const redirectUrl = new URL(redirectPath, url.origin);
  url.pathname = redirectUrl.pathname;
  url.hash = redirectUrl.hash;

  if (redirectUrl.search) {
    url.search = redirectUrl.search;
  }
}

export function buildLegacyRedirectUrl(redirectPath: string, requestUrl: string) {
  const url = new URL(requestUrl);
  applyRedirectPath(url, redirectPath);
  return url;
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
