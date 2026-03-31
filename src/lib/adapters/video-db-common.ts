import 'server-only';

import {
  buildDownloadGroups,
  buildMirrorEntries,
  getVideoGenres,
  normalizePosterUrl as normalizePosterFromVideoDb,
  readNumber,
  readRecord,
  readText,
  type DownloadGroup,
  type JsonRecord,
  type MirrorEntry,
  type VisibilityOptions,
} from './video-db';

export type VideoMirror = MirrorEntry;
export type VideoDownloadGroup = DownloadGroup;
export type { JsonRecord, VisibilityOptions };

export { readNumber, readRecord, readText };

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizePosterUrl(...values: unknown[]): string {
  for (const value of values) {
    const text = readText(value);
    if (text) {
      return normalizePosterFromVideoDb(text);
    }
  }

  return '/favicon.ico';
}

export function normalizeGenreList(detail: JsonRecord): string[] {
  return getVideoGenres(detail);
}

export function parseVideoMirrors(detail: JsonRecord): VideoMirror[] {
  return buildMirrorEntries(detail);
}

export function parseVideoDownloads(detail: JsonRecord): VideoDownloadGroup[] {
  return buildDownloadGroups(detail);
}

export function resolvePrimaryVideoUrl(detail: JsonRecord, mirrors: VideoMirror[]): string {
  return readText(detail.stream_url) || mirrors[0]?.embed_url || '';
}

export function getVisibilityCacheSegment(includeNsfw: boolean): 'auth' | 'public' {
  return includeNsfw ? 'auth' : 'public';
}

export function buildVisibilityCondition(includeNsfw: boolean, detailColumn = 'detail', nsfwColumn = 'is_nsfw'): string {
  if (includeNsfw) {
    return '';
  }

  return `
    and not (
      coalesce(${nsfwColumn}, false)
      or
      exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(${detailColumn}->'genres') = 'array' then ${detailColumn}->'genres'
            when jsonb_typeof(${detailColumn}->'genre_names') = 'array' then ${detailColumn}->'genre_names'
            when jsonb_typeof(${detailColumn}->'category_names') = 'array' then ${detailColumn}->'category_names'
            else '[]'::jsonb
          end
        ) as label_name(value)
        where lower(label_name.value) = 'nsfw'
      )
      or exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(${detailColumn}->'tags') = 'array' then ${detailColumn}->'tags'
            else '[]'::jsonb
          end
        ) as tag_name(value)
        where lower(tag_name.value) = 'nsfw'
      )
    )
  `;
}
