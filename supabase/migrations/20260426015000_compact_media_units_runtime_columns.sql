-- Compact the last large media table for the Supabase free-plan serving DB.
--
-- Runtime code derives route slugs/navigation from item/unit title, label,
-- number, updated_at, and unit_key. Chapter pages remain in detail->'pages';
-- video playback falls back to canonical option tables first and then the
-- small set of playback keys preserved here.

drop view if exists watch.stream_options;
drop view if exists watch.download_options;
drop view if exists watch.media_units;
drop view if exists "read".media_units;

update public.media_units
set detail = case
  when unit_type = 'chapter' then jsonb_strip_nulls(jsonb_build_object(
    'pages', detail -> 'pages'
  ))
  when unit_type in ('movie', 'episode') then jsonb_strip_nulls(jsonb_build_object(
    'stream_links_json', detail -> 'stream_links_json',
    'download_links_json', detail -> 'download_links_json',
    'stream_url', detail -> 'stream_url',
    'embed_url', detail -> 'embed_url',
    'video_url', detail -> 'video_url',
    'thumbnail', detail -> 'thumbnail',
    'provider_url', detail -> 'provider_url',
    'platform_code', detail -> 'platform_code',
    'presentation_format', detail -> 'presentation_format',
    'tags', detail -> 'tags',
    'synopsis', detail -> 'synopsis',
    'overview', detail -> 'overview'
  ))
  else '{}'::jsonb
end
where detail is distinct from case
  when unit_type = 'chapter' then jsonb_strip_nulls(jsonb_build_object(
    'pages', detail -> 'pages'
  ))
  when unit_type in ('movie', 'episode') then jsonb_strip_nulls(jsonb_build_object(
    'stream_links_json', detail -> 'stream_links_json',
    'download_links_json', detail -> 'download_links_json',
    'stream_url', detail -> 'stream_url',
    'embed_url', detail -> 'embed_url',
    'video_url', detail -> 'video_url',
    'thumbnail', detail -> 'thumbnail',
    'provider_url', detail -> 'provider_url',
    'platform_code', detail -> 'platform_code',
    'presentation_format', detail -> 'presentation_format',
    'tags', detail -> 'tags',
    'synopsis', detail -> 'synopsis',
    'overview', detail -> 'overview'
  ))
  else '{}'::jsonb
end;

alter table public.media_units
  drop column if exists source,
  drop column if exists slug,
  drop column if exists canonical_url,
  drop column if exists prev_slug,
  drop column if exists next_slug,
  drop column if exists created_at,
  drop column if exists season_number,
  drop column if exists episode_number;

create index if not exists media_units_item_key_unit_type_number_idx
  on public.media_units (item_key, unit_type, number desc nulls last);

create index if not exists media_units_item_key_unit_type_updated_at_idx
  on public.media_units (item_key, unit_type, updated_at desc);

create index if not exists media_units_ready_chapter_item_order_idx
  on public.media_units (item_key, number desc nulls last, published_at desc nulls last, updated_at desc)
  where unit_type = 'chapter'
    and coalesce(jsonb_array_length(detail -> 'pages'), 0) > 0;

create index if not exists media_units_unit_type_updated_at_idx
  on public.media_units (unit_type, updated_at desc);

create or replace view watch.media_units as
select
  u.unit_key,
  u.item_key,
  u.unit_type,
  u.title,
  u.label,
  u.number,
  u.published_at,
  u.detail,
  u.updated_at,
  u.is_canonical
from public.media_units u
join watch.media_items i on i.item_key = u.item_key
where u.unit_type in ('movie', 'episode');

create or replace view watch.stream_options as
select s.*
from public.media_stream_options s
join watch.media_units u on u.unit_key = s.canonical_unit_key;

create or replace view watch.download_options as
select d.*
from public.media_download_options d
join watch.media_units u on u.unit_key = d.canonical_unit_key;

create or replace view "read".media_units as
select
  u.unit_key,
  u.item_key,
  u.unit_type,
  u.title,
  u.label,
  u.number,
  u.published_at,
  u.detail,
  u.updated_at,
  u.is_canonical
from public.media_units u
join "read".media_items i on i.item_key = u.item_key
where u.unit_type = 'chapter';

grant select on all tables in schema watch to authenticated, service_role;
grant select on all tables in schema "read" to authenticated, service_role;

analyze public.media_units;
