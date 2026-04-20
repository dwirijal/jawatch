import type { SupabaseClient } from '@supabase/supabase-js';
import type { HistoryItem, MediaType } from '../store';

type UserHistoryRow = {
  user_id: string;
  media_kind: MediaType;
  media_id: string;
  chapter_or_episode_id: string;
  title: string | null;
  image_url: string | null;
  unit_label: string | null;
  unit_href: string | null;
  last_seen_at: string;
};

const USER_HISTORY_SELECT =
  'user_id,media_kind,media_id,chapter_or_episode_id,title,image_url,unit_label,unit_href,last_seen_at';

function toHistoryRow(userId: string, item: HistoryItem): UserHistoryRow & {
  progress_seconds: null;
  progress_percent: null;
} {
  return {
    user_id: userId,
    media_kind: item.type,
    media_id: item.id,
    chapter_or_episode_id: item.lastLink,
    title: item.title,
    image_url: item.image,
    unit_label: item.lastChapterOrEpisode,
    unit_href: item.lastLink,
    progress_seconds: null,
    progress_percent: null,
    last_seen_at: new Date(item.timestamp).toISOString(),
  };
}

function toHistoryItem(row: UserHistoryRow): HistoryItem {
  return {
    id: row.media_id,
    type: row.media_kind,
    title: row.title ?? row.media_id,
    image: row.image_url ?? '',
    lastChapterOrEpisode: row.unit_label ?? row.chapter_or_episode_id,
    lastLink: row.unit_href ?? row.chapter_or_episode_id,
    timestamp: Date.parse(row.last_seen_at),
  };
}

export async function listUserHistory(supabase: SupabaseClient, userId: string): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from('user_history')
    .select(USER_HISTORY_SELECT)
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toHistoryItem(row as UserHistoryRow));
}

export async function syncUserHistory(
  supabase: SupabaseClient,
  userId: string,
  items: HistoryItem[],
): Promise<HistoryItem[]> {
  if (items.length > 0) {
    const { error } = await supabase.from('user_history').upsert(
      items.map((item) => toHistoryRow(userId, item)),
      { onConflict: 'user_id,media_kind,media_id,chapter_or_episode_id' },
    );

    if (error) {
      throw error;
    }
  }

  return listUserHistory(supabase, userId);
}

export async function saveUserHistoryItem(
  supabase: SupabaseClient,
  userId: string,
  item: HistoryItem,
): Promise<void> {
  const { error } = await supabase.from('user_history').upsert(
    toHistoryRow(userId, item),
    { onConflict: 'user_id,media_kind,media_id,chapter_or_episode_id' },
  );

  if (error) {
    throw error;
  }
}
