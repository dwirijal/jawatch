import type {
  CommunityCommentRecord,
  CommunityMediaType,
  UnitLikeRecord,
} from '../community.ts';

export type MediaType = 'manga' | 'anime' | 'donghua' | 'movie' | 'drama';
export type InterestType = MediaType;

export interface HistoryItem {
  id: string;
  type: MediaType;
  title: string;
  image: string;
  lastChapterOrEpisode: string;
  lastLink: string;
  timestamp: number;
}

export interface BookmarkItem {
  id: string;
  type: MediaType;
  title: string;
  image: string;
  timestamp: number;
}

export type CommunityLike = UnitLikeRecord;
export type CommunityComment = CommunityCommentRecord;
export type { CommunityMediaType };

export interface CommunityUnitReference {
  titleId: string;
  titleLabel: string;
  unitId: string;
  unitLabel: string;
  unitHref: string;
  mediaType: CommunityMediaType;
}

export interface CommunityLikeDraft extends CommunityUnitReference {
  timestamp?: number;
}

export interface CommunityCommentDraft extends CommunityUnitReference {
  authorName: string;
  content: string;
  parentId?: string | null;
  timestamp?: number;
}

export interface RecentManga {
  slug: string;
  title: string;
  image: string;
  lastReadAt: number;
}
