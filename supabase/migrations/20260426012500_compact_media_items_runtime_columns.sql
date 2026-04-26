set lock_timeout = '5s';
set statement_timeout = '5min';

drop view if exists watch.download_options;
drop view if exists watch.stream_options;
drop view if exists watch.item_enrichments;
drop view if exists watch.media_units;
drop view if exists watch.media_items;
drop view if exists "read".item_enrichments;
drop view if exists "read".media_units;
drop view if exists "read".media_items;

drop table if exists public.media_items_compact;
create table public.media_items_compact (
  item_key text,
  source text,
  media_type text,
  title text,
  cover_url text,
  status text,
  release_year smallint,
  score real,
  detail jsonb,
  updated_at timestamptz,
  search_vec tsvector,
  surface_type text,
  presentation_type text,
  origin_type text,
  release_country text,
  is_nsfw boolean,
  genre_names text[],
  release_day text,
  release_window text,
  release_timezone text,
  cadence text,
  next_release_at timestamptz,
  is_canonical boolean
);

insert into public.media_items_compact (
  item_key,
  source,
  media_type,
  title,
  cover_url,
  status,
  release_year,
  score,
  detail,
  updated_at,
  search_vec,
  surface_type,
  presentation_type,
  origin_type,
  release_country,
  is_nsfw,
  genre_names,
  release_day,
  release_window,
  release_timezone,
  cadence,
  next_release_at,
  is_canonical
)
select
  item_key,
  source,
  media_type,
  title,
  cover_url,
  status,
  release_year,
  score,
  jsonb_strip_nulls(
    jsonb_build_object(
      'poster_url', detail -> 'poster_url',
      'poster', detail -> 'poster',
      'background_url', detail -> 'background_url',
      'background', detail -> 'background',
      'background_image', detail -> 'background_image',
      'backgroundImage', detail -> 'backgroundImage',
      'backdrop_url', detail -> 'backdrop_url',
      'backdrop', detail -> 'backdrop',
      'backdrop_image', detail -> 'backdrop_image',
      'backdropImage', detail -> 'backdropImage',
      'logo_url', detail -> 'logo_url',
      'logo', detail -> 'logo',
      'title_logo', detail -> 'title_logo',
      'title_logo_url', detail -> 'title_logo_url',
      'titleLogo', detail -> 'titleLogo',
      'titleLogoUrl', detail -> 'titleLogoUrl',
      'clearlogo', detail -> 'clearlogo',
      'clearlogo_url', detail -> 'clearlogo_url',
      'clear_logo', detail -> 'clear_logo',
      'release_year', detail -> 'release_year',
      'year', detail -> 'year',
      'rating', detail -> 'rating',
      'score', detail -> 'score',
      'quality', detail -> 'quality'
    )
    || jsonb_build_object(
      'runtime_minutes', detail -> 'runtime_minutes',
      'duration_minutes', detail -> 'duration_minutes',
      'runtime', detail -> 'runtime',
      'duration', detail -> 'duration',
      'overview', detail -> 'overview',
      'synopsis', detail -> 'synopsis',
      'genres', detail -> 'genres',
      'genre_names', detail -> 'genre_names',
      'category_names', detail -> 'category_names',
      'tags', detail -> 'tags',
      'country', detail -> 'country',
      'region', detail -> 'region',
      'country_names', detail -> 'country_names',
      'latest_episode', detail -> 'latest_episode',
      'latest_label', detail -> 'latest_label',
      'latest_chapter_label', detail -> 'latest_chapter_label',
      'type', detail -> 'type',
      'alt_title', detail -> 'alt_title',
      'author', detail -> 'author',
      'trailer_url', detail -> 'trailer_url',
      'trailer', detail -> 'trailer',
      'trailerUrl', detail -> 'trailerUrl',
      'director', detail -> 'director',
      'directors', detail -> 'directors'
    )
    || jsonb_build_object(
      'cast', detail -> 'cast',
      'characters', detail -> 'characters',
      'production', detail -> 'production',
      'production_team', detail -> 'production_team',
      'producers', detail -> 'producers',
      'staff', detail -> 'staff',
      'studios', detail -> 'studios',
      'studio', detail -> 'studio',
      'network', detail -> 'network',
      'episodes_text', detail -> 'episodes_text'
    )
  ),
  updated_at,
  search_vec,
  surface_type,
  presentation_type,
  origin_type,
  release_country,
  is_nsfw,
  genre_names,
  release_day,
  release_window,
  release_timezone,
  cadence,
  next_release_at,
  is_canonical
