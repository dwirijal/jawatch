import type { MediaType } from './contracts.ts';
import {
  createDefaultInterests,
  getScopedInterests,
  normalizeInterestMap,
  readScopedInterestStore,
  setScopedInterests,
  writeScopedInterestStore,
  mergeInterestMaps,
} from './core.ts';

const INTEREST_KEY = 'dwizzy_interests';

function readInterestStore() {
  return readScopedInterestStore(INTEREST_KEY);
}

function writeInterestStore(store: ReturnType<typeof readInterestStore>) {
  writeScopedInterestStore(INTEREST_KEY, store);
}

export function incrementInterest(type: MediaType) {
  const interests = getInterests();
  interests[type] = (interests[type] || 0) + 1;
  writeInterestStore(setScopedInterests(readInterestStore(), interests));
}

export function getInterests() {
  return getScopedInterests(readInterestStore()) || createDefaultInterests();
}

export function mergeGuestInterestsIntoOwner(userId: string) {
  const store = readInterestStore();
  store.users[userId] = mergeInterestMaps(
    normalizeInterestMap(store.users[userId]),
    store.guest,
  );
  store.guest = createDefaultInterests();
  writeInterestStore(store);
}
