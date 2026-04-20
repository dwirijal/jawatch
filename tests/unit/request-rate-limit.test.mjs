import test from 'node:test';
import assert from 'node:assert/strict';

import {
  incrementLocalRateLimitCounter,
  resetLocalRateLimitMemoryForTests,
} from '../../src/lib/server/request-rate-limit-local.ts';

test('rate limit falls back to per-instance memory when Redis is unavailable', async () => {
  resetLocalRateLimitMemoryForTests();

  const originalNow = Date.now;
  Date.now = () => Date.parse('2026-04-20T12:00:00.000Z');

  try {
    const key = 'comic:ratelimit:api-search-unified:123:abc';
    const ttlSeconds = 65;

    assert.equal(incrementLocalRateLimitCounter(key, ttlSeconds), 1);
    assert.equal(incrementLocalRateLimitCounter(key, ttlSeconds), 2);
    assert.equal(incrementLocalRateLimitCounter(key, ttlSeconds), 3);
  } finally {
    Date.now = originalNow;
    resetLocalRateLimitMemoryForTests();
  }
});
