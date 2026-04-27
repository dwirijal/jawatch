import test from 'node:test';
import assert from 'node:assert/strict';

import {
  expandSeriesSearchTerms,
  shouldAllowPublicSeriesSearch,
} from '../../src/lib/search/series-query-aliases.ts';

test('series search expands tensura to the canonical slime title', () => {
  assert.deepEqual(expandSeriesSearchTerms('tensura'), [
    'tensura',
    'Tensei shitara Slime Datta Ken',
  ]);
});

test('series search expands frieren and mob shorthand aliases without duplicates', () => {
  assert.deepEqual(expandSeriesSearchTerms('Frieren mob 100'), [
    'Frieren mob 100',
    'Sousou no Frieren',
    'Mob Psycho 100',
  ]);
});

test('series search expands ngnl to no game no life once', () => {
  assert.deepEqual(expandSeriesSearchTerms('ngnl no game no life'), [
    'ngnl no game no life',
    'No Game No Life',
  ]);
});

test('public series search override only applies to approved exact queries', () => {
  assert.equal(shouldAllowPublicSeriesSearch('No Game No Life'), true);
  assert.equal(shouldAllowPublicSeriesSearch('ngnl'), true);
  assert.equal(shouldAllowPublicSeriesSearch('no game'), false);
});
