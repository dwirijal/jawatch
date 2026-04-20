import test from 'node:test';
import assert from 'node:assert/strict';

import {
  executePlannedSearchFallback,
  planUnifiedSearchFallbackPhases,
} from '../../src/lib/search/search-fallback-plan.ts';
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

test('fallback planning prioritizes missing domains before covered domains for all-domain search', () => {
  const phases = planUnifiedSearchFallbackPhases({
    domain: 'all',
    limit: 6,
    indexedDocuments: [
      createDoc({ id: 'series:naruto', routeType: 'series' }),
      createDoc({ id: 'movies:suzume', routeType: 'movies', theme: 'movie' }),
    ],
  });

  assert.deepEqual(phases, [
    { routeTypes: ['comic'], limit: 4 },
    { routeTypes: ['series', 'movies'], limit: 4 },
  ]);
});

test('fallback execution stops before covered-domain queries once missing domains fill the remaining slots', async () => {
  const calls = [];
  const results = await executePlannedSearchFallback({
    phases: [
      { routeTypes: ['comic'], limit: 2 },
      { routeTypes: ['series', 'movies'], limit: 2 },
    ],
    targetCount: 2,
    runSearch: async (routeType, limit) => {
      calls.push(`${routeType}:${limit}`);

      if (routeType === 'comic') {
        return [
          createDoc({ id: 'comic:one-piece', routeType: 'comic', theme: 'manga', href: '/comics/one-piece' }),
          createDoc({ id: 'comic:kingdom', routeType: 'comic', theme: 'manga', href: '/comics/kingdom' }),
        ];
      }

      return [createDoc({ id: `${routeType}:unused`, routeType, theme: routeType === 'movies' ? 'movie' : 'anime' })];
    },
  });

  assert.deepEqual(calls, ['comic:2']);
  assert.deepEqual(results.map((item) => item.id), ['comic:one-piece', 'comic:kingdom']);
});

test('fallback execution re-queries covered domains only for the remaining slots after missing-domain search', async () => {
  const calls = [];
  const results = await executePlannedSearchFallback({
    phases: [
      { routeTypes: ['comic'], limit: 2 },
      { routeTypes: ['series', 'movies'], limit: 2 },
    ],
    targetCount: 2,
    runSearch: async (routeType, limit) => {
      calls.push(`${routeType}:${limit}`);

      if (routeType === 'comic') {
        return [createDoc({ id: 'comic:vagabond', routeType: 'comic', theme: 'manga', href: '/comics/vagabond' })];
      }

      if (routeType === 'series') {
        return [createDoc({ id: 'series:frieren', routeType: 'series', href: '/series/frieren' })];
      }

      return [createDoc({ id: 'movies:unused', routeType: 'movies', theme: 'movie', href: '/movies/unused' })];
    },
  });

  assert.deepEqual(calls, ['comic:2', 'series:1', 'movies:1']);
  assert.deepEqual(results.map((item) => item.id), ['comic:vagabond', 'series:frieren']);
});
