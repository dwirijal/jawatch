import assert from 'node:assert/strict';
import test from 'node:test';

const guards = await import('../../src/lib/canonical-route-guards.ts');

test('movie route guard blocks legacy browse aliases from dynamic detail route', () => {
  assert.equal(guards.isReservedMovieSlug('latest'), true);
  assert.equal(guards.isReservedMovieSlug('popular'), true);
  assert.equal(guards.isReservedMovieSlug('watch'), true);
  assert.equal(guards.isReservedMovieSlug('inception'), false);
});

test('series route guard blocks removed IA folders from dynamic detail route', () => {
  assert.equal(guards.isReservedSeriesSlug('short'), true);
  assert.equal(guards.isReservedSeriesSlug('anime'), true);
  assert.equal(guards.isReservedSeriesSlug('donghua'), true);
  assert.equal(guards.isReservedSeriesSlug('watch'), true);
  assert.equal(guards.isReservedSeriesSlug('one-piece'), false);
});

test('comic route guard blocks old subtype browse aliases from dynamic detail route', () => {
  assert.equal(guards.isReservedComicSlug('manga'), true);
  assert.equal(guards.isReservedComicSlug('manhwa'), true);
  assert.equal(guards.isReservedComicSlug('manhua'), true);
  assert.equal(guards.isReservedComicSlug('magic-emperor'), false);
});
