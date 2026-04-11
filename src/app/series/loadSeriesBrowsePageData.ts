import { getSeriesBrowseItems } from '@/lib/adapters/series';
import type { GenericMediaItem } from '@/lib/types';
import { resolveViewerNsfwAccess } from '@/app/loadHomePageData';

type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year' | 'status';

export async function loadSeriesBrowsePageData(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 60,
): Promise<GenericMediaItem[]> {
  const includeNsfw = await resolveViewerNsfwAccess();
  return getSeriesBrowseItems(kind, value, limit, {
    includeNsfw,
  }).catch(() => []);
}
