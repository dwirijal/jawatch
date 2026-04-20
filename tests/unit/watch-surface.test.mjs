import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveCompactWatchSurfaceSectionOrder,
  resolveCompactWatchSurfaceSections,
  resolveWatchSurfaceLayout,
} from '../../src/lib/watch-surface.ts';

test('series watch layout keeps navigation rail in default mode and hides it in theatrical mode', () => {
  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'series', isTheatrical: false }), {
    kind: 'series',
    effectiveMode: 'default',
    allowModeSwitch: true,
    showRail: true,
    railRole: 'navigation',
  });

  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'series', isTheatrical: true }), {
    kind: 'series',
    effectiveMode: 'theatrical',
    allowModeSwitch: true,
    showRail: false,
    railRole: null,
  });
});

test('movie default mode keeps the related-content rail', () => {
  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'movie', isTheatrical: false }), {
    kind: 'movie',
    effectiveMode: 'default',
    allowModeSwitch: true,
    showRail: true,
    railRole: 'related',
  });
});

test('shorts do not expose default or theatrical watch modes', () => {
  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'shorts', isTheatrical: false }), {
    kind: 'shorts',
    effectiveMode: 'shorts',
    allowModeSwitch: false,
    showRail: false,
    railRole: null,
  });

  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'shorts', isTheatrical: true }), {
    kind: 'shorts',
    effectiveMode: 'shorts',
    allowModeSwitch: false,
    showRail: false,
    railRole: null,
  });
});

test('compact watch surface order prioritizes the body before the rail', () => {
  assert.deepEqual(
    resolveCompactWatchSurfaceSectionOrder({ hasBody: true, hasRail: true }),
    ['stage', 'body', 'rail'],
  );

  assert.deepEqual(
    resolveCompactWatchSurfaceSectionOrder({ hasBody: false, hasRail: true }),
    ['stage', 'rail'],
  );
});

test('compact watch surface sections mark bordered sections after the stage', () => {
  assert.deepEqual(
    resolveCompactWatchSurfaceSections({ hasBody: true, hasRail: true }),
    [
      { id: 'stage', bordered: false },
      { id: 'body', bordered: true },
      { id: 'rail', bordered: true },
    ],
  );
});
