import 'server-only';

import type { ComicDbClient } from '@/lib/server/comic-db';
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
import {
  buildCanonicalDownloadGroups,
  buildCanonicalMirrors,
  type CanonicalDownloadOptionRow,
  type CanonicalStreamOptionRow,
} from './video-provider-option-utils';

export type VideoMirror = MirrorEntry;
export type VideoDownloadGroup = DownloadGroup;
export type { JsonRecord, VisibilityOptions };

export { readNumber, readRecord, readText };

export type { CanonicalDownloadOptionRow, CanonicalStreamOptionRow } from './video-provider-option-utils';

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

export async function readCanonicalPlaybackOptions(
  sql: ComicDbClient,
  canonicalUnitKey: string | null | undefined,
): Promise<{
  mirrors: VideoMirror[];
  downloadGroups: VideoDownloadGroup[];
}> {
  const unitKey = readText(canonicalUnitKey);
  if (!unitKey) {
    return { mirrors: [], downloadGroups: [] };
  }

  const [streamRows, downloadRows] = await Promise.all([
    sql.unsafe<CanonicalStreamOptionRow[]>(`
      select
        s.label,
        s.embed_url,
        s.host_code,
        s.quality_code
      from public.media_stream_options s
      where s.canonical_unit_key = $1
        and s.status_code = 'active'
      order by s.priority asc, s.last_verified_at desc nulls last, s.updated_at desc nulls last
    `, [unitKey]),
    sql.unsafe<CanonicalDownloadOptionRow[]>(`
      select
        d.label,
        d.download_url,
        d.host_code,
        d.quality_code,
        d.format_code
      from public.media_download_options d
      where d.canonical_unit_key = $1
        and d.status_code = 'active'
      order by d.priority asc, d.last_verified_at desc nulls last, d.updated_at desc nulls last
    `, [unitKey]),
  ]);

  return {
    mirrors: buildCanonicalMirrors(streamRows),
    downloadGroups: buildCanonicalDownloadGroups(downloadRows),
  };
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
