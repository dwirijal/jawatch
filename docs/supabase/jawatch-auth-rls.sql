do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;
    drop policy if exists "profiles own read" on public.profiles;
    create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
    drop policy if exists "profiles own insert" on public.profiles;
    create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);
    drop policy if exists "profiles own update" on public.profiles;
    -- Includes onboarding profile fields such as onboarding_completed_at.
    create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_preferences') is not null then
    alter table public.user_preferences enable row level security;
    drop policy if exists "prefs own access" on public.user_preferences;
    -- Includes onboarding preference fields such as adult_content_choice_set_at,
    -- newsletter_opt_in, and community_opt_in.
    create policy "prefs own access" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_media_preferences') is not null then
    alter table public.user_media_preferences enable row level security;
    drop policy if exists "media prefs own access" on public.user_media_preferences;
    create policy "media prefs own access" on public.user_media_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_genre_preferences') is not null then
    alter table public.user_genre_preferences enable row level security;
    drop policy if exists "genre prefs own access" on public.user_genre_preferences;
    create policy "genre prefs own access" on public.user_genre_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_title_seeds') is not null then
    alter table public.user_title_seeds enable row level security;
    drop policy if exists "title seeds own access" on public.user_title_seeds;
    create policy "title seeds own access" on public.user_title_seeds for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_collections') is not null then
    alter table public.user_collections enable row level security;
    drop policy if exists "collections own access" on public.user_collections;
    create policy "collections own access" on public.user_collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_bookmarks') is not null then
    alter table public.user_bookmarks enable row level security;
    drop policy if exists "bookmarks own access" on public.user_bookmarks;
    create policy "bookmarks own access" on public.user_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_history') is not null then
    alter table public.user_history enable row level security;
    drop policy if exists "history own access" on public.user_history;
    create policy "history own access" on public.user_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
