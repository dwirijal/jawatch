import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveResumeTarget } from '../../src/lib/catalog/resume.ts';

test('resume falls to nearest viable unit when last unit is unavailable', () => {
  const target = resolveResumeTarget({
    lastUnitId: 'ep-2',
    units: [
      { id: 'ep-2', availability: 'unavailable' },
      { id: 'ep-3', availability: 'ready' },
    ],
  });

  assert.equal(target?.id, 'ep-3');
});

test('resume keeps the last unit when it is still consumable', () => {
  const target = resolveResumeTarget({
    lastUnitId: 'ep-2',
    units: [
      { id: 'ep-1', availability: 'ready' },
      { id: 'ep-2', availability: 'partial' },
      { id: 'ep-3', availability: 'ready' },
    ],
  });

  assert.equal(target?.id, 'ep-2');
});

test('resume falls back to earlier viable unit when no later unit exists', () => {
  const target = resolveResumeTarget({
    lastUnitId: 'ep-3',
    units: [
      { id: 'ep-1', availability: 'ready' },
      { id: 'ep-2', availability: 'unavailable' },
      { id: 'ep-3', availability: 'unavailable' },
    ],
  });

  assert.equal(target?.id, 'ep-1');
});