from public.media_items;

drop table public.media_items;
alter table public.media_items_compact rename to media_items;
alter table public.media_items add constraint media_items_pkey primary key (item_key);

create index media_items_title_trgm_idx
  on public.media_items using gin (title extensions.gin_trgm_ops);

create index media_items_comic_slug_idx
  on public.media_items ((
    case
      when trim(both '-' from regexp_replace(lower(btrim(coalesce(title, ''))), '[^a-z0-9]+', '-', 'g')) <> ''
        then trim(both '-' from regexp_replace(lower(btrim(coalesce(title, ''))), '[^a-z0-9]+', '-', 'g'))
      when trim(both '-' from regexp_replace(lower(btrim(coalesce(item_key, ''))), '[^a-z0-9]+', '-', 'g')) <> ''
        then 'comic-' || trim(both '-' from regexp_replace(lower(btrim(coalesce(item_key, ''))), '[^a-z0-9]+', '-', 'g'))
      else 'comic'
    end
  ))
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_updated_idx
  on public.media_items (media_type, is_nsfw, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_score_updated_idx
  on public.media_items (media_type, is_nsfw, score desc nulls last, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_search_vec_idx
  on public.media_items using gin (search_vec)
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_detail_genres_idx
  on public.media_items using gin ((detail -> 'genres'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_detail_genre_names_idx
  on public.media_items using gin ((detail -> 'genre_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_comic_detail_category_names_idx
  on public.media_items using gin ((detail -> 'category_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index media_items_genre_names_idx
  on public.media_items using gin (genre_names);

create index media_items_media_type_updated_at_idx
  on public.media_items (media_type, updated_at desc);

create index media_items_origin_type_updated_at_idx
  on public.media_items (origin_type, updated_at desc);

create index media_items_search_vec_idx
  on public.media_items using gin (search_vec);

create index media_items_surface_type_updated_at_idx
  on public.media_items (surface_type, updated_at desc);

create or replace view watch.media_items as
select *
from public.media_items
where surface_type in ('movie', 'series')
   or media_type in ('movie', 'anime', 'donghua', 'kdrama', 'vertical_drama', 'variety');

create or replace view watch.media_units as
select u.*
from public.media_units u
join watch.media_items i on i.item_key = u.item_key
where u.unit_type in ('movie', 'episode');

create or replace view watch.item_enrichments as
select e.*
from public.media_item_enrichments e
join watch.media_items i on i.item_key = e.item_key;

create or replace view watch.stream_options as
select s.*
from public.media_stream_options s
join watch.media_units u on u.unit_key = s.canonical_unit_key;

create or replace view watch.download_options as
select d.*
from public.media_download_options d
join watch.media_units u on u.unit_key = d.canonical_unit_key;

create or replace view "read".media_items as
select *
from public.media_items
where surface_type = 'comic'
   or media_type in ('manga', 'manhwa', 'manhua');

create or replace view "read".media_units as
select u.*
from public.media_units u
join "read".media_items i on i.item_key = u.item_key
where u.unit_type = 'chapter';

create or replace view "read".item_enrichments as
select e.*
from public.media_item_enrichments e
join "read".media_items i on i.item_key = e.item_key;

grant select on all tables in schema watch to authenticated, service_role;
grant select on all tables in schema "read" to authenticated, service_role;

analyze public.media_items;
