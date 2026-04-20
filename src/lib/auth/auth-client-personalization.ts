import { syncAuthenticatedPersonalization } from '../personalization-sync.ts';
import {
  getCommunitySyncPayload,
  getHistorySyncPayload,
  replaceHistoryForActiveOwner,
  syncStoreOwnership,
} from '../store.ts';

let syncedUserId: string | null = null;
let syncPromise: Promise<void> | null = null;

export function syncAuthStoreOwnership(userId: string | null) {
  syncStoreOwnership(userId);
}

export function resetSyncedAuthClientState() {
  syncedUserId = null;
}

export async function syncAuthenticatedClientState(userId: string) {
  if (syncedUserId === userId) {
    return;
  }

  if (syncPromise) {
    await syncPromise;
    if (syncedUserId === userId) {
      return;
    }
  }

  syncPromise = (async () => {
    const result = await syncAuthenticatedPersonalization({
      history: getHistorySyncPayload(),
      community: getCommunitySyncPayload(),
    });

    replaceHistoryForActiveOwner(result.history);
    syncedUserId = userId;
  })();

  try {
    await syncPromise;
  } finally {
    syncPromise = null;
  }
}
