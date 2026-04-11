import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeriesDetailRequestCache } from '../../src/app/series/[slug]/series-detail-data.ts';

test('dedupes in-flight and repeated lookups for the same slug', async () => {
  let calls = 0;
  const loader = createSeriesDetailRequestCache(async (slug) => {
    calls += 1;
    return { slug, calls };
  });

  const [first, second, third] = await Promise.all([
    loader('solo-leveling'),
    loader('solo-leveling'),
    loader('solo-leveling'),
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test('does not mix cached results across slugs', async () => {
  let calls = 0;
  const loader = createSeriesDetailRequestCache(async (slug) => {
    calls += 1;
    return { slug };
  });

  const [left, right] = await Promise.all([
    loader('frieren'),
    loader('orb-on-the-movements-of-the-earth'),
  ]);

  assert.equal(calls, 2);
  assert.deepEqual(left, { slug: 'frieren' });
  assert.deepEqual(right, { slug: 'orb-on-the-movements-of-the-earth' });
});

test('does not mix in-flight cache across visibility modes for the same slug', async () => {
  let calls = 0;
  const loader = createSeriesDetailRequestCache(async (slug, options = {}) => {
    calls += 1;
    return { slug, includeNsfw: options.includeNsfw === true };
  });

  const [publicResult, authResult] = await Promise.all([
    loader('solo-leveling', { includeNsfw: false }),
    loader('solo-leveling', { includeNsfw: true }),
  ]);

  assert.equal(calls, 2);
  assert.deepEqual(publicResult, { slug: 'solo-leveling', includeNsfw: false });
  assert.deepEqual(authResult, { slug: 'solo-leveling', includeNsfw: true });
});
