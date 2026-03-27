# Supabase Auth And Neon Data Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep authentication and profiles on Supabase while migrating anime/movie content storage and reads toward Neon in controlled phases without downtime.

**Architecture:** Introduce a content-provider boundary in `dwizzyWEEB`, create Neon-native content schema and writer paths in `dwizzySCRAPE`, dual-write and validate, then cut route reads to Neon while leaving `dwizzyAUTH` on Supabase. Supabase content tables remain rollback sources until parity is proven.

**Tech Stack:** Next.js 16 App Router, Vercel, Supabase Auth, PostgREST-based content reads, Neon Postgres, Go scraper CLI, SQL migrations

---

### Task 1: Freeze Auth Boundary And Document Ownership

**Files:**
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/docs/superpowers/specs/2026-03-23-dwizzyauth-supabase-discord-design.md`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-24-supabase-auth-neon-data-split-design.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/README.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/README.md` or equivalent app docs if absent

- [ ] **Step 1: Document that Supabase remains the auth system of record**

Add a short section to `dwizzyAUTH/README.md` stating that:

- auth stays on Supabase
- `profiles` stays on Supabase
- media data migration must not touch auth ownership

- [ ] **Step 2: Add split-architecture note to `dwizzyWEEB` docs**

Document that:

- `dwizzyWEEB` may read content from either Supabase or Neon
- no route should directly assume Supabase forever

- [ ] **Step 3: Verify docs only**

Run: `rg -n "Supabase|Neon|profiles|auth system of record" /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/README.md /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-24-supabase-auth-neon-data-split-design.md`

Expected: ownership language is present and non-contradictory.

- [ ] **Step 4: Commit**

```bash
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH add README.md
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH commit -m "docs: freeze supabase auth ownership"
```

### Task 2: Add A Content Provider Boundary In `dwizzyWEEB`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/content-provider.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/anime-source.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/movie-source.ts`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/__tests__/content-provider.test.ts`

- [ ] **Step 1: Write the failing provider-resolution test**

Cover:

- default provider is `supabase`
- `CONTENT_DATA_PROVIDER=neon` selects Neon
- unknown values fall back safely or fail loudly, per chosen contract

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --runInBand src/lib/__tests__/content-provider.test.ts`

Expected: FAIL because the provider boundary does not exist yet.

- [ ] **Step 3: Implement `content-provider.ts`**

Expose:

- resolved content provider name
- helper methods/config accessors for Supabase vs Neon

- [ ] **Step 4: Refactor anime/movie loaders to consume the boundary**

Do not change route output. Only route the underlying data access through a provider abstraction.

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- --runInBand src/lib/__tests__/content-provider.test.ts
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content-provider.ts src/lib/anime-source.ts src/lib/movie-source.ts src/lib/__tests__/content-provider.test.ts
git commit -m "refactor: add content provider boundary"
```

### Task 3: Define Neon Content Schema In `dwizzySCRAPE`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/036_neon_anime_content.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/037_neon_movie_content.sql`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/038_neon_content_read_views.sql`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/README.md`

- [ ] **Step 1: Write schema shape docs at the top of each SQL file**

Include exact ownership:

- these tables live in Neon
- these are content-only
- auth tables are out of scope

- [ ] **Step 2: Create anime content schema**

Mirror the compact model:

- `anime_list`
- `anime_meta`
- `anime_episodes`
- lookup tables if needed

- [ ] **Step 3: Create movie content schema**

Mirror the current compact movie model:

- `movies`
- `movie_meta`
- `movie_provider_records`
- `movie_watch_options`
- `movie_download_options`

- [ ] **Step 4: Create thin Neon read views**

At minimum:

- list view
- detail view
- watch/route view

- [ ] **Step 5: Verify SQL compiles in a Neon dev branch or local Postgres**

Run the migration workflow used by `dwizzySCRAPE`.

Expected: schema and views apply cleanly.

- [ ] **Step 6: Commit**

```bash
git add sql/036_neon_anime_content.sql sql/037_neon_movie_content.sql sql/038_neon_content_read_views.sql README.md
git commit -m "feat: add neon content schema baseline"
```

### Task 4: Add Neon Admin Config And Client In `dwizzySCRAPE`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/neon/config.go`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/neon/client.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/.env.example`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/neon/config_test.go`

- [ ] **Step 1: Write failing config tests**

