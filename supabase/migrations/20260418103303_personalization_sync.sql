create extension if not exists pgcrypto;

alter table if exists public.user_history
add column if not exists title text;

alter table if exists public.user_history
add column if not exists image_url text;

alter table if exists public.user_history
add column if not exists unit_label text;

alter table if exists public.user_history
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
  if to_regclass('public.user_history') is not null then
    alter table public.user_history enable row level security;
    drop policy if exists "history own access" on public.user_history;
    create policy "history own access" on public.user_history
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.community_unit_likes') is not null then
    alter table public.community_unit_likes enable row level security;
    drop policy if exists "community likes authenticated read" on public.community_unit_likes;
    create policy "community likes authenticated read" on public.community_unit_likes
      for select using (auth.uid() is not null);
    drop policy if exists "community likes own write" on public.community_unit_likes;
    create policy "community likes own write" on public.community_unit_likes
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.community_unit_comments') is not null then
    alter table public.community_unit_comments enable row level security;
    drop policy if exists "community comments authenticated read" on public.community_unit_comments;
    create policy "community comments authenticated read" on public.community_unit_comments
      for select using (auth.uid() is not null);
    drop policy if exists "community comments own write" on public.community_unit_comments;
    create policy "community comments own write" on public.community_unit_comments
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
