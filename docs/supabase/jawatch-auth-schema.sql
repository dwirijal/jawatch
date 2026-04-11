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

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_content_enabled boolean not null default false,
  subtitle_locale text,
  theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
