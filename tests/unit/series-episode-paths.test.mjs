import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildSeriesEpisodeHref,
  buildSeriesEpisodeSpecialSegment,
  parseSeriesEpisodeNumberParam,
} from '../../src/lib/series-episode-paths.ts';

test('buildSeriesEpisodeHref uses /ep/[num] for numbered episodes', () => {
  assert.equal(
    buildSeriesEpisodeHref({
      seriesSlug: 'one-piece',
      episodeSlug: 'one-piece-episode-1157',
      number: 1157,
    }),
    '/series/one-piece/ep/1157',
  );
});

test('buildSeriesEpisodeHref uses /special/[slug] for non-numbered episodes', () => {
  assert.equal(
    buildSeriesEpisodeHref({
      seriesSlug: 'blue-lock',
      episodeSlug: 'blue-lock-episode-nagi',
      label: 'Episode Nagi',
      title: 'Episode Nagi',
      number: null,
    }),
    '/series/blue-lock/special/episode-nagi',
  );
});

test('special episode route is implemented in the Next app tree', () => {
  assert.equal(
    existsSync(join(process.cwd(), 'src/app/(public)/series/[slug]/special/[episodeSlug]/page.tsx')),
    true,
  );
});

test('buildSeriesEpisodeSpecialSegment strips the repeated series prefix from legacy slugs', () => {
  assert.equal(
    buildSeriesEpisodeSpecialSegment({
      seriesSlug: 'blue-lock',
      episodeSlug: 'blue-lock-promo-cut',
      label: 'Promo Cut',
      title: 'Promo Cut',
      number: null,
    }),
    'promo-cut',
  );
});

test('parseSeriesEpisodeNumberParam accepts plain and decimal episode numbers', () => {
  assert.equal(parseSeriesEpisodeNumberParam('24'), 24);
  assert.equal(parseSeriesEpisodeNumberParam('12.5'), 12.5);
  assert.equal(parseSeriesEpisodeNumberParam('episode-24'), null);
});
