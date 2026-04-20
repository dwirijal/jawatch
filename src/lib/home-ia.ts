import type { HistoryItem, MediaType } from '@/lib/store';

type ContinueHistorySummary = {
  hasAny: boolean;
  hasWatch: boolean;
  hasRead: boolean;
};

const WATCH_MEDIA_TYPES = new Set<MediaType>(['anime', 'donghua', 'movie', 'drama']);

export function summarizeContinueHistory(
  items: Array<Pick<HistoryItem, 'type'> | { type: MediaType }>,
): ContinueHistorySummary {
  let hasWatch = false;
  let hasRead = false;

  for (const item of items) {
    if (item.type === 'manga') {
      hasRead = true;
      continue;
    }

    if (WATCH_MEDIA_TYPES.has(item.type)) {
      hasWatch = true;
    }
  }

  return {
    hasAny: hasWatch || hasRead,
    hasWatch,
    hasRead,
  };
}
