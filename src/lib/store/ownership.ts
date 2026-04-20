import { canUseBrowserStorage, normalizeOwnerId, setActiveStoreOwnerId } from './core.ts';
import { mergeGuestBookmarksIntoOwner } from './bookmarks.ts';
import { mergeGuestCommunityIntoOwner } from './community-store.ts';
import { mergeGuestHistoryIntoOwner } from './history.ts';
import { mergeGuestInterestsIntoOwner } from './interests.ts';

export function syncStoreOwnership(userId: string | null) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const normalizedUserId = normalizeOwnerId(userId);

  if (normalizedUserId) {
    mergeGuestHistoryIntoOwner(normalizedUserId);
    mergeGuestBookmarksIntoOwner(normalizedUserId);
    mergeGuestInterestsIntoOwner(normalizedUserId);
    mergeGuestCommunityIntoOwner(normalizedUserId);
    setActiveStoreOwnerId(normalizedUserId);
    return;
  }

  setActiveStoreOwnerId(null);
}
