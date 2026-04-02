import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAdSectionRenderState,
  normalizeAdSectionSlotCount,
} from '../../src/lib/ad-section-visibility.ts';

test('defaults ad sections to two slots', () => {
  assert.equal(normalizeAdSectionSlotCount(), 2);
  assert.equal(normalizeAdSectionSlotCount(1), 1);
  assert.equal(normalizeAdSectionSlotCount(2), 2);
  assert.equal(normalizeAdSectionSlotCount(99), 2);
});

test('keeps section mounted while slots are still pending', () => {
  assert.deepEqual(getAdSectionRenderState(['pending', 'hidden']), {
    visible: false,
    settled: false,
    readyCount: 0,
    hiddenCount: 1,
  });
});

test('shows the section once any slot is ready', () => {
  assert.deepEqual(getAdSectionRenderState(['ready', 'hidden']), {
    visible: true,
    settled: true,
    readyCount: 1,
    hiddenCount: 1,
  });
});

test('hides the section when every slot is hidden', () => {
  assert.deepEqual(getAdSectionRenderState(['hidden', 'hidden']), {
    visible: false,
    settled: true,
    readyCount: 0,
    hiddenCount: 2,
  });
});
