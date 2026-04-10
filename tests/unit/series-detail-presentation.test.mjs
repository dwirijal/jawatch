import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatSeriesDetailEpisodeCount,
  formatSeriesDetailRating,
  formatSeriesDetailText,
} from '../../src/lib/series-detail-presentation.ts';

test('keeps normal series ratings in a 0-10 scale', () => {
  assert.equal(formatSeriesDetailRating('8.37'), '8.4');
});

test('maps percentage-like series ratings down to a 0-10 scale', () => {
  assert.equal(formatSeriesDetailRating('87'), '8.7');
});

test('drops implausible series rating counts from hero metadata', () => {
  assert.equal(formatSeriesDetailRating('469865.0'), 'Tidak Tersedia');
});

test('formats numeric episode counts for readability', () => {
  assert.equal(formatSeriesDetailEpisodeCount('1200'), '1,200');
});

test('falls back to Indonesian empty-state copy', () => {
  assert.equal(formatSeriesDetailText(''), 'Tidak Tersedia');
});
