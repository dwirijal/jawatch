set lock_timeout = '5s';
set statement_timeout = '2min';

-- Jawatch keeps only media catalog data in this Supabase project.
-- User profile, preference, history, bookmark, and community data lives in the
-- dwizzyOS Supabase database instead.
drop table if exists public.community_unit_comments cascade;
drop table if exists public.community_unit_likes cascade;
drop table if exists public.user_bookmarks cascade;
drop table if exists public.user_collections cascade;
drop table if exists public.user_genre_preferences cascade;
drop table if exists public.user_history cascade;
drop table if exists public.user_media_preferences cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.user_title_seeds cascade;
drop table if exists public.profiles cascade;

-- Keep the media_unit_links data, but remove the heavier reverse lookup index to
-- fit the free database quota. Forward canonical lookups still use
-- media_unit_links_source_unit_key_idx.
drop index if exists public.media_unit_links_canonical_unit_key_priority_updated_at_idx;
