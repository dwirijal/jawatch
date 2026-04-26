create extension if not exists pgcrypto;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  provider text,
  birth_date date,
  age_verified_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists onboarding_completed_at timestamptz;

create index if not exists profiles_email_idx
  on public.profiles (email)
  where email is not null;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_content_enabled boolean not null default false,
  adult_content_choice_set_at timestamptz,
  newsletter_opt_in boolean not null default false,
  community_opt_in boolean not null default false,
  subtitle_locale text,
  theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences
add column if not exists adult_content_choice_set_at timestamptz;

alter table public.user_preferences
add column if not exists newsletter_opt_in boolean not null default false;

alter table public.user_preferences
add column if not exists community_opt_in boolean not null default false;

create table if not exists public.user_media_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, media_type)
);

create table if not exists public.user_genre_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  genre_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, genre_key)
);

create table if not exists public.user_title_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  media_type text,
  source text not null default 'onboarding',
  created_at timestamptz not null default now()
);

create index if not exists user_title_seeds_user_created_idx
  on public.user_title_seeds (user_id, created_at desc);

create table if not exists public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id)
);

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  chapter_or_episode_id text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id, chapter_or_episode_id)
);

create index if not exists user_bookmarks_user_created_idx
  on public.user_bookmarks (user_id, created_at desc);

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  chapter_or_episode_id text not null default '',
  progress_seconds numeric,
  progress_percent numeric,
  title text,
  image_url text,
  unit_label text,
  unit_href text,
  last_seen_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id, chapter_or_episode_id)
);

alter table public.user_history
add column if not exists title text;

alter table public.user_history
add column if not exists image_url text;

alter table public.user_history
add column if not exists unit_label text;

alter table public.user_history
add column if not exists unit_href text;

create index if not exists user_history_user_seen_idx
  on public.user_history (user_id, last_seen_at desc);

create table if not exists public.community_unit_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id text not null,
  title_label text not null,
  unit_id text not null,
  unit_label text not null,
  unit_href text not null,
  media_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title_id, unit_id)
);

create index if not exists community_unit_likes_title_unit_idx
  on public.community_unit_likes (title_id, unit_id);

create table if not exists public.community_unit_comments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id text not null,
  title_label text not null,
  unit_id text not null,
  unit_label text not null,
  unit_href text not null,
  media_type text not null,
  author_name text not null,
  content text not null,
  parent_id text references public.community_unit_comments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_unit_comments_title_unit_idx
  on public.community_unit_comments (title_id, unit_id, created_at desc);

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;
    drop policy if exists "profiles own read" on public.profiles;
    create policy "profiles own read" on public.profiles for select using ((select auth.uid()) = id);
    drop policy if exists "profiles own insert" on public.profiles;
    create policy "profiles own insert" on public.profiles for insert with check ((select auth.uid()) = id);
    drop policy if exists "profiles own update" on public.profiles;
    create policy "profiles own update" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_preferences') is not null then
    alter table public.user_preferences enable row level security;
    drop policy if exists "prefs own access" on public.user_preferences;
    create policy "prefs own access" on public.user_preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_media_preferences') is not null then
    alter table public.user_media_preferences enable row level security;
    drop policy if exists "media prefs own access" on public.user_media_preferences;
    create policy "media prefs own access" on public.user_media_preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_genre_preferences') is not null then
    alter table public.user_genre_preferences enable row level security;
    drop policy if exists "genre prefs own access" on public.user_genre_preferences;
    create policy "genre prefs own access" on public.user_genre_preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_title_seeds') is not null then
    alter table public.user_title_seeds enable row level security;
    drop policy if exists "title seeds own access" on public.user_title_seeds;
    create policy "title seeds own access" on public.user_title_seeds for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_collections') is not null then
    alter table public.user_collections enable row level security;
    drop policy if exists "collections own access" on public.user_collections;
    create policy "collections own access" on public.user_collections for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_bookmarks') is not null then
    alter table public.user_bookmarks enable row level security;
    drop policy if exists "bookmarks own access" on public.user_bookmarks;
    create policy "bookmarks own access" on public.user_bookmarks for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_history') is not null then
    alter table public.user_history enable row level security;
    drop policy if exists "history own access" on public.user_history;
    create policy "history own access" on public.user_history for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.community_unit_likes') is not null then
    alter table public.community_unit_likes enable row level security;
    drop policy if exists "community likes authenticated read" on public.community_unit_likes;
    create policy "community likes authenticated read" on public.community_unit_likes
      for select to authenticated using ((select auth.uid()) is not null);
    drop policy if exists "community likes own write" on public.community_unit_likes;
    drop policy if exists "community likes own insert" on public.community_unit_likes;
    create policy "community likes own insert" on public.community_unit_likes
      for insert to authenticated with check ((select auth.uid()) = user_id);
    drop policy if exists "community likes own update" on public.community_unit_likes;
    create policy "community likes own update" on public.community_unit_likes
      for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    drop policy if exists "community likes own delete" on public.community_unit_likes;
    create policy "community likes own delete" on public.community_unit_likes
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.community_unit_comments') is not null then
    alter table public.community_unit_comments enable row level security;
    drop policy if exists "community comments authenticated read" on public.community_unit_comments;
    create policy "community comments authenticated read" on public.community_unit_comments
      for select to authenticated using ((select auth.uid()) is not null);
    drop policy if exists "community comments own write" on public.community_unit_comments;
    drop policy if exists "community comments own insert" on public.community_unit_comments;
    create policy "community comments own insert" on public.community_unit_comments
      for insert to authenticated with check ((select auth.uid()) = user_id);
    drop policy if exists "community comments own update" on public.community_unit_comments;
    create policy "community comments own update" on public.community_unit_comments
      for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    drop policy if exists "community comments own delete" on public.community_unit_comments;
    create policy "community comments own delete" on public.community_unit_comments
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end
$$;

create index if not exists media_items_title_trgm_idx
  on public.media_items using gin (title extensions.gin_trgm_ops);

create index if not exists media_items_comic_slug_idx
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

create index if not exists media_items_comic_updated_idx
  on public.media_items (media_type, is_nsfw, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_items_comic_score_updated_idx
  on public.media_items (media_type, is_nsfw, score desc nulls last, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_items_comic_search_vec_idx
  on public.media_items using gin (search_vec)
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_items_comic_detail_genres_idx
  on public.media_items using gin ((detail -> 'genres'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_items_comic_detail_genre_names_idx
  on public.media_items using gin ((detail -> 'genre_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_items_comic_detail_category_names_idx
  on public.media_items using gin ((detail -> 'category_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index if not exists media_units_ready_chapter_item_order_idx
  on public.media_units (item_key, number desc nulls last, published_at desc nulls last, updated_at desc)
  where unit_type = 'chapter'
    and coalesce(jsonb_array_length(detail->'pages'), 0) > 0;

create index if not exists media_item_enrichments_provider_match_idx
  on public.media_item_enrichments (item_key, provider, match_status, updated_at desc);

create schema if not exists watch;
create schema if not exists "read";

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

create or replace view "read".reader_options as
select r.*
from public.media_reader_options r
join "read".media_units u on u.unit_key = r.canonical_unit_key;

grant usage on schema watch, "read" to authenticated, service_role;
grant select on all tables in schema watch to authenticated, service_role;
grant select on all tables in schema "read" to authenticated, service_role;

analyze public.media_items;
analyze public.media_units;
analyze public.media_item_enrichments;
analyze public.media_reader_options;
analyze public.media_stream_options;
analyze public.media_download_options;
analyze public.media_item_links;
analyze public.media_unit_links;
