import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComicFilterHref,
  buildSeriesFilterHref,
  COMIC_FILTER_SEGMENTS,
  READ_PRIMARY_SEGMENTS,
  SERIES_FILTER_SEGMENTS,
  WATCH_PRIMARY_SEGMENTS,
} from '../../src/lib/media-hub-segments.ts';

test('watch primary segments keep shorts out while the source is paused', () => {
  assert.deepEqual(
    WATCH_PRIMARY_SEGMENTS.map((segment) => segment.label),
    ['Series', 'Film'],
  );
  assert.equal(
    WATCH_PRIMARY_SEGMENTS.some((segment) => segment.label === 'Shorts'),
    false,
  );
});

test('series filters keep anime, donghua, and drama nested under the series lane', () => {
  assert.deepEqual(
    SERIES_FILTER_SEGMENTS.map((segment) => segment.label),
    ['Semua', 'Anime', 'Donghua', 'Drama'],
  );
  assert.equal(buildSeriesFilterHref('all'), '/watch/series');
  assert.equal(buildSeriesFilterHref('donghua'), '/watch/series?type=donghua');
});

test('read primary and comic subtype segments use canonical read routes', () => {
  assert.deepEqual(
    READ_PRIMARY_SEGMENTS.map((segment) => segment.label),
    ['Komik'],
  );
  assert.deepEqual(
    COMIC_FILTER_SEGMENTS.map((segment) => segment.label),
    ['Semua', 'Manga', 'Manhwa', 'Manhua'],
  );
  assert.equal(buildComicFilterHref('all'), '/read/comics');
  assert.equal(buildComicFilterHref('manhwa'), '/read/comics?type=manhwa');
});
