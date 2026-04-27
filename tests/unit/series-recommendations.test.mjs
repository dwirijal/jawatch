import test from 'node:test';
import assert from 'node:assert/strict';

import { selectSeriesRecommendations } from '../../src/lib/series-recommendations.ts';
import { resolveSeriesMediaType } from '../../src/lib/series-taxonomy.ts';

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
    currentTitle: 'Current Series',
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
    currentTitle: 'Current Series',
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

test('keeps recommendations within the current series media type when provided', () => {
  const results = selectSeriesRecommendations({
    currentSlug: 'current-series',
    currentTitle: 'Current Series',
    currentType: 'anime',
    genres: ['Action'],
    country: 'Japan',
    items: [
      item({ slug: 'anime-match', title: 'Anime Match', type: 'anime', genres: 'Action', country: 'Japan' }),
      item({ slug: 'drama-match', title: 'Drama Match', type: 'drama', genres: 'Action', country: 'Japan' }),
      item({ slug: 'donghua-match', title: 'Donghua Match', type: 'donghua', genres: 'Action', country: 'Japan' }),
    ],
  });

  assert.deepEqual(results.map((entry) => entry.slug), ['anime-match']);
});

test('prioritizes franchise siblings and collapses duplicate title variants', () => {
  const results = selectSeriesRecommendations({
    currentSlug: 'dr-stone-science-future',
    currentTitle: 'Dr. Stone Season 4 Part 1',
    currentType: 'anime',
    genres: ['Adventure', 'Sci-Fi'],
    country: 'Japan',
    items: [
      item({ slug: 'dr-stone', title: 'Dr. Stone', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'dr-stone-stone-wars-season-2', title: 'Dr. Stone: Stone Wars (season 2)', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'dr-stone-science-future-cdc1accf', title: 'Dr. Stone: Science Future', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'dr-stone-season-4-part-2', title: 'Dr. Stone Season 4 Part 2', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'ds-future-part3-sub-indo', title: 'Dr. Stone: Science Future Part 3', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'dr-stone-season-4-part-3', title: 'Dr. Stone Season 4 Part 3', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'other-anime', title: 'Other Anime', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
      item({ slug: 'dr-stone-season-4-part-3-alt', title: 'Dr. Stone Season 4 Part 3', genres: 'Adventure, Sci-Fi', country: 'Japan' }),
    ],
  });

  assert.deepEqual(results.map((entry) => entry.slug).slice(0, 5), [
    'dr-stone',
    'dr-stone-season-4-part-2',
    'dr-stone-season-4-part-3',
    'ds-future-part3-sub-indo',
    'dr-stone-stone-wars-season-2',
  ]);
  assert.equal(results.some((entry) => entry.slug === 'dr-stone-season-4-part-3-alt'), false);
  assert.equal(results.at(-1)?.slug, 'other-anime');
});

test('resolves drama and donghua providers before falling back to anime', () => {
  assert.equal(resolveSeriesMediaType({ originType: '', mediaType: 'anime', source: 'drakorid' }), 'drama');
  assert.equal(resolveSeriesMediaType({ originType: '', mediaType: 'anime', source: 'dracinly' }), 'drama');
  assert.equal(resolveSeriesMediaType({ originType: '', mediaType: 'anime', source: 'dramabox' }), 'drama');
  assert.equal(resolveSeriesMediaType({ originType: '', mediaType: 'anime', source: 'anichin' }), 'donghua');
  assert.equal(resolveSeriesMediaType({ originType: '', mediaType: 'anime', source: 'jikan' }), 'anime');
});
