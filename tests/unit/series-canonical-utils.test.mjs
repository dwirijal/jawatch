import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCanonicalEpisodeLateralSubquery,
  buildSeriesCanonicalRedirectPath,
  collapseCanonicalEpisodeEntries,
  collapseCanonicalSeriesRows,
  getSeriesSearchCandidateLimit,
  resolveSeriesEpisodeNavigation,
  resolveSeriesCanonicalRedirect,
  selectCanonicalSeriesRow,
  selectPreferredLinkedSourceItem,
  selectPreferredLinkedSourceUnit,
  selectSeriesPlaybackSources,
} from '../../src/lib/adapters/series-canonical-utils.ts';

test('anime listing hides source-native duplicates when canonical rows exist', () => {
  const rows = collapseCanonicalSeriesRows([
    {
      item_key: 'standalone-item',
      canonical_item_key: 'standalone-item',
      slug: 'another-anime',
      is_canonical: false,
      updated_at: '2026-04-03T12:00:00.000Z',
    },
    {
      item_key: 'source-item',
      canonical_item_key: 'canonical-item',
      slug: 'old-source-slug',
      is_canonical: false,
      updated_at: '2026-04-02T12:00:00.000Z',
    },
    {
      item_key: 'canonical-item',
      canonical_item_key: 'canonical-item',
      slug: 'canonical-jikan-slug',
      is_canonical: true,
      updated_at: '2026-04-01T12:00:00.000Z',
    },
  ]);

  assert.deepEqual(rows.map((row) => row.slug), [
    'another-anime',
    'canonical-jikan-slug',
  ]);
});

test('browse ordering stays anchored to the first appearance of each canonical group', () => {
  const rows = collapseCanonicalSeriesRows([
    {
      item_key: 'latest-standalone',
      canonical_item_key: 'latest-standalone',
      slug: 'latest-standalone',
      is_canonical: false,
      updated_at: '2026-04-04T12:00:00.000Z',
    },
    {
      item_key: 'source-item',
      canonical_item_key: 'canonical-item',
      slug: 'old-source-slug',
      is_canonical: false,
      updated_at: '2026-04-03T12:00:00.000Z',
    },
    {
      item_key: 'canonical-item',
      canonical_item_key: 'canonical-item',
      slug: 'canonical-jikan-slug',
      is_canonical: true,
      updated_at: '2026-04-01T12:00:00.000Z',
    },
    {
      item_key: 'older-standalone',
      canonical_item_key: 'older-standalone',
      slug: 'older-standalone',
      is_canonical: false,
      updated_at: '2026-04-02T12:00:00.000Z',
    },
  ]);

  assert.deepEqual(rows.map((row) => row.slug), [
    'latest-standalone',
    'canonical-jikan-slug',
    'older-standalone',
  ]);
});

test('anime detail resolves canonical slug and produces redirect target for old source slugs', () => {
  const resolved = selectCanonicalSeriesRow([
    {
      item_key: 'source-item',
      canonical_item_key: 'canonical-item',
      slug: 'old-source-slug',
      is_canonical: false,
      updated_at: '2026-04-03T12:00:00.000Z',
    },
    {
      item_key: 'canonical-item',
      canonical_item_key: 'canonical-item',
      slug: 'canonical-jikan-slug',
      is_canonical: true,
      updated_at: '2026-04-01T12:00:00.000Z',
    },
  ]);

  assert.equal(resolved?.slug, 'canonical-jikan-slug');
  assert.equal(
    buildSeriesCanonicalRedirectPath('/series', 'old-source-slug', 'canonical-jikan-slug'),
    '/series/canonical-jikan-slug',
  );
  assert.equal(
    buildSeriesCanonicalRedirectPath('/series', 'canonical-jikan-slug', 'canonical-jikan-slug'),
    null,
  );
});

test('series detail route redirects when adapter resolves a canonical slug for an old source slug', () => {
  const redirectPath = resolveSeriesCanonicalRedirect('/series', 'old-source-slug', {
    slug: 'canonical-jikan-slug',
  });

  assert.equal(redirectPath, '/series/canonical-jikan-slug');
  assert.equal(
    resolveSeriesCanonicalRedirect('/series', 'canonical-jikan-slug', {
      slug: 'canonical-jikan-slug',
    }),
    null,
  );
});

