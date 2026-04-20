export type CommunityMediaType = 'manga' | 'anime' | 'donghua' | 'movie' | 'drama';

export interface UnitLikeRecord {
  id: string;
  titleId: string;
  titleLabel: string;
  unitId: string;
  unitLabel: string;
  unitHref: string;
  mediaType: CommunityMediaType;
  timestamp: number;
}

export interface CommunityCommentRecord {
  id: string;
  titleId: string;
  titleLabel: string;
  unitId: string;
  unitLabel: string;
  unitHref: string;
  mediaType: CommunityMediaType;
  authorName: string;
  content: string;
  parentId: string | null;
  timestamp: number;
}

export interface CommunityCommentNode extends CommunityCommentRecord {
  replies: CommunityCommentRecord[];
}

export interface CommunityActivitySummary {
  likeCount: number;
  commentCount: number;
  latestActivityAt: number | null;
}

export interface TitleCommunityActivitySummary extends CommunityActivitySummary {
  activeUnitCount: number;
}

export interface VaultCommunityActivitySummary extends CommunityActivitySummary {
  activeTitleCount: number;
}

export function buildUnitLikeId(titleId: string, unitId: string): string {
  return `${titleId}::${unitId}`;
}

export function createCommunityCommentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortNewestFirst<T extends { timestamp: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => right.timestamp - left.timestamp);
}

function sortOldestFirst<T extends { timestamp: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.timestamp - right.timestamp);
}

function getLatestTimestamp<T extends { timestamp: number }>(items: T[]): number | null {
  let latest = 0;

  for (const item of items) {
    if (item.timestamp > latest) {
      latest = item.timestamp;
    }
  }

  return latest || null;
}

export function buildCommentTree(comments: CommunityCommentRecord[]): CommunityCommentNode[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const roots: CommunityCommentNode[] = [];
  const repliesByRoot = new Map<string, CommunityCommentRecord[]>();

  for (const comment of comments) {
    const parent = comment.parentId ? byId.get(comment.parentId) ?? null : null;
    const rootParentId = parent
      ? (parent.parentId ? parent.parentId : parent.id)
      : null;

    if (!rootParentId) {
      roots.push({
        ...comment,
        parentId: null,
        replies: [],
      });
      continue;
    }

    repliesByRoot.set(rootParentId, [
      ...(repliesByRoot.get(rootParentId) ?? []),
      {
        ...comment,
        parentId: rootParentId,
      },
    ]);
  }

  return sortNewestFirst(roots).map((root) => ({
    ...root,
    replies: sortOldestFirst(repliesByRoot.get(root.id) ?? []),
  }));
}

export function summarizeCommunityTitleActivity(
  likes: UnitLikeRecord[],
  comments: CommunityCommentRecord[],
  unitIds?: string[],
): TitleCommunityActivitySummary {
  const allowedUnits = unitIds?.length ? new Set(unitIds) : null;
  const filteredLikes = allowedUnits ? likes.filter((item) => allowedUnits.has(item.unitId)) : likes;
  const filteredComments = allowedUnits ? comments.filter((item) => allowedUnits.has(item.unitId)) : comments;
  const activeUnitIds = new Set<string>();

  for (const item of filteredLikes) {
    activeUnitIds.add(item.unitId);
  }
  for (const item of filteredComments) {
    activeUnitIds.add(item.unitId);
  }

  const latestLike = getLatestTimestamp(filteredLikes);
  const latestComment = getLatestTimestamp(filteredComments);

  return {
    likeCount: filteredLikes.length,
    commentCount: filteredComments.length,
    activeUnitCount: activeUnitIds.size,
    latestActivityAt: Math.max(latestLike ?? 0, latestComment ?? 0) || null,
  };
}

export function summarizeCommunityVaultActivity(
  likes: UnitLikeRecord[],
  comments: CommunityCommentRecord[],
): VaultCommunityActivitySummary {
  const activeTitleIds = new Set<string>();

  for (const item of likes) {
    activeTitleIds.add(item.titleId);
  }
  for (const item of comments) {
    activeTitleIds.add(item.titleId);
  }

  const latestLike = getLatestTimestamp(likes);
  const latestComment = getLatestTimestamp(comments);

  return {
    likeCount: likes.length,
    commentCount: comments.length,
    activeTitleCount: activeTitleIds.size,
    latestActivityAt: Math.max(latestLike ?? 0, latestComment ?? 0) || null,
  };
}
