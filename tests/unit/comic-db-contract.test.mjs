import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComicItemScopeCondition,
  buildComicReadyChapterCondition,
  buildComicReadyItemCondition,
  buildComicVisibilityCondition,
} from '../../src/lib/adapters/comic-db-contract.ts';

test('comic item scope is limited to supported reader media types', () => {
  assert.equal(
    buildComicItemScopeCondition('m'),
    "m.media_type in ('manga', 'manhwa', 'manhua')",
  );
});

test('public comic visibility excludes explicit and tagged NSFW rows', () => {
  const condition = buildComicVisibilityCondition(false, 'i');

  assert.match(condition, /coalesce\(i\.is_nsfw, false\)/);
  assert.match(condition, /i\.detail->'genres'/);
  assert.match(condition, /i\.detail->'tags'/);
});

test('authenticated comic visibility does not add public NSFW filtering', () => {
  assert.equal(buildComicVisibilityCondition(true, 'i'), '');
});

test('ready comic chapters must have a non-empty pages array', () => {
  const condition = buildComicReadyChapterCondition('u');

  assert.match(condition, /u\.unit_type = 'chapter'/);
  assert.match(condition, /jsonb_typeof\(u\.detail->'pages'\) = 'array'/);
  assert.match(condition, /jsonb_array_length\(u\.detail->'pages'\) > 0/);
});

test('ready comic items require at least one ready chapter', () => {
  const condition = buildComicReadyItemCondition('m');

  assert.match(condition, /exists \(/);
  assert.match(condition, /from public\.media_units ready_unit/);
  assert.match(condition, /ready_unit\.item_key = m\.item_key/);
  assert.match(condition, /jsonb_array_length\(ready_unit\.detail->'pages'\) > 0/);
});
