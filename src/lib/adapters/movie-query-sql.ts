import { buildSqlMovieItemSlugExpression } from '../media-slugs.ts';

export type MovieQuerySchemaCapabilities = {
  itemCanonicalFlag: boolean;
  unitCanonicalFlag: boolean;
  itemLinks: boolean;
  unitLinks: boolean;
};

function buildMovieScopeCondition(alias: string): string {
  return `(
    ${alias}.surface_type = 'movie'
    or (${alias}.surface_type = 'unknown' and ${alias}.media_type = 'movie')
  )`;
}

function buildMovieItemSlugExpression(alias: string): string {
  return buildSqlMovieItemSlugExpression(
    `${alias}.title`,
    `coalesce(${alias}.release_year::text, ${alias}.detail ->> 'release_year', ${alias}.detail ->> 'year', '')`,
    `${alias}.item_key`,
  );
}

function buildCanonicalItemFlagSelection(
  alias: string,
  schemaCapabilities: MovieQuerySchemaCapabilities,
): string {
  return schemaCapabilities.itemCanonicalFlag ? `${alias}.is_canonical` : 'false as is_canonical';
}

function buildCanonicalUnitFlagSelection(
  alias: string,
  schemaCapabilities: MovieQuerySchemaCapabilities,
): string {
  return schemaCapabilities.unitCanonicalFlag ? `${alias}.is_canonical` : 'false as is_canonical';
}

function buildCanonicalItemOrdering(
  alias: string,
  schemaCapabilities: MovieQuerySchemaCapabilities,
): string {
  return schemaCapabilities.itemCanonicalFlag ? `coalesce(${alias}.is_canonical, false) desc, ` : '';
}

function buildCanonicalUnitOrdering(
  alias: string,
  schemaCapabilities: MovieQuerySchemaCapabilities,
): string {
  return schemaCapabilities.unitCanonicalFlag ? `coalesce(${alias}.is_canonical, false) desc, ` : '';
}

function buildCanonicalUnitKeyExpression(
  alias: string,
  schemaCapabilities: MovieQuerySchemaCapabilities,
): string {
  const expressions: string[] = [];

  if (schemaCapabilities.unitCanonicalFlag) {
    expressions.push(`case when coalesce(${alias}.is_canonical, false) then ${alias}.unit_key end`);
  }

  if (schemaCapabilities.unitLinks) {
    expressions.push(`(
      select mul.canonical_unit_key
      from public.media_unit_links mul
      where mul.source_unit_key = ${alias}.unit_key
      order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
      limit 1
    )`);
  }

  expressions.push(`${alias}.unit_key`);

  return `coalesce(
    ${expressions.join(',\n    ')}
  )`;
}

export function buildMovieDetailBySlugQuery(schemaCapabilities: MovieQuerySchemaCapabilities): string {
  return `
    select
      i.item_key,
      exists (
        select 1
        from public.media_units candidate_units
        where candidate_units.item_key = i.item_key
          and candidate_units.unit_type in ('movie', 'episode')
      ) as has_units,
      ${buildCanonicalItemFlagSelection('i', schemaCapabilities)},
      i.source,
      i.media_type,
      ${buildMovieItemSlugExpression('i')} as slug,
      i.title,
      i.cover_url,
      i.status,
      i.release_year,
      i.score,
      i.detail,
      f.payload as fanart_payload,
      e.payload as tmdb_payload,
      i.updated_at,
      0::int as unit_count
    from public.media_items i
    left join public.media_item_enrichments f
      on f.item_key = i.item_key
     and f.provider = 'fanart'
     and f.match_status = 'matched'
    left join public.media_item_enrichments e
      on e.item_key = i.item_key
     and e.provider = 'tmdb'
     and e.match_status = 'matched'
    where ${buildMovieScopeCondition('i')}
      and ${buildMovieItemSlugExpression('i')} = $1
    order by has_units desc, ${buildCanonicalItemOrdering('i', schemaCapabilities)}i.updated_at desc
    limit 1
  `;
}

export function buildMovieWatchBySlugQuery(schemaCapabilities: MovieQuerySchemaCapabilities): string {
  return `
    with selected_item as (
      select
        i.item_key,
        exists (
          select 1
          from public.media_units candidate_units
          where candidate_units.item_key = i.item_key
            and candidate_units.unit_type in ('movie', 'episode')
        ) as has_units,
        ${buildMovieItemSlugExpression('i')} as item_slug,
        i.title as item_title,
        i.media_type,
        i.cover_url,
        i.detail as item_detail,
        f.payload as item_fanart_payload,
        e.payload as item_tmdb_payload
      from public.media_items i
      left join public.media_item_enrichments f
        on f.item_key = i.item_key
       and f.provider = 'fanart'
       and f.match_status = 'matched'
      left join public.media_item_enrichments e
        on e.item_key = i.item_key
       and e.provider = 'tmdb'
       and e.match_status = 'matched'
      where ${buildMovieScopeCondition('i')}
        and ${buildMovieItemSlugExpression('i')} = $1
      order by has_units desc, ${buildCanonicalItemOrdering('i', schemaCapabilities)}i.updated_at desc
      limit 1
    )
    select
      u.item_key,
      si.item_slug,
      si.item_title,
      si.media_type,
      si.cover_url,
      si.item_detail,
      si.item_fanart_payload,
      si.item_tmdb_payload,
      u.title,
      u.label,
      u.number,
      u.published_at,
      u.detail,
      ${buildCanonicalUnitKeyExpression('u', schemaCapabilities)} as canonical_unit_key
    from selected_item si
    join lateral (
      select
        u.item_key,
        u.unit_key,
        ${buildCanonicalUnitFlagSelection('u', schemaCapabilities)},
        u.title,
        u.label,
        u.number,
        u.published_at,
        u.detail
      from public.media_units u
      where u.item_key = si.item_key
        and u.unit_type in ('movie', 'episode')
      order by ${buildCanonicalUnitOrdering('u', schemaCapabilities)}u.updated_at desc
      limit 1
    ) u on true
    limit 1
  `;
}
