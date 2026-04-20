import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeContinueHistory } from '../../src/lib/home-ia.ts';

test('continue history summary marks returning users with watch and read lanes separately', () => {
  assert.deepEqual(
    summarizeContinueHistory([
      { id: 'movie-1', type: 'movie' },
      { id: 'comic-1', type: 'manga' },
    ]),
    {
      hasAny: true,
      hasWatch: true,
      hasRead: true,
    },
  );
});

test('continue history summary stays empty for guests without usable history', () => {
  assert.deepEqual(summarizeContinueHistory([]), {
    hasAny: false,
    hasWatch: false,
    hasRead: false,
  });
});