test('search collapse can still return the requested number of unique rows when duplicates occupy the top ranks', () => {
  const requestedLimit = 2;
  assert.equal(getSeriesSearchCandidateLimit(requestedLimit), 8);

  const rows = collapseCanonicalSeriesRows([
    {
      item_key: 'source-a',
      canonical_item_key: 'canonical-a',
      slug: 'source-a',
      is_canonical: false,
      updated_at: '2026-04-05T12:00:00.000Z',
    },
    {
      item_key: 'canonical-a',
      canonical_item_key: 'canonical-a',
      slug: 'canonical-a',
      is_canonical: true,
      updated_at: '2026-04-04T12:00:00.000Z',
    },
    {
      item_key: 'source-b',
      canonical_item_key: 'canonical-b',
      slug: 'source-b',
      is_canonical: false,
      updated_at: '2026-04-03T12:00:00.000Z',
    },
    {
      item_key: 'canonical-b',
      canonical_item_key: 'canonical-b',
      slug: 'canonical-b',
      is_canonical: true,
      updated_at: '2026-04-02T12:00:00.000Z',
    },
    {
      item_key: 'late-unique',
      canonical_item_key: 'late-unique',
      slug: 'late-unique',
      is_canonical: false,
      updated_at: '2026-04-01T12:00:00.000Z',
    },
  ], { limit: requestedLimit });

  assert.deepEqual(rows.map((row) => row.slug), [
    'canonical-a',
    'canonical-b',
  ]);
});

test('watch path prefers canonical provider options over source payloads', () => {
  const playback = selectSeriesPlaybackSources({
    requestedSlug: 'canonical-episode-1',
    canonicalSlug: 'canonical-episode-1',
    sourceMirrors: [{ label: 'Source Mirror', embed_url: 'https://source.invalid/embed' }],
    canonicalMirrors: [{ label: 'Canonical Mirror', embed_url: 'https://canonical.invalid/embed' }],
    sourceDownloadGroups: [
      {
        format: 'MP4',
        quality: '720P',
        links: [{ label: 'Source Download', href: 'https://source.invalid/download' }],
      },
    ],
    canonicalDownloadGroups: [
      {
        format: 'MKV',
        quality: '1080P',
        links: [{ label: 'Canonical Download', href: 'https://canonical.invalid/download' }],
      },
    ],
    sourceStreamUrl: 'https://source.invalid/stream',
  });

  assert.deepEqual(playback.mirrors, [{ label: 'Canonical Mirror', embed_url: 'https://canonical.invalid/embed' }]);
  assert.equal(playback.defaultUrl, 'https://canonical.invalid/embed');
  assert.deepEqual(playback.downloadGroups, [
    {
      format: 'MKV',
      quality: '1080P',
      links: [{ label: 'Canonical Download', href: 'https://canonical.invalid/download' }],
    },
  ]);
});

test('linked source item selection is deterministic and honors requested source before stable provider tiebreaks', () => {
  const requestedMatch = selectPreferredLinkedSourceItem([
    { item_key: 'source-z', source: 'z-provider', is_primary: true, priority: 10 },
    { item_key: 'source-a', source: 'a-provider', is_primary: true, priority: 10 },
  ], {
    requestedSource: 'z-provider',
  });

  assert.equal(requestedMatch?.item_key, 'source-z');

  const stableFallback = selectPreferredLinkedSourceItem([
    { item_key: 'source-z', source: 'z-provider', is_primary: true, priority: 10 },
    { item_key: 'source-a', source: 'a-provider', is_primary: true, priority: 10 },
  ]);

  assert.equal(stableFallback?.item_key, 'source-a');
});

