import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSeriesAliasSearchQuery,
  buildSeriesAliasSearchQueries,
  pickPreferredSeriesRouteCandidate,
  resolveKnownSeriesRouteAlias,
  sharesSeriesRouteFamily,
} from '../../src/lib/adapters/series-route-alias.ts';

test('series route alias strips volatile hash suffixes for search queries', () => {
  assert.equal(
    buildSeriesAliasSearchQuery('dr-stone-science-future-cdc1accf'),
    'dr stone science future',
  );
});

test('series route alias expands science future queries to canonical season queries', () => {
  assert.deepEqual(
    buildSeriesAliasSearchQueries('dr-stone-science-future-cdc1accf'),
    [
      'dr stone science future',
      'dr stone',
      'dr stone season 4',
      'dr stone season 4 part 1',
    ],
  );
});

test('series route alias treats hash and part siblings as the same family', () => {
  assert.equal(
    sharesSeriesRouteFamily('dr-stone-science-future-cdc1accf', 'dr-stone-science-future-part-2'),
    true,
  );
});

test('series route alias prefers the stable canonical slug over a volatile sibling', () => {
  const candidate = pickPreferredSeriesRouteCandidate('dr-stone-science-future-cdc1accf', [
    { slug: 'dr-stone-science-future-cdc1accf', title: 'Dr. Stone: Science Future' },
    { slug: 'dr-stone-science-future', title: 'Dr. Stone Season 4 Part 1' },
  ]);

  assert.equal(candidate?.slug, 'dr-stone-science-future');
});

test('series route alias directly maps legacy science future slugs to season 4 canonicals', () => {
  assert.equal(
    resolveKnownSeriesRouteAlias('dr-stone-science-future-cdc1accf'),
    'dr-stone-season-4-part-1',
  );
  assert.equal(
    resolveKnownSeriesRouteAlias('dr-stone-science-future-part-3'),
    'dr-stone-season-4-part-3',
  );
});

test('series route alias maps science future aliases to season 4 parts', () => {
  const candidate = pickPreferredSeriesRouteCandidate('dr-stone-science-future-part-3', [
    { slug: 'dr-stone-season-4-part-1', title: 'Dr. Stone Season 4 Part 1' },
    { slug: 'dr-stone-season-4-part-2', title: 'Dr. Stone Season 4 Part 2' },
    { slug: 'dr-stone-season-4-part-3', title: 'Dr. Stone Season 4 Part 3' },
  ]);

  assert.equal(candidate?.slug, 'dr-stone-season-4-part-3');
});
