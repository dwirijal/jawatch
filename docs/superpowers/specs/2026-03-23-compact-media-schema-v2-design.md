# Compact Media Schema V2 Design

## Goal

Reduce Supabase egress and payload redundancy by introducing a new compact media schema that prefers global metadata providers first:

- Anime: MyAnimeList/Jikan first
- Movies: TMDB first
- Scraped source metadata only when the global source is missing

The new model is additive. Existing backfill jobs continue to write to the current tables until coverage is good enough for a controlled migration.

## Scope

This design covers:

- new compact anime storage
- new compact movie storage
- code/value normalization for repeated strings
- migration strategy from current tables to compact tables
- read-path implications for `dwizzyWEEB`

This design does not yet cover:

- delete/drop of old tables
- provider matching across anime/movie alternatives
- series schema for LK21

## Problems With Current Shape

Current tables are operationally useful but still too redundant for long-term free-tier efficiency:

- anime splits core identity across `samehadaku_anime_catalog` and `samehadaku_anime_details`
- movie metadata is partially duplicated between scrape fields and global enrichment
- `canonical_url` is stored even though it can be rebuilt from `source + slug`
- full domains are stored inside poster URLs even when a path or asset key is enough
- repeated labels like season/status/type consume egress on every request
- heavy blobs for cast/trailer are mixed too close to hot list/detail reads

## Design Principles

1. Store one canonical value per field.
   If MAL/TMDB has it, store that. Only fall back to scrape when global metadata is missing.

2. Derive URLs at read time.
   Store `source` and `slug`, not `canonical_url`.

3. Compress repeated enums.
   Use short codes for season, status, type, and source.

4. Split hot reads from heavy blobs.
   Main list/detail rows stay compact. Cast, trailers, and watch payloads live in sidecars.

5. Migrate additively.
   Build new tables first, migrate old rows into them, then switch readers.

## New Anime Model

### `anime_list`

Single compact row for list + detail hot path.

Suggested columns:

- `slug text primary key`
- `source_code char(1)`  
  `s` = Samehadaku
- `meta_source_code char(1)`  
  `m` = MAL, `s` = scrape
- `mal_id bigint`
- `title text`
- `alt_title text`
- `poster_path text`
- `type_code char(1)`  
  `t` = TV, `m` = movie, `o` = OVA, `n` = ONA, `p` = special, `u` = unknown
- `status_code char(1)`  
  `a` = airing, `f` = finished, `u` = upcoming, `x` = unknown
- `season_code char(1)`  
  `w` = winter, `p` = spring, `s` = summer, `f` = fall, `x` = unknown
- `year smallint`
- `score real`
- `episode_count integer`
- `genre_codes smallint[]`
- `studio_codes smallint[]`
- `synopsis text`
- `updated_at timestamptz`

### `anime_meta`

Heavy but still non-episode-specific fields.

Suggested columns:

- `slug text primary key references anime_list(slug)`
- `trailer_youtube_id text`
- `cast_json jsonb`
- `meta_updated_at timestamptz`

### `anime_episodes`

Episode-specific payload only.

Suggested columns:

- `episode_slug text primary key`
- `anime_slug text references anime_list(slug)`
- `episode_number numeric`
- `title text`
- `release_at timestamptz`
- `fetch_status_code char(1)`  
  `p` = primary_ok, `s` = secondary_ok, `b` = blocked, `x` = unknown
- `stream_links_json jsonb`
- `download_links_json jsonb`
- `updated_at timestamptz`

## New Movie Model

### `movie_list`

Compact row for list + detail hot path.

Suggested columns:

- `slug text primary key`
- `source_code char(1)`  
  `l` = LK21
- `meta_source_code char(1)`  
  `t` = TMDB, `s` = scrape
- `tmdb_id integer`
- `title text`
- `poster_path text`
- `year smallint`
- `rating real`
- `duration_minutes integer`
- `quality_code char(1)`  
  `b` = BluRay, `w` = WEB-DL, `h` = HDTV, `u` = unknown
- `genre_codes smallint[]`
- `synopsis text`
- `updated_at timestamptz`

### `movie_meta`

Heavy metadata.

Suggested columns:

- `slug text primary key references movie_list(slug)`
- `trailer_youtube_id text`
- `cast_json jsonb`
- `director_names text[]`
- `meta_updated_at timestamptz`

### `movie_watch`

Watch/download-specific payload.

Suggested columns:

- `slug text primary key references movie_list(slug)`
- `stream_links_json jsonb`
- `download_links_json jsonb`
- `download_status_code char(1)`  
  `r` = ready, `b` = blocked, `p` = pending, `x` = unknown
- `watch_updated_at timestamptz`

## Asset Storage Rules

### Posters

Store path or provider-relative asset key only.

Examples:

- MAL: `/images/anime/1078/151796l.webp`
- TMDB: `/y3HOTTyM5nLsdUzXFtFCohG28qj.jpg`

The application resolves:

- MAL poster base: `https://cdn.myanimelist.net`
- TMDB poster base: `https://image.tmdb.org/t/p/w500`

### External Source Links

Do not store full canonical source URL.

Build from:

- anime source page: `source_code + slug`
- anime episode page: `source_code + episode_slug`
- movie source page: `source_code + slug`

## Lookup Tables

To keep egress low without losing readable UI labels, repeated labels move to lookup dictionaries.

Suggested lookup tables:

- `genre_dim`
- `studio_dim`

`dwizzyWEEB` can also cache small static dictionaries locally for render mapping if we want to avoid join-heavy reads.

## Request Budget Target

Target response budgets:

- anime list card batch: under `8 KB`
- movie list card batch: under `8 KB`
- anime detail hot path row: under `8 KB`
- movie detail hot path row: under `8 KB`

Heavy blobs like cast and watch payloads are intentionally excluded from the main row budget.

## Migration Strategy

1. Keep old tables live and keep backfill running.
2. Create new compact tables and lookup tables.
3. Write migration jobs that map old rows into new rows.
4. Validate row counts and field coverage.
5. Switch `dwizzyWEEB` readers to new compact tables.
6. Keep old tables as rollback source until stable.
7. Only then consider deprecating old read paths.

## Read Path Strategy

`dwizzyWEEB` should eventually read:

- list pages from `anime_list` / `movie_list`
- detail pages from `anime_list` + `anime_meta` or `movie_list` + `movie_meta`
- watch pages from `anime_episodes` or `movie_watch`

This keeps list/detail reads compact while isolating the larger JSON payloads to routes that actually need them.

## Recommendation

Proceed with additive schema v2, not in-place mutation.

That means:

- keep current tables as ingestion staging
- build compact tables beside them
- migrate after backfill coverage is acceptable
- cut over `dwizzyWEEB` only after validation

This is the safest path that still meaningfully reduces egress.
