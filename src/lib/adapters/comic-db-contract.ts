export const COMIC_MEDIA_TYPES = ['manga', 'manhwa', 'manhua'] as const;

type SqlAlias = string;

function normalizeAlias(alias: SqlAlias): string {
  const trimmed = alias.trim();
  if (!trimmed) {
    return '';
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    throw new Error(`Unsafe SQL alias: ${trimmed}`);
  }

  return `${trimmed}.`;
}

export function buildComicItemScopeCondition(alias = ''): string {
  const prefix = normalizeAlias(alias);
  return `${prefix}media_type in ('manga', 'manhwa', 'manhua')`;
}

export function buildComicVisibilityCondition(includeNsfw: boolean, itemAlias = ''): string {
  if (includeNsfw) {
    return '';
  }

  const prefix = normalizeAlias(itemAlias);
  const detailColumn = `${prefix}detail`;
  const nsfwColumn = `${prefix}is_nsfw`;

  return `
    and coalesce(${nsfwColumn}, false) = false
    and not (${detailColumn} -> 'genres' @> '["NSFW"]' or ${detailColumn} -> 'genres' @> '["nsfw"]')
    and not (${detailColumn} -> 'genre_names' @> '["NSFW"]' or ${detailColumn} -> 'genre_names' @> '["nsfw"]')
    and not (${detailColumn} -> 'category_names' @> '["NSFW"]' or ${detailColumn} -> 'category_names' @> '["nsfw"]')
    and not (${detailColumn} -> 'tags' @> '["NSFW"]' or ${detailColumn} -> 'tags' @> '["nsfw"]')
  `;
}

export function buildComicReadyChapterCondition(unitAlias = 'u'): string {
  const prefix = normalizeAlias(unitAlias);

  return `${prefix}unit_type = 'chapter'
      and coalesce(jsonb_array_length(${prefix}detail->'pages'), 0) > 0`;
}

export function buildComicReadyItemCondition(itemAlias = 'm'): string {
  const prefix = normalizeAlias(itemAlias);

  return `exists (
      select 1
      from public.media_units ready_unit
      where ready_unit.item_key = ${prefix}item_key
        and ready_unit.unit_type = 'chapter'
        and coalesce(jsonb_array_length(ready_unit.detail->'pages'), 0) > 0
    )`;
}
