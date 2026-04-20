import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeMovieRatingValue } from '../../src/lib/adapters/movie-rating.ts';
import { pickPreferredMovieRouteCandidate } from '../../src/lib/adapters/movie-route-alias.ts';

test('movie rating formatter rejects implausible year-like scores', () => {
  assert.equal(normalizeMovieRatingValue(2026), 'N/A');
});

test('movie rating formatter maps percentage-style scores down to a 10-point scale', () => {
  assert.equal(normalizeMovieRatingValue('87'), '8.7');
});

test('movie route alias prefers a playable year-specific sibling over a dead-end exact slug', () => {
  const candidate = pickPreferredMovieRouteCandidate('the-first-slam-dunk', [
    { slug: 'the-first-slam-dunk', year: 'N/A', hasPlayback: false },
    { slug: 'the-first-slam-dunk-2022', year: '2022', hasPlayback: true },
  ]);

  assert.equal(candidate?.slug, 'the-first-slam-dunk-2022');
});

test('movie route alias keeps the exact slug when it is already playable', () => {
  const candidate = pickPreferredMovieRouteCandidate('sharp-corner-2025', [
    { slug: 'sharp-corner-2025', year: '2025', hasPlayback: true },
    { slug: 'sharp-corner', year: 'N/A', hasPlayback: false },
  ]);

  assert.equal(candidate?.slug, 'sharp-corner-2025');
});

test('movie route alias respects an explicit release year when multiple siblings are playable', () => {
  const candidate = pickPreferredMovieRouteCandidate('suspiria-1977', [
    { slug: 'suspiria-2018', year: '2018', hasPlayback: true },
    { slug: 'suspiria-1977', year: '1977', hasPlayback: true },
  ]);

  assert.equal(candidate?.slug, 'suspiria-1977');
});