Cover:

- missing Neon connection values
- malformed connection URL
- explicit enable/disable flag

- [ ] **Step 2: Implement Neon config loader**

Add envs like:

- `NEON_DATABASE_URL`
- optional `NEON_CONTENT_ENABLED`

- [ ] **Step 3: Implement Neon client wrapper**

Keep it minimal:

- connection bootstrap
- ping helper
- shared execution/query helper

- [ ] **Step 4: Wire CLI bootstrap validation**

`dwizzyscrape` should be able to fail fast if Neon content mode is enabled but Neon config is broken.

- [ ] **Step 5: Run tests**

Run:

```bash
go test ./... -count=1
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/neon/config.go internal/neon/client.go internal/neon/config_test.go cmd/dwizzyscrape/main.go .env.example
git commit -m "feat: add neon scraper client configuration"
```

### Task 5: Implement Dual-Write For Anime Content

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/anime_neon_store.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/catalog_store.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/anime_detail_store.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/episode_detail_store.go`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/anime_neon_store_test.go`

- [ ] **Step 1: Write failing anime dual-write tests**

Cover:

- Supabase write still executes
- Neon mirror write executes when enabled
- Neon failure does not silently corrupt source write semantics

- [ ] **Step 2: Implement Neon anime store**

Use the compact schema only. Do not write auth-like tables.

- [ ] **Step 3: Wire anime write path**

Enable:

- Supabase-only mode
- dual-write mode

- [ ] **Step 4: Add structured logging for parity checks**

Log enough to compare:

- slug
- upsert target
- success/failure

- [ ] **Step 5: Run tests**

Run: `go test ./... -count=1`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/store/anime_neon_store.go internal/store/catalog_store.go internal/store/anime_detail_store.go internal/store/episode_detail_store.go internal/store/anime_neon_store_test.go
git commit -m "feat: dual-write anime content to neon"
```

### Task 6: Implement Dual-Write For Movie Content

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_neon_store.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_v3_store.go`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/store/movie_neon_store_test.go`

- [ ] **Step 1: Write failing movie dual-write tests**

Cover:

- canonical movie row
- provider edge row
- watch/download rows

- [ ] **Step 2: Implement Neon movie store**

Preserve the existing compact relational model.

- [ ] **Step 3: Wire movie write path with feature flag**

Do not remove Supabase writes yet.

- [ ] **Step 4: Run tests**

Run: `go test ./... -count=1`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/store/movie_neon_store.go internal/store/movie_v3_store.go internal/store/movie_neon_store_test.go
git commit -m "feat: dual-write movie content to neon"
```

### Task 7: Build Parity Validation Commands

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/verify/neon_parity.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/docs/neon-parity-checklist.md`

- [ ] **Step 1: Add parity commands**

Examples:

- compare anime row counts
- compare movie row counts
- compare sample payload hashes
- compare representative payload sizes for list/detail/watch reads

- [ ] **Step 2: Record operator checklist**

Include:

- acceptable null coverage
- sample route validation list
- hot-path payload budget thresholds
- rollback instructions

- [ ] **Step 3: Run parity commands**

Expected: they execute cleanly even before full parity is reached.

- [ ] **Step 4: Commit**

```bash
git add internal/verify/neon_parity.go cmd/dwizzyscrape/main.go docs/neon-parity-checklist.md
git commit -m "feat: add neon parity verification commands"
```

### Task 8: Backfill Historical Content Into Neon

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/internal/backfill/neon_content_backfill.go`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/cmd/dwizzyscrape/main.go`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/docs/neon-backfill-runbook.md`

- [ ] **Step 1: Add anime historical backfill command**

Backfill existing compact Supabase content into Neon for:

- `anime_list`
- `anime_meta`
- `anime_episodes`

- [ ] **Step 2: Add movie historical backfill command**

Backfill existing compact Supabase content into Neon for:

- `movies`
- `movie_meta`
- `movie_provider_records`
- `movie_watch_options`
- `movie_download_options`

- [ ] **Step 3: Add resumable checkpointing or idempotent rerun behavior**

The command must support partial reruns without duplicating rows or corrupting timestamps.

- [ ] **Step 4: Define success criteria in the runbook**

Include:

- expected row-count parity windows
- how to rerun failed slices
- how to verify stale historical rows were imported

- [ ] **Step 5: Run the backfill in a non-production target first**

