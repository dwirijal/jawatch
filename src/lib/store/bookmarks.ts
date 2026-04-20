import type { BookmarkItem } from './contracts.ts';
import {
  canUseBrowserStorage,
  dedupeTimestampedItems,
  getScopedItems,
  readScopedTimestampedStore,
  setScopedItems,
  writeScopedTimestampedStore,
} from './core.ts';
import { incrementInterest } from './interests.ts';

const BOOKMARKS_KEY = 'dwizzy_bookmarks';

function readBookmarksStore() {
  return readScopedTimestampedStore<BookmarkItem>(BOOKMARKS_KEY);
}

function writeBookmarksStore(store: ReturnType<typeof readBookmarksStore>) {
  writeScopedTimestampedStore(BOOKMARKS_KEY, store);
}

export function toggleBookmark(item: BookmarkItem): boolean {
  if (!canUseBrowserStorage()) return false;
  const bookmarks = getBookmarks();
  const exists = bookmarks.find((bookmark) => bookmark.id === item.id);

  let updated: BookmarkItem[];
  let isAdded = false;

  if (exists) {
    updated = bookmarks.filter((bookmark) => bookmark.id !== item.id);
  } else {
    updated = dedupeTimestampedItems([item, ...bookmarks]);
    isAdded = true;
    incrementInterest(item.type);
  }

  writeBookmarksStore(setScopedItems(readBookmarksStore(), updated));
  return isAdded;
}

export function getBookmarks(): BookmarkItem[] {
  if (!canUseBrowserStorage()) return [];
  return getScopedItems(readBookmarksStore());
}

export function checkIsBookmarked(id: string): boolean {
  return getBookmarks().some((bookmark) => bookmark.id === id);
}

export function mergeGuestBookmarksIntoOwner(userId: string) {
  const store = readBookmarksStore();
  store.users[userId] = dedupeTimestampedItems([
    ...(store.users[userId] ?? []),
    ...store.guest,
  ]);
  store.guest = [];
  writeBookmarksStore(store);
}
