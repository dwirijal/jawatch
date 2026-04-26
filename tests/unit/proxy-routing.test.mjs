import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegacyRedirectUrl,
  buildCanonicalAppRedirectUrl,
  getLegacyAliasRedirectPath,
  getLegacyComicChapterRedirectPath,
  getLegacyRedirectPath,
  isLegacyAppHost,
  isRemovedPublicRoute,
  isScannerPath,
  shouldRefreshSupabaseSession,
} from '../../src/lib/proxy/routing.ts';

test('scanner routing blocks common exploit and dotfile probes', () => {
  assert.equal(isScannerPath('/wp-admin'), true);
  assert.equal(isScannerPath('/.git/config'), true);
  assert.equal(isScannerPath('/nsfw'), true);
  assert.equal(isScannerPath('/.well-known/security.txt'), false);
  assert.equal(isScannerPath('/watch/movies'), false);
});

test('removed public routes cover retired browse aliases', () => {
  assert.equal(isRemovedPublicRoute('/series/genre'), true);
  assert.equal(isRemovedPublicRoute('/series/watch/old-slug'), true);
  assert.equal(isRemovedPublicRoute('/comic/magic-emperor'), true);
  assert.equal(isRemovedPublicRoute('/watch/series'), false);
});

test('session refresh stays limited to auth and vault surfaces', () => {
  assert.equal(shouldRefreshSupabaseSession('/login'), true);
  assert.equal(shouldRefreshSupabaseSession('/vault/history'), true);
  assert.equal(shouldRefreshSupabaseSession('/watch/movies'), false);
});

test('legacy hosts redirect to the canonical app origin', () => {
  assert.equal(isLegacyAppHost('weebs.dwizzy.my.id'), true);
  assert.equal(isLegacyAppHost('jawatch.web.id'), false);
  assert.equal(
    buildCanonicalAppRedirectUrl('/vault', '?tab=watch').toString(),
    'https://jawatch.web.id/vault?tab=watch',
  );
});

test('legacy comic chapter routing is narrow to chapter-like slugs', () => {
  assert.equal(
    getLegacyComicChapterRedirectPath('/comics/eleceed/eleceed-chapter-347'),
    '/comics/eleceed/ch/347',
  );
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/reviews'), null);
});

test('legacy alias redirects rescue removed public routes before 404 handling', () => {
  assert.equal(getLegacyAliasRedirectPath('/comic/magic-emperor'), '/read/comics');
  assert.equal(getLegacyAliasRedirectPath('/manga/magic-emperor'), '/read/comics');
  assert.equal(getLegacyAliasRedirectPath('/movies/latest'), '/watch/movies');
  assert.equal(getLegacyAliasRedirectPath('/series/short'), '/watch');
  assert.equal(getLegacyAliasRedirectPath('/placeholder-poster.jpg'), '/poster-missing-dark.png');
  assert.equal(getLegacyRedirectPath('/comic/magic-emperor'), '/read/comics');
});

test('legacy redirect URL builder preserves request origin and query', () => {
  const url = 'https://jawatch.web.id/comics/eleceed/eleceed-chapter-347?utm_source=ahrefs';
  assert.equal(
    buildLegacyRedirectUrl('/comics/eleceed/ch/347', url).toString(),
    'https://jawatch.web.id/comics/eleceed/ch/347?utm_source=ahrefs',
  );
});
