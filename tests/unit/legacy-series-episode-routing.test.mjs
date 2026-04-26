import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLegacyComicChapterRedirectPath,
  getLegacyRedirectPath,
  getLegacySeriesEpisodeRedirectPath,
} from '../../src/platform/gateway/legacy/routing.ts';

test('legacy numbered series episode routes redirect to compact ep route', () => {
  assert.equal(
    getLegacySeriesEpisodeRedirectPath('/series/one-piece/episodes/one-piece-episode-1157'),
    '/series/one-piece/ep/1157',
  );
});

test('legacy non-numbered series episode routes redirect to special route', () => {
  assert.equal(
    getLegacySeriesEpisodeRedirectPath('/series/blue-lock/episodes/blue-lock-episode-nagi'),
    '/series/blue-lock/special/episode-nagi',
  );
});

test('non-legacy series routes are not rewritten by legacy episode routing', () => {
  assert.equal(getLegacySeriesEpisodeRedirectPath('/series/one-piece/ep/1157'), null);
  assert.equal(getLegacySeriesEpisodeRedirectPath('/series/one-piece'), null);
});

test('legacy comic chapter routes redirect to canonical chapter route', () => {
  assert.equal(
    getLegacyComicChapterRedirectPath('/comics/eleceed/eleceed-chapter-347'),
    '/comics/eleceed/ch/347',
  );
  assert.equal(
    getLegacyComicChapterRedirectPath('/comics/magic-emperor/magic-emperor-chapter-164-5/'),
    '/comics/magic-emperor/ch/164-5',
  );
  assert.equal(
    getLegacyComicChapterRedirectPath('/comics/lookism/chapters/lookism-chapter-532'),
    '/comics/lookism/ch/532',
  );
  assert.equal(
    getLegacyComicChapterRedirectPath('/comics/lookism/chapters/special-side-story'),
    '/comics/lookism/chapter/special-side-story',
  );
});

test('canonical comic routes are not rewritten by legacy chapter routing', () => {
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed'), null);
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/chapters'), null);
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/ch/347'), null);
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/chapter/special-side-story'), null);
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/reviews'), null);
  assert.equal(getLegacyComicChapterRedirectPath('/comics/eleceed/characters'), null);
});

test('legacy redirect resolver centralizes legacy route compatibility', () => {
  assert.equal(
    getLegacyRedirectPath('/series/one-piece/episodes/one-piece-episode-1157'),
    '/series/one-piece/ep/1157',
  );
  assert.equal(
    getLegacyRedirectPath('/comics/eleceed/eleceed-chapter-347'),
    '/comics/eleceed/ch/347',
  );
  assert.equal(getLegacyRedirectPath('/comic/magic-emperor'), '/read/comics');
  assert.equal(getLegacyRedirectPath('/manga/magic-emperor'), '/read/comics');
  assert.equal(getLegacyRedirectPath('/movies/latest'), '/watch/movies');
  assert.equal(
    getLegacyRedirectPath('/movies/watch/naruto-shippuden-the-movie-2007'),
    '/movies/naruto-shippuden-the-movie-2007',
  );
  assert.equal(getLegacyRedirectPath('/series/short'), '/watch');
  assert.equal(getLegacyRedirectPath('/series/short/love-in-vertical'), '/shorts/love-in-vertical');
  assert.equal(
    getLegacyRedirectPath('/series/watch/one-piece-episode-1157'),
    '/series/one-piece/ep/1157',
  );
  assert.equal(getLegacyRedirectPath('/comics/eleceed/reviews'), null);
});
