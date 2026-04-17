import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveWatchSurfaceLayout } from '../../src/lib/watch-surface.ts';

test('series default mode keeps the navigation rail', () => {
  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'series', isTheatrical: false }), {
    kind: 'series',
    effectiveMode: 'default',
    allowModeSwitch: true,
    showRail: true,
    railRole: 'navigation',
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

test('theatrical mode removes the rail for movies and series', () => {
  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'movie', isTheatrical: true }), {
    kind: 'movie',
    effectiveMode: 'theatrical',
    allowModeSwitch: true,
    showRail: false,
    railRole: null,
  });

  assert.deepEqual(resolveWatchSurfaceLayout({ kind: 'series', isTheatrical: true }), {
    kind: 'series',
    effectiveMode: 'theatrical',
    allowModeSwitch: true,
    showRail: false,
    railRole: null,
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
