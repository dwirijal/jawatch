import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComicChapterFallbackHref,
  buildComicChapterHref,
  buildComicChapterSlugFromNumber,
  extractComicChapterNumber,
} from '../../src/lib/comic-chapter-paths.ts';

test('extractComicChapterNumber reads numeric chapter values from slugs and labels', () => {
  assert.equal(extractComicChapterNumber('lookism-chapter-532'), '532');
  assert.equal(extractComicChapterNumber('chapter-10.5'), '10.5');
  assert.equal(extractComicChapterNumber('magic-emperor-chapter-164-5'), '164-5');
  assert.equal(extractComicChapterNumber('tensei-chapter-tensei-chapter-20.455974'), '20.455974');
  assert.equal(extractComicChapterNumber('special-side-story'), null);
});

test('buildComicChapterHref prefers explicit number and falls back to chapter slug routes', () => {
  assert.equal(
    buildComicChapterHref('lookism', { slug: 'lookism-chapter-532' }),
    '/comics/lookism/ch/532',
  );
  assert.equal(
    buildComicChapterHref('lookism', { number: 533, slug: 'stale-slug' }),
    '/comics/lookism/ch/533',
  );
  assert.equal(
    buildComicChapterHref('lookism', { slug: 'special-side-story' }),
    '/comics/lookism/chapter/special-side-story',
  );
});

test('buildComicChapterFallbackHref and numeric slug helper stay deterministic', () => {
  assert.equal(
    buildComicChapterFallbackHref('lookism', 'special-side-story'),
    '/comics/lookism/chapter/special-side-story',
  );
  assert.equal(buildComicChapterSlugFromNumber('lookism', '532'), 'lookism-chapter-532');
  assert.equal(buildComicChapterSlugFromNumber('lookism', ' 10.5 '), 'lookism-chapter-10.5');
});
