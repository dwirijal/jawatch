import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildDramaEpisodeSlug,
  buildDramaItemSlug,
  buildComicChapterSlug,
  buildComicItemSlug,
  buildMovieItemSlug,
  buildSeriesItemSlug,
  buildSqlDramaEpisodeSlugExpression,
  buildSqlMovieItemSlugExpression,
} from '../../src/lib/media-slugs.ts';

test('media slug builders stay deterministic without database slug columns', () => {
  assert.equal(buildMovieItemSlug({ title: 'Kraken', releaseYear: 2025 }), 'kraken-2025');
  assert.equal(buildSeriesItemSlug({ title: 'The Apothecary Diaries' }), 'the-apothecary-diaries');
  assert.equal(buildDramaItemSlug({ title: 'The Haunted Palace' }), 'the-haunted-palace');
  assert.equal(buildComicItemSlug({ title: 'Solo Leveling' }), 'solo-leveling');
  assert.equal(
    buildComicChapterSlug({ comicSlug: 'solo-leveling', label: 'Chapter 179', number: 179 }),
    'solo-leveling-chapter-179',
  );
  assert.equal(
    buildDramaEpisodeSlug({ dramaSlug: 'the-haunted-palace', title: 'Episode 3', number: 3 }),
    'the-haunted-palace-episode-3',
  );
  assert.equal(buildMovieItemSlug({ title: 'Zootopia 2', releaseYear: 2025 }), 'zootopia-2-2025');
});

test('movie slug sql expression is title-based and does not depend on slug columns', () => {
  const expression = buildSqlMovieItemSlugExpression(
    'i.title',
    "coalesce(i.release_year::text, i.detail ->> 'release_year', i.detail ->> 'year', '')",
    'i.item_key',
  );

  assert.doesNotMatch(expression, /\.slug\b/);
  assert.match(expression, /i\.title/);
  assert.match(expression, /regexp_replace/);
});

test('drama episode slug sql expression is title-based and does not depend on slug columns', () => {
  const expression = buildSqlDramaEpisodeSlugExpression(
    "trim(both '-' from regexp_replace(lower(btrim(coalesce(i.title, ''))), '[^a-z0-9]+', '-', 'g'))",
    'u.label',
    'u.title',
    'u.number::text',
    'u.unit_key',
  );

  assert.doesNotMatch(expression, /\.slug\b/);
  assert.match(expression, /i\.title/);
  assert.match(expression, /u\.number::text/);
});

test('comic chapter links use the canonical route helper instead of legacy chapters URLs', () => {
  const sourceFiles = [
    '../../src/features/comics/ComicTitlePage.tsx',
    '../../src/features/comics/ComicChapterClient.tsx',
    '../../src/lib/adapters/comic-server-shared.ts',
  ];

  for (const sourceFile of sourceFiles) {
    const source = readFileSync(new URL(sourceFile, import.meta.url), 'utf8');

    assert.match(source, /buildComicChapterHref/);
    assert.doesNotMatch(source, /\/chapters\/\$\{/);
  }
});
