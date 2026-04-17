with missing_movie_items as (
  select
    i.item_key,
    i.source,
    i.slug,
    i.title,
    i.updated_at
  from public.media_items i
  where (
    i.surface_type = 'movie'
    or (i.surface_type = 'unknown' and i.media_type = 'movie')
  )
    and not exists (
      select 1
      from public.media_units u
      where u.item_key = i.item_key
        and u.unit_type in ('movie', 'episode')
    )
),
inserted as (
  insert into public.media_units (
    unit_key,
    item_key,
    source,
    unit_type,
    slug,
    title,
    label,
    number,
    canonical_url,
    published_at,
    prev_slug,
    next_slug,
    detail,
    created_at,
    updated_at,
    is_canonical,
    season_number,
    episode_number
  )
  select
    missing_movie_items.item_key || '::movie',
    missing_movie_items.item_key,
    coalesce(missing_movie_items.source, ''),
    'movie',
    coalesce(missing_movie_items.slug, ''),
    coalesce(missing_movie_items.title, ''),
    'Full Movie',
    null,
    '/movies/watch/' || coalesce(missing_movie_items.slug, ''),
    null,
    null,
    null,
    jsonb_build_object(
      'backfilled', true,
      'backfill_source', 'scripts/backfill-movie-units.sql',
      'note', 'Canonical movie unit synthesized from media_items because source-backed movie units are not available yet.'
    ),
    now(),
    coalesce(missing_movie_items.updated_at, now()),
    true,
    null,
    null
  from missing_movie_items
  on conflict (unit_key) do nothing
  returning unit_key
)
select count(*)::int as inserted_movie_units
from inserted;
