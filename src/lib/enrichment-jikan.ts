import 'server-only';

import type { AnimeCastMember, JikanEnrichment } from './types.ts';
import {
  ENRICHMENT_CACHE_TTL,
  fetchJson,
  JIKAN_BASE_URL,
  withRuntimeCache,
} from './enrichment-shared.ts';

function extractNames(arr: unknown): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return '';
      }

      return typeof (entry as Record<string, unknown>).name === 'string'
        ? ((entry as Record<string, unknown>).name as string)
        : '';
    })
    .filter(Boolean);
}

export async function getJikanEnrichment(type: 'anime' | 'manga', title: string): Promise<JikanEnrichment | null> {
  try {
    const data = await fetchJson<{ data: Record<string, unknown>[] }>(
      `${JIKAN_BASE_URL}/${type}?q=${encodeURIComponent(title)}&limit=1`,
    );
    const item = data.data?.[0];
    if (!item) {
      return null;
    }

    return {
      malId: item.mal_id as number,
      score: item.score as number,
      rank: item.rank as number,
      popularity: item.popularity as number,
      synopsis: item.synopsis as string,
      trailer_url: ((item.trailer as Record<string, unknown> | undefined)?.url as string) || '',
      status: item.status as string,
      source: item.source as string,
      rating: item.rating as string,
      year: item.year as number | null,
      season: item.season as string,
      genres: extractNames(item.genres),
      themes: extractNames(item.themes),
      studios: extractNames(item.studios),
      title: item.title as string,
      url: item.url as string,
      mediaType: type,
      chapters: item.chapters as number | null,
      episodes: item.episodes as number | null,
    };
  } catch {
    return null;
  }
}

export async function getAnimeCast(malId: number): Promise<AnimeCastMember[]> {
  return withRuntimeCache(`jikan:anime-cast:${malId}`, ENRICHMENT_CACHE_TTL.long, async () => {
    try {
      const data = await fetchJson<{
        data?: Array<{
          role?: string;
          favorites?: number;
          character?: {
            mal_id?: number;
            name?: string;
            images?: {
              webp?: { image_url?: string };
              jpg?: { image_url?: string };
            };
          };
          voice_actors?: Array<{
            language?: string;
            person?: {
              name?: string;
            };
          }>;
        }>;
      }>(`${JIKAN_BASE_URL}/anime/${malId}/characters`);

      return (data.data ?? [])
        .sort((left, right) => {
          const roleScore = (entry: { role?: string }) =>
            entry.role === 'Main' ? 2 : entry.role === 'Supporting' ? 1 : 0;
          return roleScore(right) - roleScore(left) || (right.favorites ?? 0) - (left.favorites ?? 0);
        })
        .map((entry, index) => {
          const japaneseVoiceActor =
            entry.voice_actors?.find((voiceActor) => voiceActor.language === 'Japanese') ??
            entry.voice_actors?.[0];

          return {
            id: entry.character?.mal_id ?? index + 1,
            name: entry.character?.name ?? 'Unknown Character',
            role: entry.role ?? 'Cast',
            image: entry.character?.images?.webp?.image_url || entry.character?.images?.jpg?.image_url,
            voiceActor: japaneseVoiceActor?.person?.name,
            voiceActorLanguage: japaneseVoiceActor?.language,
          };
        })
        .filter((entry) => entry.name)
        .slice(0, 6);
    } catch {
      return [];
    }
  });
}
