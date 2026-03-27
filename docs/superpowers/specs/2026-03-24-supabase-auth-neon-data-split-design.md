# Supabase Auth And Neon Data Split Design

Date: 2026-03-24
Status: Draft

## Goal

Split `dwizzyOS` persistence responsibilities so authentication remains on Supabase while media and app content data move to Neon only when the data tier actually needs it.

The design must:

- keep `auth.dwizzy.my.id` on Supabase Auth
- avoid moving back to local database infrastructure
- minimize egress on hot paths
- allow gradual migration of `dwizzyWEEB` content routes without downtime
- preserve rollback at each phase

## Current State

### 1. Supabase currently carries both auth and app data

Today:

- `dwizzyAUTH` stores sessions and users in Supabase Auth
- `dwizzyAUTH` stores lean profile data in `public.profiles`
- `dwizzyWEEB` reads anime and movie content views directly from Supabase
- `dwizzySCRAPE` writes compact anime and movie models into Supabase-facing schemas/views

This means a single Supabase project is doing two jobs:

- identity backend
- content database

### 2. The current problem is not reliability of auth

`auth.dwizzy.my.id` is already stable on:

- Vercel for the frontend
- Supabase Auth for session issuance and callback handling

The concern is database growth and long-term cost/egress pressure from content reads, not auth availability.

### 3. Moving everything to Neon now would increase risk

`dwizzyAUTH` depends directly on Supabase-specific features:

- `auth.users`
- Supabase OAuth provider management
- Supabase session cookies
- `profiles` foreign key to `auth.users`

Moving auth away from Supabase now would create unnecessary scope and destabilize the only part that has just become reliable.

## Core Decision

### Keep auth on Supabase, move only content data to Neon

The split boundary is:

- **Supabase**
  - `auth.users`
  - auth sessions
  - OAuth provider configuration
  - `public.profiles`
- **Neon**
  - anime catalog/detail/episode content
  - movie catalog/detail/provider/watch content
  - content lookup tables and read views

This is the default target architecture for `dwizzyOS` until proven insufficient.

## Why This Split

### 1. Auth already fits Supabase well

Supabase Auth is already operating as:

- identity provider
- OAuth broker
- session issuer
- cookie refresh source

It is the wrong subsystem to churn while login is being stabilized.

### 2. Content data is the part likely to grow

The high-cardinality data is:

- anime episodes
- watch options
- provider edges
- movie content tables
- future manga and donghua tables

That data is the better candidate for migration because it grows independently of user identity.

### 3. This split allows phased migration

The app can migrate content reads route-by-route while:

- logins keep working
- user records keep working
- profile writes keep working

No user-facing auth cutover is required.

## Target Architecture

### Supabase responsibilities

Supabase remains the canonical system for:

- `auth.users`
- session cookies and refresh
- Discord OAuth provider
- `public.profiles`

`public.profiles` stays intentionally lean:

- `id`
- `display_name`
- `avatar_url`
- `provider`
- timestamps

No media catalog data should live here long-term.

### Neon responsibilities

Neon becomes the canonical system for app content data:

- `anime_list`
- `anime_meta`
- `anime_episodes`
- `movies`
- `movie_meta`
- `movie_provider_records`
- `movie_watch_options`
- `movie_download_options`
- supporting lookup/code tables
- app-facing read views

### Application read split

`dwizzyWEEB` will read from:

- Supabase only for session/profile information when needed
- Neon for anime/movie content reads

`dwizzyAUTH` will continue to read and write only Supabase.

`dwizzySCRAPE` will write content to Neon and will no longer treat Supabase as the primary store for content.

## Integration Principles

### 1. No runtime dependency on scraper uptime

Neither `dwizzyWEEB` nor `dwizzyAUTH` may depend on live scraper processes.

Scraper writes persisted content into Neon. Reads never call the scraper.

### 2. Keep route contracts stable

Route shapes must stay stable during migration:

- `/anime/...`
- `/anime/episode/...`
- `/movies/...`
- `/movies/watch/...`
- search endpoints

Only the backing store changes.

### 3. Introduce a database adapter boundary in `dwizzyWEEB`

Today `dwizzyWEEB` reads Supabase views directly in `anime-source.ts` and `movie-source.ts`.

Before any migration, `dwizzyWEEB` must gain a thin data-provider boundary so routes are not coupled directly to Supabase APIs.

The adapter layer must allow:

- current `supabase` content provider
- future `neon` content provider

without changing route components.

### 4. Use dual-write before cutover

When Neon write paths are introduced:

- the content writer should first dual-write
- read validation should compare Supabase and Neon
- only after row and shape parity is acceptable should app reads switch to Neon

### 5. Keep rollback trivial

Each phase must preserve a fast rollback:

- switch a provider flag back to Supabase
- stop dual-write without losing source data
- restore old read path without schema rebuild

## Data Ownership By Repo

### `dwizzyAUTH`

Owns:

- auth frontend
- callback handling
- logout
- profile bootstrap/update
- auth docs and deploy config

Does not own:

- anime/movie catalog data
- content search
- content watch/download rows

### `dwizzyWEEB`

Owns:

- route loaders
- content read adapters
- session-aware UI
- fallback and error states for unavailable content providers

Does not own:

- auth issuance
- scraper ingestion
- physical database migrations

### `dwizzySCRAPE`

Owns:

- ingestion
- normalization
- content schema migrations
- dual-write and backfill tooling

Does not own:

- auth sessions
- auth profiles
- browser login flows

## Proposed Migration Phases

### Phase 0: Stabilize split contracts

Do not move data yet.

Create:

- provider boundary in `dwizzyWEEB`
- content repository abstraction
- config flags for `supabase` vs `neon`

### Phase 1: Add Neon schema for content

Create Neon equivalents for current compact content models.

No app read cutover yet.

### Phase 2: Add dual-write from `dwizzySCRAPE`

Writers publish the same content to:

- Supabase
- Neon

This phase is for validation only.

### Phase 3: Add Neon read validation

Compare:

- row counts
- null coverage
- representative payload sizes
- sample route correctness

### Phase 4: Cut `dwizzyWEEB` reads to Neon

Switch content read adapters to Neon while auth remains on Supabase.

### Phase 5: Decommission Supabase content tables

Only after Neon is stable:

- stop content writes to Supabase
- archive or drop content views/tables in Supabase
- keep `auth` and `profiles` untouched

## Non-Goals

This split does not include:

- moving auth to Neon
- moving auth to local Postgres
- replacing Supabase OAuth handling
- introducing Web3 auth in this phase
- migrating `dwizzyAUTH` away from Supabase sessions

## Risks

### Risk: cross-database complexity

`dwizzyOS` will have two managed backends:

- Supabase for auth
- Neon for content

This increases operational surface area.

Mitigation:

- keep ownership boundaries strict
- do not duplicate auth-like data in Neon

### Risk: route breakage during provider cutover

Mitigation:

- provider boundary in app
- dual-read validation
- fast rollback flag

### Risk: RLS and session claims mismatch later

If Neon access eventually needs user-aware row filtering, the design must explicitly handle JWT/JWKS trust.

This is not required for the first content migration phase because anime/movie catalog data is public-read.

## Success Criteria

The split is successful when:

- `auth.dwizzy.my.id` still runs on Supabase Auth with no user-visible regression
- `dwizzyWEEB` anime/movie routes read from Neon without route changes
- hot-path payloads stay lean
- Supabase project size and content egress stop growing with media catalog growth
- rollback to Supabase content reads is still possible during rollout
