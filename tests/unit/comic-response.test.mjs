import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeComicListPayload,
  normalizeComicSearchPayload,
} from '../../src/lib/adapters/comic-response.ts';

const sampleComic = {
  slug: 'solo-leveling',
  title: 'Solo Leveling',
  image: 'https://example.com/solo-leveling.jpg',
};

test('normalizes stale nested comic list payloads from shared cache', () => {
  assert.deepEqual(
    normalizeComicListPayload({
      comics: {
        comics: [sampleComic],
      },
    }),
    { comics: [sampleComic] },
  );
});

test('normalizes raw comic arrays from direct database loaders', () => {
  assert.deepEqual(
    normalizeComicListPayload([sampleComic]),
    { comics: [sampleComic] },
  );
});

test('normalizes comic search payloads from both wrapped and raw responses', () => {
  assert.deepEqual(
    normalizeComicSearchPayload({
      data: {
        data: [sampleComic],
      },
    }),
    { data: [sampleComic] },
  );

  assert.deepEqual(
    normalizeComicSearchPayload([sampleComic]),
    { data: [sampleComic] },
  );
});