test('source payload fallback is blocked on alias watch routes and allowed on canonical routes without canonical provider options', () => {
  const aliasPlayback = selectSeriesPlaybackSources({
    requestedSlug: 'old-source-episode-1',
    canonicalSlug: 'canonical-episode-1',
    sourceMirrors: [{ label: 'Source Mirror', embed_url: 'https://source.invalid/embed' }],
    canonicalMirrors: [],
    sourceDownloadGroups: [
      {
        format: 'MP4',
        quality: '720P',
        links: [{ label: 'Source Download', href: 'https://source.invalid/download' }],
      },
    ],
    canonicalDownloadGroups: [],
    sourceStreamUrl: 'https://source.invalid/stream',
  });

  assert.deepEqual(aliasPlayback, {
    mirrors: [],
    downloadGroups: [],
    defaultUrl: '',
  });

  const canonicalPlayback = selectSeriesPlaybackSources({
    requestedSlug: 'canonical-episode-1',
    canonicalSlug: 'canonical-episode-1',
    sourceMirrors: [{ label: 'Source Mirror', embed_url: 'https://source.invalid/embed' }],
    canonicalMirrors: [],
    sourceDownloadGroups: [
      {
        format: 'MP4',
        quality: '720P',
        links: [{ label: 'Source Download', href: 'https://source.invalid/download' }],
      },
    ],
    canonicalDownloadGroups: [],
    sourceStreamUrl: 'https://source.invalid/stream',
  });

  assert.deepEqual(canonicalPlayback, {
    mirrors: [{ label: 'Source Mirror', embed_url: 'https://source.invalid/embed' }],
    downloadGroups: [
      {
        format: 'MP4',
        quality: '720P',
        links: [{ label: 'Source Download', href: 'https://source.invalid/download' }],
      },
    ],
    defaultUrl: 'https://source.invalid/embed',
  });
});

test('linked source unit selection stays pinned to the chosen source item on canonical watch routes', () => {
  const selected = selectPreferredLinkedSourceUnit([
    {
      unit_key: 'unit-z',
      item_key: 'source-z',
      source: 'z-provider',
      is_primary: true,
      priority: 10,
      detail: { stream_url: 'https://z-provider.invalid/embed' },
    },
    {
      unit_key: 'unit-a',
      item_key: 'source-a',
      source: 'a-provider',
      is_primary: true,
      priority: 10,
      detail: { stream_url: 'https://a-provider.invalid/embed' },
    },
  ], {
    linkedSourceItemKey: 'source-a',
  });

  assert.equal(selected?.unit_key, 'unit-a');
});

test('canonical episode selection prefers canonical episode slugs', () => {
  const resolved = selectCanonicalSeriesRow([
    {
      item_key: 'source-episode',
      canonical_item_key: 'canonical-episode',
      slug: 'old-source-episode-1',
      is_canonical: false,
      updated_at: '2026-04-03T12:00:00.000Z',
    },
    {
      item_key: 'canonical-episode',
      canonical_item_key: 'canonical-episode',
      slug: 'canonical-episode-1',
      is_canonical: true,
      updated_at: '2026-04-01T12:00:00.000Z',
    },
  ]);

  assert.equal(resolved?.slug, 'canonical-episode-1');
});

test('canonical episode lists drop duplicate source rows that map to the same canonical unit', () => {
  const rows = collapseCanonicalEpisodeEntries([
    {
      canonical_unit_key: 'canonical-ep-12',
      slug: 'episode-12',
      title: 'Episode 12',
    },
    {
      canonical_unit_key: 'canonical-ep-12',
      slug: 'episode-12',
      title: 'Episode 12 mirror duplicate',
    },
    {
      canonical_unit_key: 'canonical-ep-11',
      slug: 'episode-11',
      title: 'Episode 11',
    },
  ]);

  assert.deepEqual(rows.map((row) => row.slug), [
    'episode-12',
    'episode-11',
  ]);
});

test('watch navigation falls back to canonical playlist adjacency when stored prev/next slugs are absent', () => {
  const navigation = resolveSeriesEpisodeNavigation({
    currentSlug: 'episode-11',
    playlist: [
      { slug: 'episode-12', label: 'Episode 12', title: 'Episode 12', number: 12 },
      { slug: 'episode-11', label: 'Episode 11', title: 'Episode 11', number: 11 },
      { slug: 'episode-10', label: 'Episode 10', title: 'Episode 10', number: 10 },
    ],
    prevSlug: '',
    nextSlug: null,
  });

  assert.deepEqual(navigation, {
    prevSlug: 'episode-10',
    nextSlug: 'episode-12',
  });
});

test('adapter canonical-unit lateral subquery projects unit_key for outer coalesce reads', () => {
  const sql = buildCanonicalEpisodeLateralSubquery('cu');

  assert.match(sql, /\bselect\b[\s\S]*\bcu\.unit_key\b/i);
  assert.match(sql, /\bcu\.updated_at\b/i);
  assert.match(sql, /\bmul\.source_unit_key = u\.unit_key\b/i);
});
