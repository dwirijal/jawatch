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
    and not (
      coalesce(${nsfwColumn}, false)
      or exists (
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

export function buildComicReadyChapterCondition(unitAlias = 'u'): string {
  const prefix = normalizeAlias(unitAlias);

  return `${prefix}unit_type = 'chapter'
      and jsonb_typeof(${prefix}detail->'pages') = 'array'
      and jsonb_array_length(${prefix}detail->'pages') > 0`;
}

export function buildComicReadyItemCondition(itemAlias = 'm'): string {
  const prefix = normalizeAlias(itemAlias);

  return `exists (
      select 1
      from public.media_units ready_unit
      where ready_unit.item_key = ${prefix}item_key
        and ${buildComicReadyChapterCondition('ready_unit')}
    )`;
}
