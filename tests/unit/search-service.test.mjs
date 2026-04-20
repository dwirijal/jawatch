import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeSearchDocuments } from '../../src/lib/search/search-merge.ts';

function createDoc(overrides = {}) {
  return {
    id: 'doc-1',
    slug: 'doc-1',
    href: '/series/doc-1',
    title: 'Doc 1',
    image: '/doc-1.jpg',
    routeType: 'series',
    theme: 'anime',
    ...overrides,
  };
}

test('search merge appends unique fallback documents when indexed results are short', () => {
  const merged = mergeSearchDocuments(
    [createDoc({ id: 'series:naruto', slug: 'naruto', href: '/series/naruto', title: 'Naruto' })],
    [createDoc({ id: 'movies:naruto-the-last', slug: 'naruto-the-last', href: '/movies/naruto-the-last', title: 'The Last: Naruto the Movie', routeType: 'movies', theme: 'movie' })],
    6,
  );

  assert.deepEqual(merged.map((item) => item.id), ['series:naruto', 'movies:naruto-the-last']);
});

test('search merge prefers fallback hrefs for same-title documents so stale indexed routes can self-heal', () => {
  const merged = mergeSearchDocuments(
    [createDoc({
      id: 'movies:stale-first-slam-dunk',
      slug: 'the-first-slam-dunk',
      href: '/movies/the-first-slam-dunk',
      title: 'The First Slam Dunk',
      routeType: 'movies',
      theme: 'movie',
    })],
    [createDoc({
      id: 'movies:the-first-slam-dunk-2022',
      slug: 'the-first-slam-dunk-2022',
      href: '/movies/the-first-slam-dunk-2022',
      title: 'The First Slam Dunk',
      routeType: 'movies',
      theme: 'movie',
    })],
    6,
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.href, '/movies/the-first-slam-dunk-2022');
});
