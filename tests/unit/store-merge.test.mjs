import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkIsBookmarked,
  getBookmarks,
  getHistoryForAuth,
  saveHistory,
  syncStoreOwnership,
  toggleBookmark,
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

test('guest history stays readable before login', () => {
  installBrowserStorage();

  saveHistory({
    id: 'blue-lock',
    type: 'manga',
    title: 'Blue Lock',
    image: '/blue-lock.jpg',
    lastChapterOrEpisode: 'Chapter 12',
    lastLink: '/comics/blue-lock/chapters/chapter-12',
    timestamp: 1700000000000,
  });

  assert.equal(getHistoryForAuth(false).length, 1);

  uninstallBrowserStorage();
});

test('signing in merges guest history and bookmarks into the active owner scope', () => {
  installBrowserStorage();

  saveHistory({
    id: 'dandadan',
    type: 'manga',
    title: 'Dandadan',
    image: '/dandadan.jpg',
    lastChapterOrEpisode: 'Chapter 7',
    lastLink: '/comics/dandadan/chapters/chapter-7',
    timestamp: 1700000000000,
  });

  toggleBookmark({
    id: 'solo-leveling',
    type: 'manga',
    title: 'Solo Leveling',
    image: '/solo-leveling.jpg',
    timestamp: 1700000001000,
  });

  syncStoreOwnership('user-1');

  assert.deepEqual(
    getHistoryForAuth(true).map((item) => item.id),
    ['dandadan'],
  );
  assert.deepEqual(
    getBookmarks().map((item) => item.id),
    ['solo-leveling'],
  );
  assert.equal(checkIsBookmarked('solo-leveling'), true);

  syncStoreOwnership(null);
  assert.deepEqual(getHistoryForAuth(false), []);
  assert.deepEqual(getBookmarks(), []);

  syncStoreOwnership('user-1');
  assert.deepEqual(
    getHistoryForAuth(true).map((item) => item.id),
    ['dandadan'],
  );
  assert.deepEqual(
    getBookmarks().map((item) => item.id),
    ['solo-leveling'],
  );

  uninstallBrowserStorage();
});

test('each signed-in owner reads an isolated bookmark scope after merge', () => {
  installBrowserStorage();

  syncStoreOwnership('user-1');
  toggleBookmark({
    id: 'the-batman',
    type: 'movie',
    title: 'The Batman',
    image: '/the-batman.jpg',
    timestamp: 1700000000000,
  });

  assert.equal(checkIsBookmarked('the-batman'), true);

  syncStoreOwnership('user-2');
  assert.equal(checkIsBookmarked('the-batman'), false);
  assert.deepEqual(getBookmarks(), []);

  uninstallBrowserStorage();
});
