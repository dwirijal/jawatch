set lock_timeout = '5s';
set statement_timeout = '2min';

-- The website reads comic pages from media_units.detail->'pages'.
-- media_reader_options duplicates reader metadata but is not used by runtime.
drop view if exists "read".reader_options;
drop table if exists public.media_reader_options cascade;

-- Source-side link keys no longer exist in media_items/media_units. Runtime
-- canonical resolution falls back to the canonical flags and primary keys.
drop table if exists public.media_item_links cascade;
drop table if exists public.media_unit_links cascade;

-- Route slugs are derived from title/key expressions in code; these indexes on
-- stored slug columns are unused storage.
drop index if exists public.media_items_slug_idx;
drop index if exists public.media_items_media_type_slug_idx;
drop index if exists public.media_items_surface_type_slug_idx;
drop index if exists public.media_units_unit_type_slug_idx;

analyze public.media_items;
analyze public.media_units;
analyze public.media_item_enrichments;
analyze public.media_stream_options;
analyze public.media_download_options;
