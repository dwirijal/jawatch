alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_collections enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_history enable row level security;

create policy "profiles own read" on public.profiles
for select using (auth.uid() = id);

create policy "profiles own insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles own update" on public.profiles
for update using (auth.uid() = id);

create policy "prefs own access" on public.user_preferences
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections own access" on public.user_collections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookmarks own access" on public.user_bookmarks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "history own access" on public.user_history
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
