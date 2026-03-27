import { fetchSankaJson } from '@/lib/media';
import { getPopularManga } from '@/lib/adapters/comic';
import { getDonghuaHome } from '@/lib/adapters/donghua';
import type { GenericMediaItem } from '@/lib/types';

type SurpriseType = 'anime' | 'manga' | 'movie' | 'donghua';

function buildAnimeItems(payload: unknown): GenericMediaItem[] {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
  const data = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? (record.data as Record<string, unknown>)
    : {};
  const animeList = Array.isArray(data.animeList) ? data.animeList : [];

  return animeList
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const entry = item as Record<string, unknown>;
      const slug =
        (typeof entry.slug === 'string' && entry.slug) ||
        (typeof entry.animeId === 'string' && entry.animeId) ||
        '';
      const title = typeof entry.title === 'string' ? entry.title : '';
      if (!slug || !title) {
        return null;
      }

      return {
        slug,
        title,
        thumb:
          (typeof entry.poster === 'string' && entry.poster) ||
          (typeof entry.thumb === 'string' && entry.thumb) ||
          '',
        episode:
          (typeof entry.episode === 'string' && entry.episode) ||
          (typeof entry.episodes === 'string' && entry.episodes) ||
          '',
        type: typeof entry.type === 'string' ? entry.type : 'Anime',
        status: typeof entry.status === 'string' ? entry.status : '',
      } satisfies GenericMediaItem;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function getRandomMedia(type: SurpriseType): Promise<{ slug: string }> {
  try {
    let items: GenericMediaItem[] = [];

    if (type === 'anime') {
      items = buildAnimeItems(await fetchSankaJson('/anime/samehadaku/ongoing?page=1'));
    } else if (type === 'manga') {
      items = (await getPopularManga()).comics;
    } else if (type === 'movie') {
      const response = await fetch('/api/movies/genre?genre=action&limit=24');
      const data = response.ok ? ((await response.json()) as GenericMediaItem[]) : [];
      items = Array.isArray(data) ? data : [];
    } else {
      items = (await getDonghuaHome()).ongoing_series;
    }

    if (items.length === 0) {
      return { slug: '' };
    }

    const randomItem = items[Math.floor(Math.random() * items.length)];
    return { slug: randomItem?.slug || '' };
  } catch {
    return { slug: '' };
  }
}
