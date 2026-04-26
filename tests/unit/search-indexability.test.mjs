import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
  assert.equal(isUnitPath('/series/one-piece/ep/1'), true);
  assert.equal(isUnitPath('/series/one-piece/special/episode-nagi'), true);
  assert.equal(isUnitPath('/series/one-piece/episodes/episode-1'), true);
  assert.equal(isUnitPath('/comics/title/ch/1'), true);
  assert.equal(isUnitPath('/comics/title/chapter/special-side-story'), true);
  assert.equal(isIndexablePath('/comics/title/chapters/chapter-1'), false);
  assert.equal(isIndexablePath('/comics/title/ch/1'), false);
});

test('comic reader route files expose canonical numeric and fallback chapter routes', () => {
  const canonicalRoute = fs.readFileSync(new URL('../../src/app/(public)/comics/[slug]/ch/[chapterNumber]/page.tsx', import.meta.url), 'utf8');
  const fallbackRoute = fs.readFileSync(new URL('../../src/app/(public)/comics/[slug]/chapter/[chapterSlug]/page.tsx', import.meta.url), 'utf8');

  assert.match(canonicalRoute, /ComicChapterPage/);
  assert.match(fallbackRoute, /ComicChapterPage/);
});

test('robots disallows non-indexable unit routes while keeping title routes crawlable', () => {
  const robotsSource = fs.readFileSync(new URL('../../src/app/robots.ts', import.meta.url), 'utf8');

  assert.match(robotsSource, /"\/comics\/\*\/chapters\/\*"/);
  assert.match(robotsSource, /"\/comics\/\*\/ch\/\*"/);
  assert.match(robotsSource, /"\/comics\/\*\/chapter\/\*"/);
  assert.match(robotsSource, /"\/series\/\*\/episodes\/\*"/);
  assert.match(robotsSource, /"\/series\/\*\/ep\/\*"/);
  assert.match(robotsSource, /"\/series\/\*\/special\/\*"/);
  assert.doesNotMatch(robotsSource, /"\/comics\/\*"/);
  assert.doesNotMatch(robotsSource, /"\/series\/\*"/);
  assert.doesNotMatch(robotsSource, /"\/movies\/\*"/);
});

test('account and admin surfaces are not indexable', () => {
  assert.equal(isIndexablePath('/vault/saved'), false);
  assert.equal(isIndexablePath('/admin/titles'), false);
  assert.equal(isIndexablePath('/login'), false);
});
