# Compact Media Schema V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce new compact media tables and migrate `dwizzyWEEB` read paths toward a low-egress model without interrupting active scraper backfills.

**Architecture:** Keep current scraper tables as staging, add compact v2 tables beside them, migrate existing rows into v2, then switch application readers after validation. Heavy payloads like cast, trailer, and watch data stay outside the primary list/detail rows.

**Tech Stack:** Go scraper CLI, Supabase/Postgres, Next.js App Router, server-side Supabase REST reads

---

### Task 1: Add Compact Schema V2 Spec References

**Files:**
- Reference: `docs/superpowers/specs/2026-03-23-compact-media-schema-v2-design.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/README.md`

- [ ] Add a short README section documenting compact v2 tables as additive read model, not replacement.
- [ ] Note that old tables remain scraper staging until cutover is complete.

### Task 2: Create Compact Anime Tables

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/016_anime_list_v2.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/017_anime_meta_v2.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/018_anime_episodes_v2.sql`

- [ ] Create `anime_list` with compressed fields and no canonical URLs.
- [ ] Create `anime_meta` for trailer and cast payloads.
- [ ] Create `anime_episodes` for stream/download data.
- [ ] Add indexes on `slug`, `mal_id`, `updated_at`, and `anime_slug`.

### Task 3: Create Compact Movie Tables

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/019_movie_list_v2.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/020_movie_meta_v2.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/021_movie_watch_v2.sql`

- [ ] Create `movie_list` with TMDB-first compact fields.
- [ ] Create `movie_meta` for cast/director/trailer payloads.
- [ ] Create `movie_watch` for stream/download payloads and short status codes.
- [ ] Add indexes on `slug`, `tmdb_id`, and `updated_at`.

### Task 4: Add Lookup Tables And Code Dictionaries

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/022_media_lookup_dims.sql`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/docs/` or `README.md`

- [ ] Add lookup tables or seed dictionaries for `genre` and `studio`.
- [ ] Define season, status, source, type, and quality code mappings in docs.
- [ ] Keep mappings deterministic so app-side decode is stable.

### Task 5: Build Migration SQL Or ETL For Anime

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/023_backfill_anime_v2.sql` or Go migration worker under `internal/`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`

- [ ] Add migration command for filling `anime_list`, `anime_meta`, and `anime_episodes` from old tables.
- [ ] Resolve preferred metadata source: MAL first, scrape only as fallback.
- [ ] Convert long enums to compact codes during migration.
- [ ] Strip poster domains down to provider-relative paths.

### Task 6: Build Migration SQL Or ETL For Movies

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/024_backfill_movie_v2.sql` or Go migration worker under `internal/`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`

- [ ] Add migration command for `movie_list`, `movie_meta`, and `movie_watch`.
- [ ] Resolve preferred metadata source: TMDB first, scrape only as fallback.
- [ ] Convert quality strings to codes and duration strings to minutes.
- [ ] Strip TMDB poster URLs to path-only storage.

### Task 7: Add Compact Read Views For V2

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/025_media_v2_read_views.sql`

- [ ] Create app-facing compact views for list/detail/watch reads.
- [ ] Ensure each view exposes only the columns needed by its route.
- [ ] Keep heavy JSON out of list/detail hot-path views.

### Task 8: Validate Payload Budgets

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/docs/payload-budget-v2.md`
- Optional script: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/...`

- [ ] Measure representative Supabase responses for anime list, anime detail, movie list, and movie detail.
- [ ] Verify hot-path queries stay under `8 KB`.
- [ ] Record any outliers and adjust fields if needed.

### Task 9: Switch `dwizzyWEEB` To V2 Read Model

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/anime-source.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/movie-source.ts`
- Modify route handlers if search/read paths need new tables or views

- [ ] Point anime list/detail/watch to v2 compact views.
- [ ] Point movie list/detail/watch to v2 compact views.
- [ ] Keep URL derivation inside the app from `source_code + slug`.
- [ ] Verify no route still depends on old canonical URL storage.

### Task 10: Validate And Hold Old Tables As Rollback

**Files:**
- Modify: docs as needed

- [ ] Compare old/new row counts and null coverage.
- [ ] Smoke test production-critical pages.
- [ ] Keep old tables untouched as rollback source until v2 proves stable.
- [ ] Only then plan final cleanup migration.
