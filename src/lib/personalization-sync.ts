'use client';

import type { HistoryItem, CommunityComment, CommunityCommentDraft, CommunityLike, CommunityLikeDraft } from './store';
import type { CommunityCommentRecord, TitleCommunityActivitySummary, UnitLikeRecord, VaultCommunityActivitySummary } from './community';

type PersonalizationSyncResponse = {
  history: HistoryItem[];
  communitySummary: VaultCommunityActivitySummary;
};

type UnitCommunitySnapshot = {
  liked: boolean;
  likeCount: number;
  comments: CommunityCommentRecord[];
};

type TitleCommunitySnapshot = {
  likes: UnitLikeRecord[];
  comments: CommunityCommentRecord[];
  summary: TitleCommunityActivitySummary;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function syncAuthenticatedPersonalization(payload: {
  history: HistoryItem[];
  community: { likes: CommunityLike[]; comments: CommunityComment[] };
}): Promise<PersonalizationSyncResponse> {
  const response = await fetch('/api/personalization/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<PersonalizationSyncResponse>(response);
}

export async function pushRemoteHistoryItem(item: HistoryItem): Promise<void> {
  const response = await fetch('/api/personalization/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ history: [item] }),
  });

  if (response.status === 401) {
    return;
  }

  await parseJsonResponse<PersonalizationSyncResponse>(response);
}

export async function loadRemoteUnitCommunity(titleId: string, unitId: string): Promise<UnitCommunitySnapshot> {
  const params = new URLSearchParams({
    scope: 'unit',
    titleId,
    unitId,
  });

  const response = await fetch(`/api/community?${params.toString()}`, {
    credentials: 'include',
  });

  return parseJsonResponse<UnitCommunitySnapshot>(response);
}

export async function loadRemoteTitleCommunity(titleId: string, unitIds: string[]): Promise<TitleCommunitySnapshot> {
  const params = new URLSearchParams({
    scope: 'title',
    titleId,
  });

  if (unitIds.length > 0) {
    params.set('unitIds', unitIds.join(','));
  }

  const response = await fetch(`/api/community?${params.toString()}`, {
    credentials: 'include',
  });

  return parseJsonResponse<TitleCommunitySnapshot>(response);
}

export async function loadRemoteVaultCommunitySummary(): Promise<VaultCommunityActivitySummary> {
  const params = new URLSearchParams({ scope: 'vault' });
  const response = await fetch(`/api/community?${params.toString()}`, {
    credentials: 'include',
  });

  return parseJsonResponse<VaultCommunityActivitySummary>(response);
}

export async function toggleRemoteUnitLike(draft: CommunityLikeDraft): Promise<UnitCommunitySnapshot> {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'toggle-like',
      draft,
    }),
  });

  return parseJsonResponse<UnitCommunitySnapshot>(response);
}

export async function saveRemoteUnitComment(draft: CommunityCommentDraft & { id: string }): Promise<UnitCommunitySnapshot> {
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'comment',
      draft,
    }),
  });

  return parseJsonResponse<UnitCommunitySnapshot>(response);
}
