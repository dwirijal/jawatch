do $$
begin
  if to_regclass('public.community_unit_likes') is not null then
    drop policy if exists "community likes authenticated read" on public.community_unit_likes;
    drop policy if exists "community likes own write" on public.community_unit_likes;
    drop policy if exists "community likes own insert" on public.community_unit_likes;
    drop policy if exists "community likes own update" on public.community_unit_likes;
    drop policy if exists "community likes own delete" on public.community_unit_likes;

    create policy "community likes authenticated read" on public.community_unit_likes
      for select to authenticated using ((select auth.uid()) is not null);
    create policy "community likes own insert" on public.community_unit_likes
      for insert to authenticated with check ((select auth.uid()) = user_id);
    create policy "community likes own update" on public.community_unit_likes
      for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    create policy "community likes own delete" on public.community_unit_likes
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.community_unit_comments') is not null then
    drop policy if exists "community comments authenticated read" on public.community_unit_comments;
    drop policy if exists "community comments own write" on public.community_unit_comments;
    drop policy if exists "community comments own insert" on public.community_unit_comments;
    drop policy if exists "community comments own update" on public.community_unit_comments;
    drop policy if exists "community comments own delete" on public.community_unit_comments;

    create policy "community comments authenticated read" on public.community_unit_comments
      for select to authenticated using ((select auth.uid()) is not null);
    create policy "community comments own insert" on public.community_unit_comments
      for insert to authenticated with check ((select auth.uid()) = user_id);
    create policy "community comments own update" on public.community_unit_comments
      for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
    create policy "community comments own delete" on public.community_unit_comments
      for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end
$$;
