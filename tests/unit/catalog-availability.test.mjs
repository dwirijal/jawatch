import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveAvailabilityState,
  resolveUnitAvailability,
} from '../../src/lib/catalog/availability.ts';

test('title with live units but missing some data is partial', () => {
  assert.equal(resolveAvailabilityState({ totalUnits: 10, readyUnits: 6, updating: false }), 'partial');
});

test('title with all units ready is ready', () => {
  assert.equal(resolveAvailabilityState({ totalUnits: 3, readyUnits: 3, updating: false }), 'ready');
});

test('title with no consumable units is unavailable unless actively updating', () => {
  assert.equal(resolveAvailabilityState({ totalUnits: 3, readyUnits: 0, updating: false }), 'unavailable');
  assert.equal(resolveAvailabilityState({ totalUnits: 3, readyUnits: 0, updating: true }), 'updating');
});

test('unit readiness is explicit for streams and pages', () => {
  assert.equal(resolveUnitAvailability({ hasStreams: true }), 'ready');
  assert.equal(resolveUnitAvailability({ hasPages: true }), 'ready');
  assert.equal(resolveUnitAvailability({}), 'unavailable');
});
