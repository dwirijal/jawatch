create index if not exists media_items_comic_search_vec_idx
  on public.media_items using gin (search_vec)
  where media_type in ('manga', 'manhwa', 'manhua');
