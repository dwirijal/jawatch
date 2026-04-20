import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalAppRedirectUrl,
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
