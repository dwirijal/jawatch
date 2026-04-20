import {
  buildUnitLikeId,
  createCommunityCommentId,
  summarizeCommunityTitleActivity,
  summarizeCommunityVaultActivity,
} from '../community.ts';
import type {
  CommunityComment,
  CommunityCommentDraft,
  CommunityLike,
  CommunityLikeDraft,
} from './contracts.ts';
import {
  canUseBrowserStorage,
  dedupeTimestampedItems,
  getScopedItems,
  readScopedTimestampedStore,
  setScopedItems,
  writeScopedTimestampedStore,
} from './core.ts';

const COMMUNITY_LIKES_KEY = 'dwizzy_unit_likes';
const COMMUNITY_COMMENTS_KEY = 'dwizzy_unit_comments';
const COMMUNITY_COMMENT_LIMIT = 250;

function readCommunityLikesStore() {
  return readScopedTimestampedStore<CommunityLike>(COMMUNITY_LIKES_KEY);
}

function writeCommunityLikesStore(store: ReturnType<typeof readCommunityLikesStore>) {
  writeScopedTimestampedStore(COMMUNITY_LIKES_KEY, store);
}

function readCommunityCommentsStore() {
  return readScopedTimestampedStore<CommunityComment>(COMMUNITY_COMMENTS_KEY, COMMUNITY_COMMENT_LIMIT);
}

function writeCommunityCommentsStore(store: ReturnType<typeof readCommunityCommentsStore>) {
  writeScopedTimestampedStore(COMMUNITY_COMMENTS_KEY, store, COMMUNITY_COMMENT_LIMIT);
}

function normalizeCommentContent(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .slice(0, 1200);
}

function getScopedCommunityLikes(): CommunityLike[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  return getScopedItems(readCommunityLikesStore());
}

function getScopedCommunityComments(): CommunityComment[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  return getScopedItems(readCommunityCommentsStore());
}

function getNormalizedReplyParentId(
  comments: CommunityComment[],
  titleId: string,
  unitId: string,
  parentId: string | null | undefined,
): string | null {
  if (!parentId) {
    return null;
  }

  const parent = comments.find((comment) => comment.id === parentId && comment.titleId === titleId && comment.unitId === unitId);
  if (!parent) {
    return null;
  }

  return parent.parentId ?? parent.id;
}

export function toggleUnitLike(draft: CommunityLikeDraft): boolean {
  if (!canUseBrowserStorage()) {
    return false;
  }

  const likes = getScopedCommunityLikes();
  const id = buildUnitLikeId(draft.titleId, draft.unitId);
  const exists = likes.some((item) => item.id === id);
  const nextLikes = exists
    ? likes.filter((item) => item.id !== id)
    : dedupeTimestampedItems([
        {
          id,
          titleId: draft.titleId,
          titleLabel: draft.titleLabel,
          unitId: draft.unitId,
          unitLabel: draft.unitLabel,
          unitHref: draft.unitHref,
          mediaType: draft.mediaType,
          timestamp: draft.timestamp ?? Date.now(),
        },
        ...likes,
      ]);

  writeCommunityLikesStore(setScopedItems(readCommunityLikesStore(), nextLikes));
  return !exists;
}

export function isUnitLiked(titleId: string, unitId: string): boolean {
  const likeId = buildUnitLikeId(titleId, unitId);
  return getScopedCommunityLikes().some((item) => item.id === likeId);
}

export function getUnitLikeCount(titleId: string, unitId: string): number {
  const likeId = buildUnitLikeId(titleId, unitId);
  return getScopedCommunityLikes().filter((item) => item.id === likeId).length;
}

export function getTitleCommunityLikes(titleId: string, unitIds?: string[]): CommunityLike[] {
  const allowedUnits = unitIds?.length ? new Set(unitIds) : null;
  return getScopedCommunityLikes().filter((item) => item.titleId === titleId && (!allowedUnits || allowedUnits.has(item.unitId)));
}

export function saveUnitComment(draft: CommunityCommentDraft): CommunityComment | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const content = normalizeCommentContent(draft.content);
  if (!content) {
    return null;
  }

  const comments = getScopedCommunityComments();
  const nextComment: CommunityComment = {
    id: createCommunityCommentId(),
    titleId: draft.titleId,
    titleLabel: draft.titleLabel,
    unitId: draft.unitId,
    unitLabel: draft.unitLabel,
    unitHref: draft.unitHref,
    mediaType: draft.mediaType,
    authorName: draft.authorName.trim() || 'Guest',
    content,
    parentId: getNormalizedReplyParentId(comments, draft.titleId, draft.unitId, draft.parentId),
    timestamp: draft.timestamp ?? Date.now(),
  };

  writeCommunityCommentsStore(setScopedItems(
    readCommunityCommentsStore(),
    dedupeTimestampedItems([nextComment, ...comments], COMMUNITY_COMMENT_LIMIT),
    COMMUNITY_COMMENT_LIMIT,
  ));

  return nextComment;
}

export function getUnitComments(titleId: string, unitId: string): CommunityComment[] {
  return getScopedCommunityComments().filter((item) => item.titleId === titleId && item.unitId === unitId);
}

export function getUnitCommentCount(titleId: string, unitId: string): number {
  return getUnitComments(titleId, unitId).length;
}

export function getTitleCommunityComments(titleId: string, unitIds?: string[]): CommunityComment[] {
  const allowedUnits = unitIds?.length ? new Set(unitIds) : null;
  return getScopedCommunityComments().filter((item) => item.titleId === titleId && (!allowedUnits || allowedUnits.has(item.unitId)));
}

export function getTitleCommunitySummary(titleId: string, unitIds?: string[]) {
  return summarizeCommunityTitleActivity(
    getTitleCommunityLikes(titleId, unitIds),
    getTitleCommunityComments(titleId, unitIds),
    unitIds,
  );
}

export function getVaultCommunitySummary() {
  return summarizeCommunityVaultActivity(
    getScopedCommunityLikes(),
    getScopedCommunityComments(),
  );
}

export function getCommunitySyncPayload(): { likes: CommunityLike[]; comments: CommunityComment[] } {
  return {
    likes: getScopedCommunityLikes(),
    comments: getScopedCommunityComments(),
  };
}

export function mergeGuestCommunityIntoOwner(userId: string) {
  const likesStore = readCommunityLikesStore();
  likesStore.users[userId] = dedupeTimestampedItems([
    ...(likesStore.users[userId] ?? []),
    ...likesStore.guest,
  ]);
  likesStore.guest = [];
  writeCommunityLikesStore(likesStore);

  const commentsStore = readCommunityCommentsStore();
  commentsStore.users[userId] = dedupeTimestampedItems([
    ...(commentsStore.users[userId] ?? []),
    ...commentsStore.guest,
  ], COMMUNITY_COMMENT_LIMIT);
  commentsStore.guest = [];
  writeCommunityCommentsStore(commentsStore);
}
