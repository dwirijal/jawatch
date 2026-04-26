-- Hosted Postgres performance indexes for Jawatch media catalog reads.
--
-- Run manually with psql when indexes need to be repaired outside Supabase
-- migrations. These use CONCURRENTLY, so do not wrap this file in an explicit
-- transaction.

set statement_timeout = '10min';
set lock_timeout = '5s';

create index concurrently if not exists media_items_comic_slug_idx
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

create index concurrently if not exists media_items_comic_updated_idx
  on public.media_items (media_type, is_nsfw, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_items_comic_score_updated_idx
  on public.media_items (media_type, is_nsfw, score desc nulls last, updated_at desc)
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_items_comic_search_vec_idx
  on public.media_items using gin (search_vec)
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_items_comic_detail_genres_idx
  on public.media_items using gin ((detail -> 'genres'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_items_comic_detail_genre_names_idx
  on public.media_items using gin ((detail -> 'genre_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_items_comic_detail_category_names_idx
  on public.media_items using gin ((detail -> 'category_names'))
  where media_type in ('manga', 'manhwa', 'manhua');

create index concurrently if not exists media_units_ready_chapter_item_order_idx
  on public.media_units (item_key, number desc nulls last, published_at desc nulls last, updated_at desc)
  where unit_type = 'chapter'
    and coalesce(jsonb_array_length(detail->'pages'), 0) > 0;

create index concurrently if not exists media_item_enrichments_provider_match_idx
  on public.media_item_enrichments (item_key, provider, match_status, updated_at desc);

analyze public.media_items;
analyze public.media_units;
analyze public.media_item_enrichments;
