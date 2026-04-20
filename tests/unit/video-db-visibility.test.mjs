import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('buildVisibilityCondition treats missing json arrays as empty instead of filtering rows out', () => {
  const source = readFileSync(new URL('../../src/lib/adapters/video-db-common.ts', import.meta.url), 'utf8');

  assert.match(source, /coalesce\(\$\{detailColumn\} -> 'genres', '\[\]'::jsonb\) @> '\["NSFW"\]'/);
  assert.match(source, /coalesce\(\$\{detailColumn\} -> 'genre_names', '\[\]'::jsonb\) @> '\["NSFW"\]'/);
  assert.match(source, /coalesce\(\$\{detailColumn\} -> 'category_names', '\[\]'::jsonb\) @> '\["NSFW"\]'/);
  assert.match(source, /coalesce\(\$\{detailColumn\} -> 'tags', '\[\]'::jsonb\) @> '\["NSFW"\]'/);
});
