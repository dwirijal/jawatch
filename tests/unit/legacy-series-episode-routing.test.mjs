import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLegacySeriesEpisodeRedirectPath,
} from '../../src/platform/gateway/legacy/routing.ts';

test('legacy numbered series episode routes redirect to compact ep route', () => {
  assert.equal(
    getLegacySeriesEpisodeRedirectPath('/series/one-piece/episodes/one-piece-episode-1157'),
    '/series/one-piece/ep/1157',
  );
});

test('legacy non-numbered series episode routes redirect to special route', () => {
  assert.equal(
    getLegacySeriesEpisodeRedirectPath('/series/blue-lock/episodes/blue-lock-episode-nagi'),
    '/series/blue-lock/special/episode-nagi',
  );
});

test('non-legacy series routes are not rewritten by legacy episode routing', () => {
  assert.equal(getLegacySeriesEpisodeRedirectPath('/series/one-piece/ep/1157'), null);
  assert.equal(getLegacySeriesEpisodeRedirectPath('/series/one-piece'), null);
});
