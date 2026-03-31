import { getSeriesBrowseItems } from '@/lib/adapters/series';
import type { GenericMediaItem } from '@/lib/types';

type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year';

export async function loadSeriesBrowsePageData(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 60,
): Promise<GenericMediaItem[]> {
  return getSeriesBrowseItems(kind, value, limit, {
    includeNsfw: false,
  }).catch(() => []);
}
