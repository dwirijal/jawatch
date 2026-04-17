import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isCanonicalTitlePath,
  isIndexablePath,
  isUnitPath,
} from '../../src/lib/search/search-indexability.ts';

test('search page is not indexable', () => {
  assert.equal(isIndexablePath('/search?q=one-piece'), false);
});

test('canonical title pages are indexable', () => {
  assert.equal(isIndexablePath('/series/one-piece'), true);
  assert.equal(isCanonicalTitlePath('/movies/sharp-corner-2025'), true);
});

test('unit pages are not indexable by default', () => {
  assert.equal(isUnitPath('/series/one-piece/episodes/episode-1'), true);
  assert.equal(isIndexablePath('/comics/title/chapters/chapter-1'), false);
});

test('account and admin surfaces are not indexable', () => {
  assert.equal(isIndexablePath('/vault/saved'), false);
  assert.equal(isIndexablePath('/admin/titles'), false);
  assert.equal(isIndexablePath('/login'), false);
});
