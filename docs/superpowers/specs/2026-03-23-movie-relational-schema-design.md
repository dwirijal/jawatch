# Movie Relational Schema Design

Date: 2026-03-23
Status: Draft

## Goal

Define a compact relational schema for movie data that:

- uses `tmdb_id` as the canonical identity
- supports many providers for the same movie
- keeps `dwizzyWEEB` independent from live scraper uptime
- keeps list and detail reads small
- stores complete app-usable data in Supabase

This schema is intended to replace the prior movie staging model that was too provider-shaped and too redundant.

## Constraints

- `dwizzyWEEB` must read only from Supabase at runtime
- `dwizzySCRAPE` may be down and the app must still function
- metadata should prefer TMDB
- scraped source data should be used as fallback when TMDB is missing or incomplete
- source URLs should not be stored when `provider_code + slug` is enough
- image fields should be stored as paths, not full URLs
- codes should be used where repeated labels are wasteful

## Approach Options

### Option 1: One Big `movies` Table

Put canonical metadata, provider identity, watch options, and download options in one table with JSON sidecars.

Pros:

- fast to build
- fewer joins

Cons:

- duplicates per-provider facts into canonical rows
- hard to dedupe across providers
- difficult to keep list payloads small
- eventually collapses under multi-provider growth

### Option 2: Canonical Core + Provider Edge Tables

Use one canonical movie table keyed by `tmdb_id`, then attach provider records and watch/download options separately.

Pros:

- stable global identity
- supports many providers cleanly
- canonical metadata remains clean
- watch/download can be stored fully without bloating list/detail
- aligns with the stated requirement that one movie can surface many provider options at once

Cons:

- more joins than a single-table design
- requires matching logic in scraper

### Option 3: Fully Normalized Everything

Split cast, crew, genres, countries, languages, and provider records into fully relational dimensions and join tables.

Pros:

- academically clean
- highly reusable

Cons:

- overkill for current scope
- heavier implementation and migration cost
- not necessary to hit compact runtime goals

## Recommendation

Use **Option 2: canonical core + provider edge tables**.

This is the smallest design that still treats multi-provider storage as a first-class requirement and keeps Supabase as the runtime source of truth.

## Canonical Schema

### `movies`

One canonical row per movie, keyed by `tmdb_id`.

This table stores only stable, global movie metadata required for list and detail surfaces.

Columns:

