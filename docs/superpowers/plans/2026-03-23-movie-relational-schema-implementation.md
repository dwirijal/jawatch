# Movie Relational Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the new compact multi-provider movie schema in `dwizzySCRAPE`, keyed by `tmdb_id`, so Supabase can become the complete runtime source of truth for movie data.

**Architecture:** Add a new canonical movie core (`movies`, `movie_meta`) plus provider edge tables (`movie_provider_records`, `movie_watch_options`, `movie_download_options`) and thin read views. Keep the existing movie runtime disabled during implementation, backfill the new schema from a future provider pipeline, and only cut over `dwizzyWEEB` after the new model is populated and verified.

**Tech Stack:** PostgreSQL on Supabase, SQL migrations, Go CLI (`dwizzyscrape`), Supabase REST/admin APIs, TMDB-enriched normalized storage.

---

### Task 1: Add Canonical Movie Core Tables

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/026_movies_core_v3.sql`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-23-movie-relational-schema-design.md`

- [ ] Create `public.movies` keyed by `tmdb_id`.
- [ ] Add columns:
  - `title`
  - `original_title`
  - `poster_path`
  - `backdrop_path`
  - `year`
  - `runtime_minutes`
  - `rating`
  - `status_code`
  - `language_code`
  - `genre_codes`
  - `country_codes`
  - `overview`
  - `tagline`
  - `trailer_youtube_id`
  - `meta_source_code`
  - timestamps
- [ ] Add `public.movie_meta` keyed by `tmdb_id`.
- [ ] Add columns:
  - `cast_json`
  - `director_names`
  - `alt_titles_json`
  - `updated_at`
- [ ] Add indexes:
  - `movies(updated_at desc)`
  - `movies(year)`
- [ ] Run bootstrap after writing the migration.

### Task 2: Add Provider Edge Tables

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/027_movie_provider_edges_v3.sql`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-23-movie-relational-schema-design.md`

- [ ] Create `public.movie_provider_records`.
- [ ] Add columns:
  - `id`
  - `tmdb_id`
  - `provider_code`
  - `provider_movie_slug`
  - `provider_title`
  - `provider_poster_path`
  - `provider_year`
  - `provider_rating`
  - `quality_code`
  - `scrape_status_code`
  - `last_seen_at`
  - `updated_at`
- [ ] Add unique constraint on `(provider_code, provider_movie_slug)`.
- [ ] Create `public.movie_watch_options`.
- [ ] Add columns:
  - `tmdb_id`
  - `provider_record_id`
  - `provider_code`
  - `host_code`
  - `label`
  - `embed_url`
  - `lang_code`
  - `quality_code`
  - `priority`
  - `status_code`
  - `last_verified_at`
  - `updated_at`
- [ ] Create `public.movie_download_options`.
- [ ] Add columns:
  - `tmdb_id`
  - `provider_record_id`
  - `provider_code`
  - `host_code`
  - `label`
  - `download_url`
  - `quality_code`
  - `format_code`
  - `size_label`
  - `status_code`
  - `last_verified_at`
  - `updated_at`
- [ ] Add indexes:
  - `movie_provider_records(tmdb_id)`
  - `movie_watch_options(tmdb_id, status_code, priority)`
  - `movie_download_options(tmdb_id, status_code, quality_code)`
- [ ] Run bootstrap and verify tables exist.

