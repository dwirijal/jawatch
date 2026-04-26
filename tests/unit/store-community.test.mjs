import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTitleCommunitySummary,
  getUnitCommentCount,
  getUnitLikeCount,
  getUnitComments,
  isUnitLiked,
  saveUnitComment,
  syncStoreOwnership,
  toggleUnitLike,
} from '../../src/lib/store.ts';

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

function installBrowserStorage() {
  const localStorage = createStorage();
  global.window = { localStorage };
  global.localStorage = localStorage;
  return localStorage;
}

function uninstallBrowserStorage() {
  delete global.window;
  delete global.localStorage;
}

test('unit likes and comments stay local-first and aggregate cleanly at the title level', () => {
  installBrowserStorage();

  toggleUnitLike({
    titleId: 'series:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'episode:1',
    unitLabel: 'Episode 1',
    unitHref: '/series/blue-lock/ep/1',
    mediaType: 'anime',
  });

  const rootComment = saveUnitComment({
    titleId: 'series:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'episode:1',
    unitLabel: 'Episode 1',
    unitHref: '/series/blue-lock/ep/1',
    mediaType: 'anime',
    authorName: 'Guest',
    content: 'This episode hits hard.',
  });

  assert.ok(rootComment);
  assert.equal(isUnitLiked('series:blue-lock', 'episode:1'), true);
  assert.equal(getUnitLikeCount('series:blue-lock', 'episode:1'), 1);
  assert.equal(getUnitCommentCount('series:blue-lock', 'episode:1'), 1);
  assert.equal(getUnitComments('series:blue-lock', 'episode:1')[0]?.content, 'This episode hits hard.');
  assert.deepEqual(
    getTitleCommunitySummary('series:blue-lock', ['episode:1', 'episode:2']),
    {
      likeCount: 1,
      commentCount: 1,
      activeUnitCount: 1,
      latestActivityAt: rootComment.timestamp,
    },
  );

  uninstallBrowserStorage();
});

test('signing in merges guest community activity into the signed-in owner scope', () => {
  installBrowserStorage();

  saveUnitComment({
    titleId: 'comics:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'chapter:1',
    unitLabel: 'Chapter 1',
    unitHref: '/comics/blue-lock/ch/1',
    mediaType: 'manga',
    authorName: 'Guest',
    content: 'First comment from guest mode.',
  });

  toggleUnitLike({
    titleId: 'comics:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'chapter:1',
    unitLabel: 'Chapter 1',
    unitHref: '/comics/blue-lock/ch/1',
    mediaType: 'manga',
  });

  syncStoreOwnership('user-1');

  assert.equal(getUnitLikeCount('comics:blue-lock', 'chapter:1'), 1);
  assert.equal(getUnitCommentCount('comics:blue-lock', 'chapter:1'), 1);

  syncStoreOwnership(null);
  assert.equal(getUnitLikeCount('comics:blue-lock', 'chapter:1'), 0);
  assert.equal(getUnitCommentCount('comics:blue-lock', 'chapter:1'), 0);

  syncStoreOwnership('user-1');
  assert.equal(getUnitLikeCount('comics:blue-lock', 'chapter:1'), 1);
  assert.equal(getUnitCommentCount('comics:blue-lock', 'chapter:1'), 1);

  uninstallBrowserStorage();
});
