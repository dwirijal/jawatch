import type { HistoryItem, RecentManga } from './contracts.ts';
import {
  canUseBrowserStorage,
  dedupeTimestampedItems,
  getActiveStoreOwnerId,
  getScopedItems,
  readScopedTimestampedStore,
  setScopedItems,
  writeScopedTimestampedStore,
} from './core.ts';
import { incrementInterest } from './interests.ts';

const HISTORY_KEY = 'dwizzy_history';
const HISTORY_LIMIT = 20;

function readHistoryStore() {
  return readScopedTimestampedStore<HistoryItem>(HISTORY_KEY, HISTORY_LIMIT);
}

function writeHistoryStore(store: ReturnType<typeof readHistoryStore>) {
  writeScopedTimestampedStore(HISTORY_KEY, store, HISTORY_LIMIT);
}

export function canUseLocalHistory(authenticated: boolean): boolean {
  void authenticated;
  return true;
}

export function saveHistory(item: HistoryItem) {
  if (!canUseBrowserStorage()) return;
  const history = getHistory();
  const updated = dedupeTimestampedItems([item, ...history], HISTORY_LIMIT);
  writeHistoryStore(setScopedItems(readHistoryStore(), updated, HISTORY_LIMIT));
  incrementInterest(item.type);

  if (getActiveStoreOwnerId()) {
    void import('@/lib/personalization-sync')
      .then(({ pushRemoteHistoryItem }) => pushRemoteHistoryItem(item))
      .catch(() => {});
  }
}

export function getHistory(): HistoryItem[] {
  if (!canUseBrowserStorage()) return [];
  return getScopedItems(readHistoryStore());
}

export function getHistoryForAuth(authenticated: boolean): HistoryItem[] {
  if (!canUseLocalHistory(authenticated)) {
    return [];
  }

  return getHistory();
}

export function saveHistoryForAuth(authenticated: boolean, item: HistoryItem): boolean {
  if (!canUseLocalHistory(authenticated)) {
    return false;
  }

  saveHistory(item);
  return true;
}

export function clearHistory() {
  if (!canUseBrowserStorage()) return;
  writeHistoryStore(setScopedItems(readHistoryStore(), [], HISTORY_LIMIT));
}

export function getHistorySyncPayload(): HistoryItem[] {
  return getHistory();
}

export function replaceHistoryForActiveOwner(items: HistoryItem[]) {
  if (!canUseBrowserStorage()) return;
  writeHistoryStore(setScopedItems(readHistoryStore(), items, HISTORY_LIMIT));
}

export function mergeGuestHistoryIntoOwner(userId: string) {
  const store = readHistoryStore();
  store.users[userId] = dedupeTimestampedItems([
    ...(store.users[userId] ?? []),
    ...store.guest,
  ], HISTORY_LIMIT);
  store.guest = [];
  writeHistoryStore(store);
}

export function saveRecentManga(item: RecentManga) {
  saveHistory({
    id: item.slug,
    type: 'manga',
    title: item.title,
    image: item.image,
    lastChapterOrEpisode: 'Recently viewed',
    lastLink: `/comics/${item.slug}`,
    timestamp: item.lastReadAt,
  });
}

export function getRecentManga(): RecentManga[] {
  const history = getHistory().filter((item) => item.type === 'manga');
  return history.map((item) => ({
    slug: item.id,
    title: item.title,
    image: item.image,
    lastReadAt: item.timestamp,
  }));
}
