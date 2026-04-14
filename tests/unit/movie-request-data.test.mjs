import test from 'node:test';
import assert from 'node:assert/strict';

import { createMovieDetailRequestCache } from '../../src/app/movies/[slug]/movie-detail-data.ts';
import { createMovieWatchRequestCache } from '../../src/app/movies/watch/[slug]/movie-watch-data.ts';
import { createMoviePageDataLoader } from '../../src/app/movies/movie-page-data.ts';
import { resolveDynamicSitemapEntries } from '../../src/app/sitemap-utils.ts';
import {
  buildMovieGenreRows,
  getFeaturedMovie,
  normalizeMovieSortMode,
  sortMovieCards,
  uniqueMovieCards,
} from '../../src/app/movies/movie-browse-utils.ts';
import { compareMovieUpdatedAtDesc } from '../../src/lib/adapters/movie-sort.ts';

test('movie updated-at sorter handles Date rows from postgres', () => {
  const rows = [
    { slug: 'old', updated_at: new Date('2026-04-10T00:00:00Z') },
    { slug: 'new', updated_at: new Date('2026-04-12T00:00:00Z') },
    { slug: 'middle', updated_at: '2026-04-11T00:00:00Z' },
  ];

  rows.sort(compareMovieUpdatedAtDesc);

  assert.deepEqual(rows.map((row) => row.slug), ['new', 'middle', 'old']);
});

test('sitemap dynamic entries fall back to static-only mode when dynamic loading fails', async () => {
  const warnings = [];
  const entries = await resolveDynamicSitemapEntries(
    async () => {
      throw new Error('database unavailable');
    },
    (message) => warnings.push(message),
  );

  assert.deepEqual(entries, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /dynamic sitemap entries unavailable/);
});

test('movie browse helpers pick featured, dedupe rows, and normalize sort modes', () => {
  const popular = [
    { slug: 'breathe', title: 'Breathe', poster: '/b.jpg', year: '2025', type: 'movie', rating: '7.4', genres: 'Action, Sci-Fi' },
    { slug: 'kraken', title: 'Kraken', poster: '/k.jpg', year: '2024', type: 'movie', rating: 'N/A', genres: 'Horror, Thriller' },
  ];
  const latest = [
    { slug: 'breathe', title: 'Breathe duplicate', poster: '/b2.jpg', year: '2025', type: 'movie', rating: '7.4', genres: 'Action' },
    { slug: 'atlas', title: 'Atlas', poster: '/a.jpg', year: '2026', type: 'movie', rating: '8.1', genres: 'Sci-Fi, Thriller' },
  ];

  assert.equal(getFeaturedMovie(popular, latest)?.slug, 'breathe');
  assert.deepEqual(uniqueMovieCards([...popular, ...latest]).map((item) => item.slug), ['breathe', 'kraken', 'atlas']);
  assert.equal(normalizeMovieSortMode('rating'), 'rating');
  assert.equal(normalizeMovieSortMode('unknown'), 'popular');
  assert.deepEqual(sortMovieCards([...popular, ...latest], 'rating').map((item) => item.slug), ['atlas', 'breathe', 'breathe', 'kraken']);
  assert.deepEqual(buildMovieGenreRows([...popular, ...latest], ['Action', 'Thriller']).map((row) => [row.genre, row.items.map((item) => item.slug)]), [
    ['Action', ['breathe']],
    ['Thriller', ['kraken', 'atlas']],
  ]);
});

test('movie detail request cache dedupes repeated lookups for same slug and visibility', async () => {
  let calls = 0;
  const loader = createMovieDetailRequestCache(async (slug, options = {}) => {
    calls += 1;
    return { slug, includeNsfw: options.includeNsfw === true };
  });

  const [first, second] = await Promise.all([
    loader('kraken-2025', { includeNsfw: false }),
    loader('kraken-2025', { includeNsfw: false }),
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, { slug: 'kraken-2025', includeNsfw: false });
  assert.deepEqual(second, first);
});

test('movie watch request cache keeps public and auth visibility separate', async () => {
  let calls = 0;
  const loader = createMovieWatchRequestCache(async (slug, options = {}) => {
    calls += 1;
    return { slug, includeNsfw: options.includeNsfw === true };
  });

  const [publicResult, authResult] = await Promise.all([
    loader('shelter-2026', { includeNsfw: false }),
    loader('shelter-2026', { includeNsfw: true }),
  ]);

  assert.equal(calls, 2);
  assert.deepEqual(publicResult, { slug: 'shelter-2026', includeNsfw: false });
  assert.deepEqual(authResult, { slug: 'shelter-2026', includeNsfw: true });
});

test('movie page data loader starts hub and genre loads without a waterfall', async () => {
  const events = [];
  let resolveHub;
  let resolveGenre;

  const loadPageData = createMoviePageDataLoader({
    loadHubData: () => {
      events.push('hub-start');
      return new Promise((resolve) => {
        resolveHub = () => {
          events.push('hub-end');
          resolve({ popular: ['popular'], latest: ['latest'] });
        };
      });
    },
    loadGenreItems: () => {
      events.push('genre-start');
      return new Promise((resolve) => {
        resolveGenre = () => {
          events.push('genre-end');
          resolve(['genre']);
        };
      });
    },
  });

  const pending = loadPageData({ activeGenre: 'Action', limit: 24, includeNsfw: false });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(events, ['hub-start', 'genre-start']);

  resolveGenre();
  resolveHub();

  assert.deepEqual(await pending, {
    popular: ['popular'],
    latest: ['latest'],
    initialResults: ['genre'],
  });
});
