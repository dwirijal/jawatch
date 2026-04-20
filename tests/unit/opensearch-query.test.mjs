import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFuzzySearchRequestBody,
  buildPrimarySearchRequestBody,
  normalizeSearchSlugCandidate,
} from '../../src/lib/search/opensearch-query.ts';

test('slug candidate normalization matches title-like search input', () => {
  assert.equal(
    normalizeSearchSlugCandidate('  Dr. Stone Season 4 Part 2  '),
    'dr-stone-season-4-part-2',
  );
});

test('primary OpenSearch body prefers exact and prefix title matches without fuzzy clause', () => {
  const body = buildPrimarySearchRequestBody({
    query: 'dr stone season 4 part 2',
    domain: 'all',
    limit: 6,
  });

  assert.equal(body.size, 18);
  assert.deepEqual(body.query.bool.filter, []);
  assert.equal(body.query.bool.should[0].prefix.slug.value, 'dr-stone-season-4-part-2');
  assert.equal(body.query.bool.should[1].term.title_exact.value, 'dr stone season 4 part 2');
  assert.equal(body.query.bool.should.some((clause) => clause.multi_match?.fuzziness === 'AUTO'), false);
});

test('fuzzy OpenSearch fallback body keeps route filter and fuzzy title search', () => {
  const body = buildFuzzySearchRequestBody({
    query: 'dr ston season 4 part 2',
    domain: 'series',
    limit: 4,
  });

  assert.equal(body.size, 8);
  assert.deepEqual(body.query.bool.filter, [{ term: { route_type: 'series' } }]);
  assert.equal(body.query.bool.should[0].multi_match.fuzziness, 'AUTO');
  assert.deepEqual(body.query.bool.should[0].multi_match.fields, ['title^4', 'subtitle^2', 'meta_line', 'keywords^2']);
});
