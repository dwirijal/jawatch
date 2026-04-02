import test from 'node:test';
import assert from 'node:assert/strict';

import { selectSeriesRecommendations } from '../../src/lib/series-recommendations.ts';

function item(overrides) {
  return {
    slug: overrides.slug,
    title: overrides.title,
    poster: overrides.poster || '/poster.jpg',
    year: overrides.year || '2024',
    type: overrides.type || 'anime',
    rating: overrides.rating,
    status: overrides.status,
    genres: overrides.genres,
    latestEpisode: overrides.latestEpisode,
    country: overrides.country,
    releaseWindow: overrides.releaseWindow,
    nextReleaseAt: overrides.nextReleaseAt,
  };
}

test('filters out the current title and ranks by genre overlap first, then country', () => {
  const results = selectSeriesRecommendations({
    currentSlug: 'current-series',
    genres: ['Action', 'Fantasy'],
    country: 'Japan',
    items: [
      item({ slug: 'current-series', title: 'Current', genres: 'Action, Fantasy', country: 'Japan' }),
      item({ slug: 'country-match', title: 'Country Match', genres: 'Comedy', country: 'Japan' }),
      item({ slug: 'one-genre', title: 'One Genre', genres: 'Action, Slice of Life', country: 'China' }),
      item({ slug: 'two-genres', title: 'Two Genres', genres: 'Fantasy, Action', country: 'China' }),
      item({ slug: 'two-genres-country', title: 'Two Genres Country', genres: 'Action, Fantasy', country: 'Japan' }),
    ],
  });

  assert.deepEqual(results.map((entry) => entry.slug), [
    'two-genres-country',
    'two-genres',
    'one-genre',
    'country-match',
  ]);
});

test('limits the result set to eight recommendations', () => {
  const results = selectSeriesRecommendations({
    currentSlug: 'current-series',
    genres: ['Fantasy'],
    country: 'Japan',
    items: Array.from({ length: 10 }, (_, index) =>
      item({
        slug: `series-${index + 1}`,
        title: `Series ${index + 1}`,
        genres: 'Fantasy',
        country: index % 2 === 0 ? 'Japan' : 'China',
      })
    ),
  });

  assert.equal(results.length, 8);
});
