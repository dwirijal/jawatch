import type { SupabaseClient } from '@supabase/supabase-js';
import {
  summarizeCommunityTitleActivity,
  summarizeCommunityVaultActivity,
  type CommunityCommentRecord,
  type CommunityMediaType,
  type TitleCommunityActivitySummary,
  type UnitLikeRecord,
  type VaultCommunityActivitySummary,
} from '../community.ts';

type CommunityLikeDraft = {
  titleId: string;
  titleLabel: string;
  unitId: string;
  unitLabel: string;
  unitHref: string;
  mediaType: CommunityMediaType;
  timestamp?: number;
};

type CommunityCommentDraft = CommunityCommentRecord;

type CommunitySyncPayload = {
  likes: UnitLikeRecord[];
  comments: CommunityCommentRecord[];
};

type CommunityLikeRow = {
  id?: string;
  user_id?: string;
  title_id: string;
  title_label: string;
  unit_id: string;
  unit_label: string;
  unit_href: string;
  media_type: CommunityMediaType;
  created_at?: string | null;
  updated_at?: string | null;
};

type CommunityCommentRow = {
  id: string;
  user_id?: string;
  title_id: string;
  title_label: string;
  unit_id: string;
  unit_label: string;
  unit_href: string;
  media_type: CommunityMediaType;
  author_name: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at?: string | null;
};

const COMMUNITY_LIKE_SELECT = 'id,user_id,title_id,title_label,unit_id,unit_label,unit_href,media_type,created_at,updated_at';
const COMMUNITY_COMMENT_SELECT =
  'id,user_id,title_id,title_label,unit_id,unit_label,unit_href,media_type,author_name,content,parent_id,created_at,updated_at';

function toLikeTimestamp(row: CommunityLikeRow): number {
  return Date.parse(row.updated_at ?? row.created_at ?? new Date(0).toISOString());
}

function toLikeRecord(row: CommunityLikeRow): UnitLikeRecord {
  return {
    id: row.id ?? `${row.title_id}::${row.unit_id}`,
    titleId: row.title_id,
    titleLabel: row.title_label,
    unitId: row.unit_id,
    unitLabel: row.unit_label,
    unitHref: row.unit_href,
    mediaType: row.media_type,
    timestamp: toLikeTimestamp(row),
  };
}

function toCommentRecord(row: CommunityCommentRow): CommunityCommentRecord {
  return {
    id: row.id,
    titleId: row.title_id,
    titleLabel: row.title_label,
    unitId: row.unit_id,
    unitLabel: row.unit_label,
    unitHref: row.unit_href,
    mediaType: row.media_type,
    authorName: row.author_name,
    content: row.content,
    parentId: row.parent_id,
    timestamp: Date.parse(row.updated_at ?? row.created_at),
  };
}

async function listViewerLikes(supabase: SupabaseClient, userId: string): Promise<UnitLikeRecord[]> {
  const { data, error } = await supabase
    .from('community_unit_likes')
    .select(COMMUNITY_LIKE_SELECT)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toLikeRecord(row as CommunityLikeRow));
}

async function listViewerComments(supabase: SupabaseClient, userId: string): Promise<CommunityCommentRecord[]> {
  const { data, error } = await supabase
    .from('community_unit_comments')
    .select(COMMUNITY_COMMENT_SELECT)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toCommentRecord(row as CommunityCommentRow));
}

