# Anime Index Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `/anime/list` to a Supabase-backed server-first page with thumbnail cards and A-Z navigation.

**Architecture:** Add a grouped index read path in `src/lib/anime-source.ts`, fetch it in a server page, and keep only sticky alphabet interaction inside a small client component.

**Tech Stack:** Next.js 16 App Router, Supabase REST, React Server Components, client island for scroll behavior.

---

### Task 1: Add Index Adapter

**Files:**
- Modify: `src/lib/anime-source.ts`

- [ ] Add a grouped anime index model for `#` and `A-Z` sections.
- [ ] Query `samehadaku_anime_catalog` with only card-safe fields.
- [ ] Export `getAnimeIndexData()`.

### Task 2: Split UI Boundary

**Files:**
- Create: `src/app/anime/list/AnimeIndexPageClient.tsx`
- Modify: `src/app/anime/list/page.tsx`

- [ ] Replace the client-fetching page with a server page.
- [ ] Pass grouped data into a client component.
- [ ] Keep smooth scroll and active-letter state in the client component only.

### Task 3: Rebuild Cards

**Files:**
- Create: `src/app/anime/list/AnimeIndexPageClient.tsx`

- [ ] Render grouped sections with `MediaCard`.
- [ ] Keep sticky alphabet navigation.
- [ ] Show an explicit empty state when no data is available.

### Task 4: Verify

**Files:**
- Verify: `src/lib/anime-source.ts`
- Verify: `src/app/anime/list/page.tsx`
- Verify: `src/app/anime/list/AnimeIndexPageClient.tsx`

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Smoke test `/anime/list`.
