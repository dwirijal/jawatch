import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildVerticalDramaDramaboxHref,
  buildVerticalDramaStoryHref,
  buildVerticalDramaWatchHref,
  getDrachinPlaybackTarget,
} from '../../src/lib/vertical-drama-store.ts';

test('vertical drama watch href defaults to the canonical short-series route', () => {
  assert.equal(
    buildVerticalDramaWatchHref('moon-and-dust'),
    '/series/short/watch/moon-and-dust?index=1',
  );
  assert.equal(
    getDrachinPlaybackTarget('moon-and-dust').href,
    '/series/short/watch/moon-and-dust?index=1',
  );
});

test('vertical drama helpers honor a caller-supplied base path', () => {
  assert.equal(
    buildVerticalDramaStoryHref('moon-and-dust', '/custom-shorts'),
    '/custom-shorts/moon-and-dust',
  );
  assert.equal(
    buildVerticalDramaWatchHref('moon-and-dust', '/custom-shorts', 7),
    '/custom-shorts/watch/moon-and-dust?index=7',
  );
  assert.equal(
    getDrachinPlaybackTarget('moon-and-dust', 3, '/custom-shorts').href,
    '/custom-shorts/watch/moon-and-dust?index=3',
  );
});

test('dramabox detail href stays inside the shared short-series namespace', () => {
  assert.equal(
    buildVerticalDramaDramaboxHref(
      {
        slug: 'rising-ember',
        title: 'Rising Ember',
        image: 'https://cdn.example/cover.jpg',
        subtitle: 'Episode teaser',
        bookId: 'book-77',
      },
      '/series/short',
    ),
    '/series/short/dramabox/book-77?title=Rising+Ember&image=https%3A%2F%2Fcdn.example%2Fcover.jpg&subtitle=Episode+teaser&bookId=book-77',
  );
});