export async function toggleUnitLikeForUser(
  supabase: SupabaseClient,
  userId: string,
  draft: CommunityLikeDraft,
): Promise<boolean> {
  const { data: existing, error: existingError } = await supabase
    .from('community_unit_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('title_id', draft.titleId)
    .eq('unit_id', draft.unitId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error } = await supabase
      .from('community_unit_likes')
      .delete()
      .eq('user_id', userId)
      .eq('title_id', draft.titleId)
      .eq('unit_id', draft.unitId);

    if (error) {
      throw error;
    }

    return false;
  }

  const isoTimestamp = typeof draft.timestamp === 'number' ? new Date(draft.timestamp).toISOString() : undefined;
  const { error } = await supabase.from('community_unit_likes').upsert(
    {
      user_id: userId,
      title_id: draft.titleId,
      title_label: draft.titleLabel,
      unit_id: draft.unitId,
      unit_label: draft.unitLabel,
      unit_href: draft.unitHref,
      media_type: draft.mediaType,
      created_at: isoTimestamp,
      updated_at: isoTimestamp,
    },
    { onConflict: 'user_id,title_id,unit_id' },
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function syncLocalCommunityActivity(
  supabase: SupabaseClient,
  userId: string,
  payload: CommunitySyncPayload,
): Promise<VaultCommunityActivitySummary> {
  if (payload.likes.length > 0) {
    const { error } = await supabase.from('community_unit_likes').upsert(
      payload.likes.map((item) => {
        const isoTimestamp = new Date(item.timestamp).toISOString();
        return {
          user_id: userId,
          title_id: item.titleId,
          title_label: item.titleLabel,
          unit_id: item.unitId,
          unit_label: item.unitLabel,
          unit_href: item.unitHref,
          media_type: item.mediaType,
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        };
      }),
      { onConflict: 'user_id,title_id,unit_id' },
    );

    if (error) {
      throw error;
    }
  }

  if (payload.comments.length > 0) {
    const { error } = await supabase.from('community_unit_comments').upsert(
      payload.comments.map((item) => {
        const isoTimestamp = new Date(item.timestamp).toISOString();
        return {
          id: item.id,
          user_id: userId,
          title_id: item.titleId,
          title_label: item.titleLabel,
          unit_id: item.unitId,
          unit_label: item.unitLabel,
          unit_href: item.unitHref,
          media_type: item.mediaType,
          author_name: item.authorName,
          content: item.content,
          parent_id: item.parentId,
          created_at: isoTimestamp,
          updated_at: isoTimestamp,
        };
      }),
      { onConflict: 'id' },
    );

    if (error) {
      throw error;
    }
  }

  return getViewerCommunitySummary(supabase, userId);
}

export async function getViewerCommunitySummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<VaultCommunityActivitySummary> {
  const [likes, comments] = await Promise.all([
    listViewerLikes(supabase, userId),
    listViewerComments(supabase, userId),
  ]);

  return summarizeCommunityVaultActivity(likes, comments);
}

export async function getUnitCommunitySnapshot(
  supabase: SupabaseClient,
  userId: string,
  titleId: string,
  unitId: string,
): Promise<{
  liked: boolean;
  likeCount: number;
  comments: CommunityCommentRecord[];
}> {
  const { data: likeRows, error: likeError } = await supabase
    .from('community_unit_likes')
    .select(COMMUNITY_LIKE_SELECT)
    .eq('title_id', titleId)
    .eq('unit_id', unitId);

  if (likeError) {
    throw likeError;
  }

  const { data: commentRows, error: commentError } = await supabase
    .from('community_unit_comments')
    .select(COMMUNITY_COMMENT_SELECT)
    .eq('title_id', titleId)
    .eq('unit_id', unitId);

  if (commentError) {
    throw commentError;
  }

  const likes = (likeRows ?? []) as Array<CommunityLikeRow & { user_id?: string }>;
  const comments = (commentRows ?? []).map((row) => toCommentRecord(row as CommunityCommentRow));

  return {
    liked: likes.some((row) => row.user_id === userId),
    likeCount: likes.length,
    comments: comments.sort((left, right) => right.timestamp - left.timestamp),
  };
}

export async function getTitleCommunitySnapshot(
  supabase: SupabaseClient,
  titleId: string,
  unitIds?: string[],
): Promise<{
  likes: UnitLikeRecord[];
  comments: CommunityCommentRecord[];
  summary: TitleCommunityActivitySummary;
}> {
  const likeQuery = supabase
    .from('community_unit_likes')
    .select(COMMUNITY_LIKE_SELECT)
    .eq('title_id', titleId);
  const commentQuery = supabase
    .from('community_unit_comments')
    .select(COMMUNITY_COMMENT_SELECT)
    .eq('title_id', titleId);

  const resolvedLikeQuery = unitIds?.length ? likeQuery.in('unit_id', unitIds) : likeQuery;
  const resolvedCommentQuery = unitIds?.length ? commentQuery.in('unit_id', unitIds) : commentQuery;

  const [{ data: likeRows, error: likeError }, { data: commentRows, error: commentError }] = await Promise.all([
    resolvedLikeQuery,
    resolvedCommentQuery,
  ]);

  if (likeError) {
    throw likeError;
  }
  if (commentError) {
    throw commentError;
  }

  const likes = (likeRows ?? []).map((row) => toLikeRecord(row as CommunityLikeRow));
  const comments = (commentRows ?? []).map((row) => toCommentRecord(row as CommunityCommentRow));

  return {
    likes,
    comments,
    summary: summarizeCommunityTitleActivity(likes, comments, unitIds),
  };
}

export async function saveUnitCommentForUser(
  supabase: SupabaseClient,
  userId: string,
  draft: CommunityCommentDraft,
): Promise<CommunityCommentRecord> {
  const isoTimestamp = new Date(draft.timestamp).toISOString();
  const row = {
    id: draft.id,
    user_id: userId,
    title_id: draft.titleId,
    title_label: draft.titleLabel,
    unit_id: draft.unitId,
    unit_label: draft.unitLabel,
    unit_href: draft.unitHref,
    media_type: draft.mediaType,
    author_name: draft.authorName,
    content: draft.content,
    parent_id: draft.parentId,
    created_at: isoTimestamp,
    updated_at: isoTimestamp,
  };

  const { error } = await supabase
    .from('community_unit_comments')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    throw error;
  }

  return draft;
}