### Task 3: Extend Lookup Dimensions For Movie Codes

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/022_media_lookup_dims.sql`

- [ ] Add or confirm helper code mappings for:
  - genre codes
  - country codes
  - provider codes
  - quality codes
  - format codes
  - status codes
- [ ] Keep verbose provider labels out of the main relational tables unless required for runtime lookup.
- [ ] Ensure the dimension refresh path does not depend on deleted legacy movie tables.
- [ ] Run bootstrap and verify no SQL regression in anime refresh functions.

### Task 4: Add Movie V3 Read Views

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/026_movie_v3_read_views.sql`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`

- [ ] Create `public.movie_list_v3_view` selecting only:
  - `tmdb_id`
  - `title`
  - `poster_path`
  - `year`
  - `rating`
  - `genre_codes`
  - `updated_at`
- [ ] Create `public.movie_detail_v3_view` selecting movie detail fields plus `movie_meta`.
- [ ] Create `public.movie_watch_summary_v3_view` selecting canonical watch shell fields and optional counts only.
- [ ] Add a new refresh function, for example `public.refresh_movie_v3()`, if any denormalized columns or helper views need rebuilding.
- [ ] Add CLI command support in `main.go` for `refresh-movie-v3`.
- [ ] Keep movie v3 refresh independent from anime refresh.

### Task 5: Add Movie V3 Store Interfaces

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_v3_store.go`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/catalog_store.go`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/anime_detail_store.go`

- [ ] Define Go payload structs for:
  - canonical movie rows
  - movie meta rows
  - provider records
  - watch options
  - download options
- [ ] Implement Supabase REST upsert helpers for each table.
- [ ] Keep write functions table-specific, not one giant upsert method.
- [ ] Add small focused tests for payload normalization if the repo already has test helpers for store code.

### Task 6: Add Movie V3 Refresh/Backfill SQL Path

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/027_backfill_movie_v3.sql`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`

- [ ] Define SQL helpers that can populate or re-populate compact read shapes once source ingestion is available.
- [ ] If no active movie scraper exists yet, make the function safe to run on an empty movie v3 schema.
- [ ] Add CLI support for:
  - `refresh-movie-v3`
  - optional `refresh-media-v3` later, only if anime v3 and movie v3 need a combined refresh entrypoint
- [ ] Ensure these functions do not reintroduce old movie staging dependencies.

### Task 7: Reintroduce Movie Scraper Write Path Against V3

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`
- Create or modify: future source package files under `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/README.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/.env.example`

- [ ] Re-enable movie command entries only after a new provider source is chosen.
- [ ] Make the scraper write into:
  - `movies`
  - `movie_meta`
  - `movie_provider_records`
  - `movie_watch_options`
  - `movie_download_options`
- [ ] Use TMDB as canonical metadata source and fallback to scrape only when needed.
- [ ] Match each provider movie to a `tmdb_id` before writing provider edges.
- [ ] Update README commands to describe the new movie v3 path and not the deleted legacy movie tables.

### Task 8: Add Verification Coverage

**Files:**
- Verify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/026_movies_core_v3.sql`
- Verify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/027_movie_provider_edges_v3.sql`
- Verify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/026_movie_v3_read_views.sql`
- Verify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_v3_store.go`
- Verify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`

- [ ] Run `cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE && go test ./... -count=1`.
- [ ] Run `cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE && go run ./cmd/dwizzyscrape bootstrap`.
- [ ] Run `cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE && go run ./cmd/dwizzyscrape refresh-movie-v3` or the chosen refresh command.
- [ ] Verify Supabase REST endpoints respond for:
  - `movie_list_v3_view`
  - `movie_detail_v3_view`
  - `movie_watch_summary_v3_view`
- [ ] Confirm anime v2 refresh still works after movie schema additions.

### Task 9: Prepare `dwizzyWEEB` Cutover Plan, But Do Not Execute Yet

**Files:**
- Reference only: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/movie-source.ts`
- Reference only: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/app/movies/`

- [ ] Document the future read mapping from movie v3 views into `dwizzyWEEB`.
- [ ] Do not re-enable movie routes yet.
- [ ] Wait until movie v3 has sufficient populated rows before restoring public movie surfaces.

### Task 10: Cleanup Legacy Movie Code After V3 Is Live

**Files:**
- Modify later: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_detail_store.go`
- Modify later: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_catalog_store.go`
- Modify later: any source-specific legacy movie files that still target deleted tables

- [ ] Remove dead code that still points to deleted movie v1/v2 tables.
- [ ] Keep cleanup separate from schema introduction to reduce migration risk.
- [ ] Only perform this after the new movie v3 ingestion path is verified.
