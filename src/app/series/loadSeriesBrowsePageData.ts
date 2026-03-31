import { getSeriesBrowseItems } from '@/lib/adapters/series';
import { getServerAuthStatus } from '@/lib/server/auth-session';
import type { GenericMediaItem } from '@/lib/types';

type SeriesBrowseKind = 'list' | 'type' | 'genre' | 'country' | 'year';

export async function loadSeriesBrowsePageData(
  kind: SeriesBrowseKind,
  value: string | null,
  limit = 60,
): Promise<GenericMediaItem[]> {
  const session = await getServerAuthStatus();

  return getSeriesBrowseItems(kind, value, limit, {
    includeNsfw: session.authenticated,
  }).catch(() => []);
}

