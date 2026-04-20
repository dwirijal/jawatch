create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  provider text,
  birth_date date,
  age_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Base table definitions above are the pre-onboarding bootstrap shape.
-- Apply the migration section below for both fresh bootstrap and existing databases.
alter table public.profiles
add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_content_enabled boolean not null default false,
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

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  chapter_or_episode_id text not null default '',
  progress_seconds numeric,
  progress_percent numeric,
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
