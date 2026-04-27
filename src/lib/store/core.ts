import type { MediaType } from './contracts.ts';
import {
  canUseBrowserStorage,
  parseStoredJson,
  readStoredString,
  removeStoredItem,
  writeStoredString,
} from '../browser-storage.ts';

export type InterestMap = Record<MediaType, number>;
export type TimestampedStoreItem = { id: string; timestamp: number };
export type ScopedTimestampedStore<T extends TimestampedStoreItem> = {
  guest: T[];
  users: Record<string, T[]>;
};
export type ScopedInterestStore = {
  guest: InterestMap;
  users: Record<string, InterestMap>;
};

const ACTIVE_STORE_OWNER_KEY = 'dwizzy_active_user';

export function normalizeOwnerId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export { canUseBrowserStorage, parseStoredJson };

export function createDefaultInterests(): InterestMap {
  return { manga: 0, anime: 0, donghua: 0, movie: 0, drama: 0 };
}

export function normalizeInterestMap(value: unknown): InterestMap {
  const defaults = createDefaultInterests();
  if (!value || typeof value !== 'object') {
    return defaults;
  }

  for (const key of Object.keys(defaults) as MediaType[]) {
    const nextValue = (value as Partial<Record<MediaType, unknown>>)[key];
    if (typeof nextValue === 'number' && Number.isFinite(nextValue) && nextValue > 0) {
      defaults[key] = nextValue;
    }
  }

  return defaults;
}

export function dedupeTimestampedItems<T extends TimestampedStoreItem>(items: T[], limit?: number): T[] {
  const deduped = new Map<string, T>();

  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !Number.isFinite(item.timestamp)) {
      continue;
    }

    const existing = deduped.get(item.id);
    if (!existing || item.timestamp >= existing.timestamp) {
      deduped.set(item.id, item);
    }
  }

  const sorted = [...deduped.values()].sort((left, right) => right.timestamp - left.timestamp);
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

export function readScopedTimestampedStore<T extends TimestampedStoreItem>(key: string, limit?: number): ScopedTimestampedStore<T> {
  if (!canUseBrowserStorage()) {
    return { guest: [], users: {} };
  }

  const parsed = parseStoredJson(readStoredString(key));
  if (Array.isArray(parsed)) {
    return {
      guest: dedupeTimestampedItems(parsed as T[], limit),
      users: {},
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { guest: [], users: {} };
  }

  const guest = Array.isArray((parsed as { guest?: unknown }).guest)
    ? dedupeTimestampedItems((parsed as { guest: T[] }).guest, limit)
    : [];
  const users: Record<string, T[]> = {};
  const rawUsers = (parsed as { users?: Record<string, unknown> }).users;

  if (rawUsers && typeof rawUsers === 'object') {
    for (const [ownerId, items] of Object.entries(rawUsers)) {
      const normalizedOwnerId = normalizeOwnerId(ownerId);
      if (!normalizedOwnerId || !Array.isArray(items)) {
        continue;
      }

      users[normalizedOwnerId] = dedupeTimestampedItems(items as T[], limit);
    }
  }

  return { guest, users };
}

export function writeScopedTimestampedStore<T extends TimestampedStoreItem>(
  key: string,
  store: ScopedTimestampedStore<T>,
  limit?: number,
) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const users = Object.fromEntries(
    Object.entries(store.users).map(([ownerId, items]) => [ownerId, dedupeTimestampedItems(items, limit)]),
  );

  writeStoredString(
    key,
    JSON.stringify({
      guest: dedupeTimestampedItems(store.guest, limit),
      users,
    }),
  );
}

export function readScopedInterestStore(key: string): ScopedInterestStore {
  if (!canUseBrowserStorage()) {
    return {
      guest: createDefaultInterests(),
      users: {},
    };
  }

  const parsed = parseStoredJson(readStoredString(key));
  if (!parsed || typeof parsed !== 'object') {
    return {
      guest: createDefaultInterests(),
      users: {},
    };
  }

  const rawScoped = parsed as {
    guest?: unknown;
    users?: Record<string, unknown>;
  };

  const looksScoped = 'guest' in rawScoped || 'users' in rawScoped;
  if (!looksScoped) {
    return {
      guest: normalizeInterestMap(parsed),
      users: {},
    };
  }

  const users: Record<string, InterestMap> = {};
  if (rawScoped.users && typeof rawScoped.users === 'object') {
    for (const [ownerId, value] of Object.entries(rawScoped.users)) {
      const normalizedOwnerId = normalizeOwnerId(ownerId);
      if (!normalizedOwnerId) {
        continue;
      }

      users[normalizedOwnerId] = normalizeInterestMap(value);
    }
  }

  return {
    guest: normalizeInterestMap(rawScoped.guest),
    users,
  };
}

export function writeScopedInterestStore(key: string, store: ScopedInterestStore) {
  if (!canUseBrowserStorage()) {
    return;
  }

  writeStoredString(
    key,
    JSON.stringify({
      guest: normalizeInterestMap(store.guest),
      users: Object.fromEntries(
        Object.entries(store.users).map(([ownerId, value]) => [ownerId, normalizeInterestMap(value)]),
      ),
    }),
  );
}

export function getActiveStoreOwnerId(): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return normalizeOwnerId(readStoredString(ACTIVE_STORE_OWNER_KEY));
}

export function setActiveStoreOwnerId(userId: string | null) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const normalizedUserId = normalizeOwnerId(userId);
  if (normalizedUserId) {
    writeStoredString(ACTIVE_STORE_OWNER_KEY, normalizedUserId);
    return;
  }

  removeStoredItem(ACTIVE_STORE_OWNER_KEY);
}

export function getScopedItems<T extends TimestampedStoreItem>(store: ScopedTimestampedStore<T>): T[] {
  const ownerId = getActiveStoreOwnerId();
  return ownerId ? store.users[ownerId] ?? [] : store.guest;
}

export function setScopedItems<T extends TimestampedStoreItem>(
  store: ScopedTimestampedStore<T>,
  items: T[],
  limit?: number,
): ScopedTimestampedStore<T> {
  const ownerId = getActiveStoreOwnerId();
  const nextItems = dedupeTimestampedItems(items, limit);

  if (ownerId) {
    return {
      guest: store.guest,
      users: {
        ...store.users,
        [ownerId]: nextItems,
      },
    };
  }

  return {
    guest: nextItems,
    users: store.users,
  };
}

export function getScopedInterests(store: ScopedInterestStore): InterestMap {
  const ownerId = getActiveStoreOwnerId();
  return ownerId ? normalizeInterestMap(store.users[ownerId]) : normalizeInterestMap(store.guest);
}

export function setScopedInterests(store: ScopedInterestStore, nextValue: InterestMap): ScopedInterestStore {
  const ownerId = getActiveStoreOwnerId();
  const normalizedValue = normalizeInterestMap(nextValue);

  if (ownerId) {
    return {
      guest: store.guest,
      users: {
        ...store.users,
        [ownerId]: normalizedValue,
      },
    };
  }

  return {
    guest: normalizedValue,
    users: store.users,
  };
}

export function mergeInterestMaps(target: InterestMap, source: InterestMap): InterestMap {
  const merged = createDefaultInterests();

  for (const key of Object.keys(merged) as MediaType[]) {
    merged[key] = (target[key] || 0) + (source[key] || 0);
  }

  return merged;
}
