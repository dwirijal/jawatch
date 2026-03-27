# Movie Metadata Storage Principles

Date: 2026-03-23
Status: Draft

## Goal

Define storage principles for the next movie data model so `dwizzyWEEB` can read complete movie data from Supabase without depending on live scraper uptime or live TMDB requests.

## Core Decisions

### 1. Supabase Is The Runtime Source Of Truth

`dwizzyWEEB` must not depend on `dwizzySCRAPE`, TMDB, or provider sites at request time.

All data required by:

- movie list
- movie detail
- movie watch
- movie download

must already exist in Supabase in normalized form.

### 2. TMDB Is The Canonical Movie Identity

The canonical key for movies is `tmdb_id`.

Provider slugs are not canonical. They are only provider edges attached to a canonical movie.

This allows:

- multiple providers for one movie
- provider replacement without duplicating movies
- stable joins across metadata, watch options, and downloads

### 3. Multi-Provider Is A First-Class Requirement

One movie can have:

- many provider records
- many watch options
- many download options

The data model must support showing all provider options side by side in the UI.

### 4. Persist Final Normalized Data, Not Runtime Dependencies

If metadata is needed by the app, it should be stored in Supabase.

Do not assume it can always be re-fetched from:

- TMDB
- provider HTML
- provider APIs
- `dwizzySCRAPE`

because scraper uptime is not guaranteed.

### 5. Compact Storage By Default

Store compact normalized values where possible:

- `poster_path`, not full image URL
- `backdrop_path`, not full image URL
- `trailer_youtube_id`, not full YouTube URL
- `provider_code`, not repeated provider name/domain text
- `provider_movie_slug`, not canonical URL
- `quality_code`, `format_code`, `status_code`, not verbose strings
- `genre_codes`, `country_codes`, not repeated labels

Build human-readable URLs and labels in read adapters or lookup views.

### 6. Prefer TMDB For Global Metadata, Fallback To Scrape

Metadata priority:

1. TMDB
2. scraped provider metadata if TMDB is unavailable or incomplete

This applies to:

- title normalization
- poster/backdrop
- overview
- tagline
- genres
- countries
- runtime
- trailer
- cast/director where available

### 7. Keep Provider Data Separate From Canonical Movie Data

Provider-specific facts must not pollute the canonical movie row.

Examples of provider data:

- provider slug
- provider-specific title
- source quality labels
- watch servers
- embed URLs
- download URLs
- scrape status
- verification timestamps

These belong in provider edge tables, not the canonical movie table.

### 8. Read Models Must Be Smaller Than Write Models

The app should read from thin views or dedicated read models:

- list view
- detail view
- watch view

This keeps egress low and avoids loading watch/download payloads into list routes.

### 9. Store Complete App-Useful Data, Not Raw Blobs

Do not store full raw HTML or full raw TMDB payloads in the main relational model.

Store only the app-useful normalized result:

- titles
- poster/backdrop paths
- overview
- cast
- director names
- watch options
- download options

Raw payload retention is optional and should not be part of the hot-path schema.

### 10. Freshness Must Be Explicit

Every provider-derived record should include freshness indicators such as:

- `updated_at`
- `last_seen_at`
- `last_verified_at`

The app should degrade gracefully when a provider option becomes stale, instead of failing hard.

## Practical Implication

The movie schema should be designed around:

- one canonical movie row keyed by `tmdb_id`
- one metadata sidecar row for fields not needed in lists
- one provider-record table for source identity
- one watch-options table
- one download-options table

This gives us:

- complete runtime independence from scraper uptime
- compact storage
- clear provenance
- multi-provider support
- low-egress read models

## Non-Goals

This document does not yet define:

- final SQL DDL
- lookup table contents
- matching algorithm details
- migration plan from prior movie schemas

Those belong in the next schema design document.