- `tmdb_id bigint primary key`
- `title text not null default ''`
- `original_title text not null default ''`
- `poster_path text not null default ''`
- `backdrop_path text not null default ''`
- `year smallint`
- `runtime_minutes smallint`
- `rating real not null default 0`
- `status_code char(1) not null default 'r'`
- `language_code char(2) not null default ''`
- `genre_codes smallint[] not null default '{}'`
- `country_codes smallint[] not null default '{}'`
- `overview text not null default ''`
- `tagline text not null default ''`
- `trailer_youtube_id text not null default ''`
- `meta_source_code char(1) not null default 't'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- `poster_path` and `backdrop_path` are relative image paths, not full CDN URLs
- `meta_source_code` identifies where the currently persisted canonical metadata came from
- `overview` should contain the best final overview for app use, not require runtime enrichment

### `movie_meta`

One optional sidecar row per movie.

This table stores fields useful for detail pages but not needed for list or search paths.

Columns:

- `tmdb_id bigint primary key references public.movies(tmdb_id) on delete cascade`
- `cast_json jsonb not null default '[]'::jsonb`
- `director_names text[] not null default '{}'`
- `alt_titles_json jsonb not null default '[]'::jsonb`
- `updated_at timestamptz not null default now()`

Notes:

- `cast_json` remains JSON because the current app does not need relational cast queries
- `director_names` is stored directly because it is small and frequently useful in detail UI
- this table should not hold watch/download/provider facts

## Provider Schema

### `movie_provider_records`

One row per canonical movie per provider slug.

This is the edge that links global movie identity to a provider-specific page.

Columns:

- `id bigserial primary key`
- `tmdb_id bigint not null references public.movies(tmdb_id) on delete cascade`
- `provider_code char(1) not null`
- `provider_movie_slug text not null`
- `provider_title text not null default ''`
- `provider_poster_path text not null default ''`
- `provider_year smallint`
- `provider_rating real not null default 0`
- `quality_code char(1) not null default 'u'`
- `scrape_status_code char(1) not null default 'x'`
- `last_seen_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(provider_code, provider_movie_slug)`

Notes:

- this table is the provenance layer
- provider title/year/rating are optional side facts for audit and fallback use
- this table replaces the need to store canonical URLs

### `movie_watch_options`

One row per playable server/embed option.

Columns:

- `id bigserial primary key`
- `tmdb_id bigint not null references public.movies(tmdb_id) on delete cascade`
- `provider_record_id bigint not null references public.movie_provider_records(id) on delete cascade`
- `provider_code char(1) not null`
- `host_code char(1) not null default 'u'`
- `label text not null default ''`
- `embed_url text not null default ''`
- `lang_code char(2) not null default ''`
- `quality_code char(1) not null default 'u'`
- `priority smallint not null default 0`
- `status_code char(1) not null default 'a'`
- `last_verified_at timestamptz`
- `updated_at timestamptz not null default now()`

Notes:

- multiple watch options for the same provider are expected
- `priority` is for UI ordering
- `status_code` allows a watch option to be retained historically while hidden or downgraded

### `movie_download_options`

One row per downloadable option.

Columns:

- `id bigserial primary key`
- `tmdb_id bigint not null references public.movies(tmdb_id) on delete cascade`
- `provider_record_id bigint not null references public.movie_provider_records(id) on delete cascade`
- `provider_code char(1) not null`
- `host_code char(1) not null default 'u'`
- `label text not null default ''`
- `download_url text not null default ''`
- `quality_code char(1) not null default 'u'`
- `format_code char(1) not null default 'u'`
- `size_label text not null default ''`
- `status_code char(1) not null default 'a'`
- `last_verified_at timestamptz`
- `updated_at timestamptz not null default now()`

Notes:

- download options are intentionally separated from watch options
- `format_code` supports compact differentiation like MP4, MKV, and x265
- `size_label` is stored as display text rather than forced into numeric parsing

## Lookup Tables

### `media_code_genres`

Columns:

- `code smallint primary key`
- `label text not null unique`

### `media_code_countries`

Columns:

- `code smallint primary key`
- `label text not null unique`

Notes:

- providers and simple one-character codes should stay in app and scraper config unless runtime querying requires a database lookup
- genres and countries are worth centralizing because they are reused across the app and are array-valued in canonical rows

## Code Conventions

### `provider_code`

Examples:

- `r` = rebahin
- `p` = pahe
- `l` = lk21

### `meta_source_code`

Examples:

- `t` = tmdb
- `s` = scrape

### `quality_code`

Examples:

- `a` = 360p
- `b` = 480p
- `c` = 720p
- `d` = 1080p
- `e` = 1440p
- `f` = 4k
- `u` = unknown

### `format_code`

Examples:

- `m` = mp4
- `k` = mkv
- `x` = x265
- `u` = unknown

### `status_code`

Examples:

- `a` = active
- `b` = blocked
- `d` = dead
- `x` = unknown

## Read Models

### `movie_list_view`

For home, hubs, and search.

Select only:

- `tmdb_id`
- `title`
- `poster_path`
- `year`
- `rating`
- `genre_codes`
- `updated_at`

This view must never include watch/download payloads.

### `movie_detail_view`

For movie detail pages.

Select:

- all list fields needed by detail
- `original_title`
- `backdrop_path`
- `runtime_minutes`
- `status_code`
- `language_code`
- `country_codes`
- `overview`
- `tagline`
- `trailer_youtube_id`
- `cast_json`
- `director_names`
- `updated_at`

This view still excludes watch/download arrays.

### `movie_watch_summary_view`

For watch page shells.

Select:

- key canonical movie detail fields
- optional aggregated counts like watch option count and download option count

Actual watch and download options should be queried by `tmdb_id` from their own tables, not packed into one wide row.

## Index Strategy

Minimum indexes:

- `movies(updated_at desc)`
- `movies(year)`
- `movie_provider_records(tmdb_id)`
- `movie_provider_records(provider_code, provider_movie_slug)` unique
- `movie_watch_options(tmdb_id, status_code, priority)`
- `movie_download_options(tmdb_id, status_code, quality_code)`

Rationale:

- list and freshness reads stay cheap
- provider lookup stays stable
- watch/download option queries stay scoped to a single canonical movie

## Write Flow

1. Scraper discovers a provider movie page.
2. Scraper resolves or matches it to a `tmdb_id`.
3. Canonical metadata is written to `movies`.
4. Detail-only sidecar data is written to `movie_meta`.
5. Provider identity is written to `movie_provider_records`.
6. Watch/download records are written separately and can be refreshed independently.

This allows a provider row to change without rewriting the canonical movie identity.

## Failure Handling

If a provider is temporarily unavailable:

- `movies` remains valid
- `movie_meta` remains valid
- provider rows may become stale but are not deleted automatically
- watch/download rows can be marked stale or blocked through status codes and verification timestamps

This is the key property that lets the app survive scraper downtime.

## Non-Goals

This document does not yet define:

- series schema
- episode schema for series
- matching confidence logs
- migration SQL from prior movie models
- `dwizzyWEEB` adapter changes

Those should be specified separately after this schema is accepted.
