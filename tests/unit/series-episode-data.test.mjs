import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSeriesEpisodeRailState,
} from '../../src/lib/adapters/series-episode-playlist.ts';
import {
  createSeriesEpisodeRequestCache,
} from '../../src/domains/series/server/series-episode-data.ts';

test('series episode request cache dedupes repeated lookups for the same slug and visibility', async () => {
  let calls = 0;
  const loader = createSeriesEpisodeRequestCache(async (slug, options = {}) => {
    calls += 1;
    return { slug, includeNsfw: options.includeNsfw === true };
  });

  const [first, second] = await Promise.all([
    loader('frieren-episode-12', { includeNsfw: false }),
    loader('frieren-episode-12', { includeNsfw: false }),
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, { slug: 'frieren-episode-12', includeNsfw: false });
  assert.deepEqual(second, first);
});

test('series episode rail state keeps total count but only exposes a focused window', () => {
  const rows = Array.from({ length: 20 }, (_, index) => ({
    canonical_unit_key: `unit-${index + 1}`,
    label: `Episode ${20 - index}`,
    title: `Episode ${20 - index}`,
    number: 20 - index,
  }));

  const state = buildSeriesEpisodeRailState({
    entries: rows,
    currentCanonicalUnitKey: 'unit-10',
    seriesSlug: 'solo-leveling',
    radius: 2,
  });

  assert.equal(state.playlistTotal, 20);
  assert.deepEqual(state.playlist.map((entry) => entry.number), [13, 12, 11, 10, 9]);
  assert.deepEqual(state.playlist.map((entry) => entry.href), [
    '/series/solo-leveling/ep/13',
    '/series/solo-leveling/ep/12',
    '/series/solo-leveling/ep/11',
    '/series/solo-leveling/ep/10',
    '/series/solo-leveling/ep/9',
  ]);
  assert.equal(state.prevEpisodeHref, '/series/solo-leveling/ep/10');
  assert.equal(state.nextEpisodeHref, '/series/solo-leveling/ep/12');
  assert.equal(state.prevEpisodeSlug, 'solo-leveling-episode-10');
  assert.equal(state.nextEpisodeSlug, 'solo-leveling-episode-12');
});
