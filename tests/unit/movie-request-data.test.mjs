import test from 'node:test';
import assert from 'node:assert/strict';

import { createMovieDetailRequestCache } from '../../src/domains/movies/server/movie-detail-data.ts';
import { createMovieWatchRequestCache } from '../../src/domains/movies/server/movie-watch-data.ts';
import { createMoviePageDataLoader } from '../../src/features/movies/server/loadMoviePageData.ts';
import { resolveMoviePlaybackState } from '../../src/domains/movies/server/movie-playback-state.ts';
import { resolveDynamicSitemapEntries } from '../../src/app/_shared/metadata/sitemap-utils.ts';
import {
  buildMovieDetailBySlugQuery,
  buildMovieWatchBySlugQuery,
} from '../../src/lib/adapters/movie-query-sql.ts';
import {
  buildMovieGenreRows,
  getFeaturedMovie,
  normalizeMovieSortMode,
  sortMovieCards,
  uniqueMovieCards,
} from '../../src/features/movies/movie-browse-utils.ts';
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

test('sitemap dynamic entries fall back to static-only mode when dynamic loading times out', async () => {
  const warnings = [];
  const startedAt = Date.now();
  const entries = await resolveDynamicSitemapEntries(
    async () => new Promise((resolve) => {
      setTimeout(() => resolve([{ slug: 'late-entry' }]), 50);
    }),
    (message) => warnings.push(message),
    { timeoutMs: 5 },
  );

  assert.deepEqual(entries, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /timeout/i);
  assert.ok(Date.now() - startedAt < 45);
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

test('movie playback state uses inline player when a playable default url exists', () => {
  assert.deepEqual(
    resolveMoviePlaybackState(
      { slug: 'dancing-queens-2021', externalUrl: '/movies/dancing-queens-2021' },
      {
        canInlinePlayback: true,
        defaultUrl: 'https://player.example/embed/123',
        externalUrl: null,
      },
    ),
    {
      kind: 'inline',
      href: '#player',
      ctaLabel: 'Nonton sekarang',
      message: null,
    },
  );
});

test('movie playback state keeps real external targets when they differ from the detail route', () => {
  assert.deepEqual(
    resolveMoviePlaybackState(
      { slug: 'dancing-queens-2021', externalUrl: '/movies/dancing-queens-2021' },
      {
        canInlinePlayback: false,
        defaultUrl: '',
        externalUrl: 'https://stream.example/watch/dancing-queens-2021',
      },
    ),
    {
      kind: 'external',
      href: 'https://stream.example/watch/dancing-queens-2021',
      ctaLabel: 'Buka sumber',
      message: null,
    },
  );
});

test('movie playback state marks self-link watch fallbacks as unavailable', () => {
  assert.deepEqual(
    resolveMoviePlaybackState(
      { slug: 'dancing-queens-2021', externalUrl: '/movies/dancing-queens-2021' },
      {
        canInlinePlayback: false,
        defaultUrl: '',
        externalUrl: '/movies/dancing-queens-2021',
      },
    ),
    {
      kind: 'unavailable',
      href: null,
      ctaLabel: 'Belum bisa diputar',
      message: 'Judul ini sudah ada di katalog, tetapi sumber stream belum tersedia.',
    },
  );
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

test('movie detail query prefers rows that already have units before stale duplicates', () => {
  const sql = buildMovieDetailBySlugQuery({
    itemCanonicalFlag: true,
    unitCanonicalFlag: true,
    itemLinks: true,
    unitLinks: true,
  });

  assert.match(sql, /\bexists\s*\([\s\S]*from public\.media_units candidate_units[\s\S]*\)\s+as has_units/i);
  assert.match(sql, /\border by has_units desc,\s*coalesce\(i\.is_canonical, false\) desc,\s*i\.updated_at desc/i);
});

test('movie watch query projects unit canonical flag from the lateral subquery', () => {
  const sql = buildMovieWatchBySlugQuery({
    itemCanonicalFlag: true,
    unitCanonicalFlag: true,
    itemLinks: true,
    unitLinks: true,
  });

  assert.match(sql, /\bjoin lateral\b[\s\S]*\bu\.is_canonical\b/i);
  assert.match(sql, /\bcoalesce\(\s*case when coalesce\(u\.is_canonical, false\) then u\.unit_key end/i);
});
