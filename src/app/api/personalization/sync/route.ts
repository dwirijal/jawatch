import { NextResponse } from 'next/server';
import type { CommunityComment, CommunityLike, HistoryItem } from '@/lib/store';
import { getViewerCommunitySummary, syncLocalCommunityActivity } from '@/lib/server/community-activity';
import { syncUserHistory } from '@/lib/server/history-store';
import { createSupabaseServerClient } from '@/platform/supabase/server';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeHistoryItems(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const id = asString((item as { id?: unknown }).id);
    const type = asString((item as { type?: unknown }).type) as HistoryItem['type'] | null;
    const title = asString((item as { title?: unknown }).title);
    const image = asString((item as { image?: unknown }).image);
    const lastChapterOrEpisode = asString((item as { lastChapterOrEpisode?: unknown }).lastChapterOrEpisode);
    const lastLink = asString((item as { lastLink?: unknown }).lastLink);
    const timestamp = asTimestamp((item as { timestamp?: unknown }).timestamp);

    if (!id || !type || !title || !lastChapterOrEpisode || !lastLink || timestamp === null) {
      return [];
    }

    return [{
      id,
      type,
      title,
      image: image ?? '',
      lastChapterOrEpisode,
      lastLink,
      timestamp,
    }];
  });
}

function normalizeCommunityLikes(value: unknown): CommunityLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const id = asString((item as { id?: unknown }).id);
    const titleId = asString((item as { titleId?: unknown }).titleId);
    const titleLabel = asString((item as { titleLabel?: unknown }).titleLabel);
    const unitId = asString((item as { unitId?: unknown }).unitId);
    const unitLabel = asString((item as { unitLabel?: unknown }).unitLabel);
    const unitHref = asString((item as { unitHref?: unknown }).unitHref);
    const mediaType = asString((item as { mediaType?: unknown }).mediaType) as CommunityLike['mediaType'] | null;
    const timestamp = asTimestamp((item as { timestamp?: unknown }).timestamp);

    if (!id || !titleId || !titleLabel || !unitId || !unitLabel || !unitHref || !mediaType || timestamp === null) {
      return [];
    }

    return [{ id, titleId, titleLabel, unitId, unitLabel, unitHref, mediaType, timestamp }];
  });
}

function normalizeCommunityComments(value: unknown): CommunityComment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const id = asString((item as { id?: unknown }).id);
    const titleId = asString((item as { titleId?: unknown }).titleId);
    const titleLabel = asString((item as { titleLabel?: unknown }).titleLabel);
    const unitId = asString((item as { unitId?: unknown }).unitId);
    const unitLabel = asString((item as { unitLabel?: unknown }).unitLabel);
    const unitHref = asString((item as { unitHref?: unknown }).unitHref);
    const mediaType = asString((item as { mediaType?: unknown }).mediaType) as CommunityComment['mediaType'] | null;
    const authorName = asString((item as { authorName?: unknown }).authorName);
    const content = asString((item as { content?: unknown }).content);
    const rawParentId = (item as { parentId?: unknown }).parentId;
    const parentId = rawParentId == null ? null : asString(rawParentId);
    const timestamp = asTimestamp((item as { timestamp?: unknown }).timestamp);

    if (!id || !titleId || !titleLabel || !unitId || !unitLabel || !unitHref || !mediaType || !authorName || !content || timestamp === null) {
      return [];
    }

    return [{ id, titleId, titleLabel, unitId, unitLabel, unitHref, mediaType, authorName, content, parentId, timestamp }];
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const history = normalizeHistoryItems((body as { history?: unknown }).history);
  const community = (body as { community?: { likes?: unknown; comments?: unknown } }).community;
  const likes = normalizeCommunityLikes(community?.likes);
  const comments = normalizeCommunityComments(community?.comments);

  const [nextHistory, communitySummary] = await Promise.all([
    syncUserHistory(supabase, data.user.id, history),
    likes.length > 0 || comments.length > 0
      ? syncLocalCommunityActivity(supabase, data.user.id, { likes, comments })
      : getViewerCommunitySummary(supabase, data.user.id),
  ]);

  return NextResponse.json({
    history: nextHistory,
    communitySummary,
  });
}
