# Anime Supabase Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate anime home, anime hub, and anime detail reads in `dwizzyWEEB` from legacy upstream providers to server-side Supabase-backed data.

**Architecture:** Add a focused anime data adapter that reads `samehadaku_*` tables from Supabase on the server, normalizes those rows into UI-facing models, and use that adapter from server routes for `/`, `/anime`, and `/anime/[slug]`. Existing client-only anime episode and search paths remain on legacy providers for now.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Supabase REST, existing client components, `npm` lint/build.

---

## File Map

- Create: `src/lib/anime-source.ts`
  Anime-specific server-side Supabase adapter and row normalization layer.
- Modify: `src/app/page.tsx`
  Replace anime home section reads with Supabase-backed adapter.
- Modify: `src/app/anime/page.tsx`
  Replace legacy schedule and ongoing fetches with Supabase-backed list data.
- Modify: `src/app/anime/AnimePageClient.tsx`
  Accept normalized Supabase-backed props while keeping current UI.
- Modify: `src/app/anime/[slug]/page.tsx`
  Convert from client-fetch page to server-rendered detail page backed by Supabase.
- Modify: `src/lib/api.ts`
  Keep legacy anime paths for episode/search transitional use, but stop using them for migrated pages.
- Test: `npm run lint`
- Test: `npm run build`

### Task 1: Build the Anime Supabase Adapter

**Files:**
- Create: `src/lib/anime-source.ts`
- Test by import/use from page modules

- [ ] **Step 1: Define Supabase row types and normalized UI types**

Add exact interfaces for:
- catalog rows
- anime detail rows
- episode summary rows
- normalized list card shape
- normalized detail shape

- [ ] **Step 2: Implement read helpers with server-only intent**

Add functions for:
- `getAnimeHomeItems()`
- `getAnimeHubData()`
- `getAnimeDetailBySlug(slug)`

Use server-side `fetch` to Supabase REST with env-backed credentials and minimal selected columns only.

- [ ] **Step 3: Implement fallback normalization**

Make detail normalization prefer:
1. `samehadaku_anime_details`
2. fallback fields from `samehadaku_anime_catalog`

Make sure missing detail rows do not crash page rendering.

- [ ] **Step 4: Run lint/build checks for the new module**

Run:
```bash
npm run lint
```

Expected: no new lint errors from adapter file.

### Task 2: Migrate Home Anime Section

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/HomePageClient.tsx` only if prop shape needs minor widening

- [ ] **Step 1: Replace home anime source in `src/app/page.tsx`**

Switch anime home reads from:
- `anime.getSchedule()`

to:
- `getAnimeHomeItems()`

Keep manga/movie/donghua unchanged.

- [ ] **Step 2: Preserve current hero behavior without blocking on legacy anime source**

Use Supabase anime item data for the anime hero lead while keeping existing manga/movie behavior intact.

- [ ] **Step 3: Run local verification**

Run:
```bash
npm run build
```

Expected: `/` still builds and anime section resolves from the new adapter path.

### Task 3: Migrate Anime Hub

**Files:**
- Modify: `src/app/anime/page.tsx`
- Modify: `src/app/anime/AnimePageClient.tsx`

- [ ] **Step 1: Replace server page data source**

Stop using:
- `getAnimeSchedule()`
- `getOngoingAnime(1)`

Load hub-ready data from `getAnimeHubData()`.

- [ ] **Step 2: Simplify client props**

Refactor `AnimePageClient` to accept normalized:
- featured/ongoing list
- optional release schedule payload if still available

Do not block the migration on legacy schedule fidelity. If schedule data is not present in Supabase, degrade the calendar section cleanly.

- [ ] **Step 3: Keep transitional client-side search/filter behavior isolated**

Do not remove legacy `searchAnime` and `getKanataAnimeByGenre` yet unless they directly conflict. The migrated default route should render from Supabase; filters can remain transitional.

- [ ] **Step 4: Verify route behavior**

Run:
```bash
npm run build
```

Expected: `/anime` compiles and renders with Supabase-backed initial state.

### Task 4: Migrate Anime Detail Route

**Files:**
- Modify: `src/app/anime/[slug]/page.tsx`

- [ ] **Step 1: Convert route to server component**

Remove client-only data fetching and move the detail load to the server.

- [ ] **Step 2: Use normalized Supabase detail data**

Render hero, stats, synopsis, cast, and episode CTA from normalized detail output.

Use fallback behavior:
- if detail row exists, use it
- if only catalog row exists, render degraded detail page
- if slug is unknown, render not found state

- [ ] **Step 3: Keep existing visual system intact**

Preserve:
- `DetailPageScaffold`
- `VideoDetailHero`
- `CastCardRail`
- current CTA placement and section rhythm

- [ ] **Step 4: Avoid regressions to episode navigation**

If episode rows exist, generate the episode CTA from the first available episode record.
If they do not exist, suppress the watch CTA cleanly instead of crashing.

- [ ] **Step 5: Verify the route**

Run:
```bash
npm run build
```

Expected: `/anime/[slug]` compiles and renders through the Supabase adapter path.

### Task 5: Final Verification

**Files:**
- Modify any touched files as needed from fixes discovered in verification

- [ ] **Step 1: Run lint**

Run:
```bash
npm run lint
```

Expected: PASS

- [ ] **Step 2: Run production build**

Run:
```bash
npm run build
```

Expected: PASS

- [ ] **Step 3: Smoke check key routes in local dev if needed**

Run:
```bash
npm run dev
```

Check:
- `/`
- `/anime`
- `/anime/[known-slug]`

- [ ] **Step 4: Summarize migration boundary**

Document in the final handoff that:
- anime list/detail home reads are now Supabase-backed
- anime episode/search remain transitional on legacy providers
