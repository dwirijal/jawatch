# Anime Episode Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/anime/episode/[slug]` from client-side upstream fetches to a server-first Supabase-backed route.

**Architecture:** Add an episode read path in the existing anime Supabase adapter, then rebuild the episode page as a server component that renders playlist, metadata, and download/source actions from Supabase. Keep the video player active only when a row contains real embed URLs; otherwise render an explicit fallback state instead of pretending playback is available.

**Tech Stack:** Next.js 16 App Router, server `fetch`, Supabase REST, React client islands, localStorage history.

---

### Task 1: Add Episode Adapter

**Files:**
- Modify: `src/lib/anime-source.ts`

- [ ] Add Supabase row types for `samehadaku_episode_details`.
- [ ] Normalize episode row JSON into:
  - playable mirrors
  - source-only server options
  - download groups
  - playlist prev/next context
- [ ] Export `getAnimeEpisodeBySlug(slug)`.

### Task 2: Add Client History Island

**Files:**
- Create: `src/app/anime/episode/[slug]/AnimeEpisodeHistoryTracker.tsx`

- [ ] Save anime watch history in `useEffect`.
- [ ] Keep localStorage behavior isolated from the server page.

### Task 3: Rebuild Episode Route

**Files:**
- Modify: `src/app/anime/episode/[slug]/page.tsx`

- [ ] Replace the old `'use client'` page with an async server component.
- [ ] Render:
  - sticky header with prev/next links
  - player when playable mirrors exist
  - explicit fallback panel when only source/download data exists
  - sidebar playlist from Supabase
  - source/download sections
- [ ] Mount the history tracker island.

### Task 4: Rewire Anime Detail Links

**Files:**
- Modify: `src/app/anime/[slug]/page.tsx`

- [ ] Change episode list links from external source URLs to `/anime/episode/[episode_slug]`.
- [ ] Keep source page access available elsewhere on the detail page.

### Task 5: Verify

**Files:**
- Verify: `src/app/anime/episode/[slug]/page.tsx`
- Verify: `src/app/anime/[slug]/page.tsx`
- Verify: `src/lib/anime-source.ts`

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run dev`.
- [ ] Smoke test:
  - `/anime/ao-no-orchestra-season-2`
  - `/anime/episode/ao-no-orchestra-season-2-episode-1`
  - at least one playlist navigation link