Expected: a full rerun completes cleanly and is safe to repeat.

- [ ] **Step 6: Commit**

```bash
git add internal/backfill/neon_content_backfill.go cmd/dwizzyscrape/main.go docs/neon-backfill-runbook.md
git commit -m "feat: add neon historical content backfill"
```

### Task 9: Add Neon Reader In `dwizzyWEEB`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/neon-content.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/anime-source.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/movie-source.ts`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/__tests__/neon-content.test.ts`

- [ ] **Step 1: Write failing read-adapter tests**

Cover:

- Neon card/detail mapping
- behavior when Neon returns empty rows
- provider boundary selection

- [ ] **Step 2: Implement Neon reader**

Use direct Postgres or a Neon Data API client, depending the chosen integration.

The reader must expose the same route-facing shapes as the current Supabase adapter.

- [ ] **Step 3: Wire anime/movie loaders to use Neon when `CONTENT_DATA_PROVIDER=neon`**

Keep the public route contracts unchanged.

- [ ] **Step 4: Run app verification**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/neon-content.ts src/lib/anime-source.ts src/lib/movie-source.ts src/lib/__tests__/neon-content.test.ts
git commit -m "feat: add neon content reader"
```

### Task 10: Cut Over Public Routes To Neon Behind Config

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/.env.example`
- Modify: route-level smoke docs if present
- Optional: create `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/` follow-up rollout notes

- [ ] **Step 1: Add production config toggle docs**

Document:

- `CONTENT_DATA_PROVIDER=supabase`
- `CONTENT_DATA_PROVIDER=neon`

- [ ] **Step 2: Run smoke tests in Supabase mode**

Check:

- `/`
- `/anime/...`
- `/anime/episode/...`
- `/movies/...`
- `/movies/watch/...`

- [ ] **Step 3: Run smoke tests in Neon mode**

Check the same routes and compare representative payloads.

- [ ] **Step 4: Run payload-size verification in Neon mode**

Measure representative responses for:

- home lists
- anime detail
- anime episode
- movie detail
- movie watch

Record any route that exceeds the target budget.

- [ ] **Step 5: Flip production to Neon only after parity signoff**

Do not remove the Supabase fallback yet.

- [ ] **Step 6: Commit**

```bash
git add .env.example docs
git commit -m "docs: add neon content cutover controls"
```

### Task 11: Decommission Supabase Content Storage

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/sql/039_drop_supabase_content_after_neon_cutover.sql`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/README.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/content-provider.ts`

- [ ] **Step 1: Prepare but do not immediately execute drop SQL**

The SQL must target only content objects.

Explicitly exclude:

- `auth` schema
- `public.profiles`
- auth-related policies

- [ ] **Step 2: Remove dual-write only after sustained stable reads**

Require:

- parity green
- production route smoke pass
- rollback window elapsed

- [ ] **Step 3: Remove Supabase content provider from app only after drop plan is approved**

Keep an emergency fallback branch or tag.

- [ ] **Step 4: Run final verification**

Run:

```bash
go test ./... -count=1
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sql/039_drop_supabase_content_after_neon_cutover.sql README.md /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/content-provider.ts
git commit -m "chore: prepare supabase content decommission after neon cutover"
```

### Task 12: Rollout Order

**Files:**
- Reference only

- [ ] Finish Task 1 and Task 2 before touching databases.
- [ ] Finish Task 3 and Task 4 before dual-write.
- [ ] Finish Task 5 and Task 6 before the historical backfill.
- [ ] Finish Task 7 and Task 8 before enabling Neon reads in production.
- [ ] Finish Task 9 and Task 10 before scheduling Task 11.

### Task 13: Acceptance Criteria

**Files:**
- Reference only

- [ ] `auth.dwizzy.my.id` still authenticates users through Supabase with no behavior change.
- [ ] `public.profiles` remains on Supabase and continues to track the authenticated user.
- [ ] `dwizzyWEEB` can switch content reads between Supabase and Neon without route code churn.
- [ ] `dwizzySCRAPE` can dual-write and validate parity.
- [ ] historical content is backfilled into Neon, not just new writes.
- [ ] parity checks include payload size and sample route correctness.
- [ ] Neon can take over content reads without requiring scraper uptime at request time.
- [ ] Supabase content data can be dropped later without impacting auth.
