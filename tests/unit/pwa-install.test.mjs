import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPwaPromptDismissedUntil,
  isPwaPromptAutoShowPath,
  isPwaPromptDismissed,
} from '../../src/lib/pwa.ts';

test('PWA prompt auto-show is limited to high-intent hub routes', () => {
  assert.equal(isPwaPromptAutoShowPath('/watch/movies'), true);
  assert.equal(isPwaPromptAutoShowPath('/watch/series'), true);
  assert.equal(isPwaPromptAutoShowPath('/read/comics'), true);
  assert.equal(isPwaPromptAutoShowPath('/vault'), true);

  assert.equal(isPwaPromptAutoShowPath('/'), false);
  assert.equal(isPwaPromptAutoShowPath('/login'), false);
  assert.equal(isPwaPromptAutoShowPath('/search'), false);
  assert.equal(isPwaPromptAutoShowPath('/movies/the-first-slam-dunk-2022'), false);
});

test('PWA prompt dismissal remains active until the expiry timestamp passes', () => {
  const now = Date.UTC(2026, 3, 20, 10, 0, 0);
  const dismissedUntil = buildPwaPromptDismissedUntil(now);

  assert.equal(isPwaPromptDismissed(String(dismissedUntil), now + 1000), true);
  assert.equal(isPwaPromptDismissed(String(dismissedUntil), dismissedUntil + 1), false);
  assert.equal(isPwaPromptDismissed('not-a-number', now), false);
});
