# Jawatch File Structure Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Jawatch into a Vercel-first Next.js 16 source tree with explicit `app`/`features`/`domains`/`platform`/`shared` ownership, while preserving the approved public IA and the runtime contract of Postgres as source of truth, OpenSearch for retrieval, Valkey for query cache, and Redis for domain/page cache.

**Architecture:** The refactor starts with guardrails, then splits into parallel extraction lanes with disjoint write ownership: route grouping, platform extraction, media domain extraction, and search/cache extraction. After those lanes stabilize, the app and feature entrypoints are rewired, legacy compatibility imports are removed, and the remaining `unstable_cache` usage is migrated to the Next.js 16 cache model.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `postgres`, OpenSearch, Redis/Valkey via `redis`, Supabase, Node test runner, ESLint

---

## Parallelization Summary

### Serial prerequisite
- Task 1 must land first.

### Wave 1 parallel lanes
- Task 2: App route groups and private folder cleanup
- Task 3: Platform extraction for Postgres/OpenSearch/cache
- Task 4: Supabase/proxy/gateway legacy split

These tasks can run in parallel because they own different write sets:
- Task 2 owns `src/app/**`
- Task 3 owns `src/platform/**` and cache/db/search call sites
- Task 4 owns `src/platform/supabase/**`, proxy wiring, and legacy gateway extraction

### Wave 2 parallel lanes
- Task 5: Movies + series domain extraction
- Task 6: Comics + shorts domain extraction
- Task 7: Search domain extraction and cache role correction

These tasks start after Tasks 2-4 create the destination seams.

### Serial rejoin
- Task 8: Feature rewiring, app rewiring, and compatibility import removal
- Task 9: Next.js 16 cache migration
- Task 10: Cleanup, docs, and final verification

## File Structure Lock-In

### New roots to create
- `src/app/(public)/`
- `src/app/(auth)/`
- `src/app/(vault)/`
- `src/app/(admin)/`
- `src/app/_shared/`
- `src/domains/`
- `src/platform/`
- `src/shared/`

### Existing roots that remain
- `src/features/`
- `tests/unit/`
- `tests/e2e/`

### Legacy roots to drain
- `src/lib/adapters/`
- `src/lib/search/`
- `src/lib/server/`
- `src/lib/supabase/`
- `src/lib/proxy/`
- route-local helpers under `src/app/*` that are not special files

## Task 1: Guardrails and Directory Skeleton

**Files:**
- Create: `src/domains/.gitkeep`
- Create: `src/platform/.gitkeep`
- Create: `src/shared/.gitkeep`
- Modify: `tests/unit/structure-boundaries.test.mjs`
- Create: `tests/unit/file-structure-boundaries.test.mjs`
- Modify: `tsconfig.json`

- [ ] **Step 1: Write failing boundary tests for the new architecture**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";

test("top-level source roots exist for domains, platform, and shared", () => {
  const srcDir = join(process.cwd(), "src");
  const names = readdirSync(srcDir);
  assert.equal(names.includes("domains"), true);
  assert.equal(names.includes("platform"), true);
  assert.equal(names.includes("shared"), true);
});
```

- [ ] **Step 2: Run tests to verify the guardrails fail**

Run: `rtk node --test tests/unit/structure-boundaries.test.mjs tests/unit/file-structure-boundaries.test.mjs`
Expected: FAIL because the destination roots and boundary assertions do not exist yet.

- [ ] **Step 3: Add the destination directory skeleton and path aliases**

Create empty destination roots and update `tsconfig.json` paths so later tasks can use:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/domains/*": ["./src/domains/*"],
      "@/platform/*": ["./src/platform/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

- [ ] **Step 4: Extend `structure-boundaries` with new dependency rules**

Add assertions that:
- `src/features` does not import `@/platform/`
- `src/shared` does not import `@/domains/` or `@/platform/`
- `src/platform` does not import `@/domains/` or `@/features/`
- any approved `features -> platform` import is explicitly allowlisted in the test file with a reason comment
- `src/app` does not import legacy gateway modules on the main path

- [ ] **Step 5: Run boundary verification**

Run: `rtk node --test tests/unit/structure-boundaries.test.mjs tests/unit/file-structure-boundaries.test.mjs`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json tests/unit/structure-boundaries.test.mjs tests/unit/file-structure-boundaries.test.mjs src/domains src/platform src/shared
git commit -m "test: add file structure guardrails"
```

## Task 2: App Route Groups and Private Folder Cleanup

**Files:**
- Create: `src/app/(public)/`
- Create: `src/app/(auth)/`
- Create: `src/app/(vault)/`
- Create: `src/app/(admin)/`
- Create: `src/app/_shared/layout/`
- Move/Modify: `src/app/page.tsx`
- Move/Modify: `src/app/search/page.tsx`
- Move/Modify: `src/app/contact/page.tsx`
- Move/Modify: `src/app/support/page.tsx`
- Move/Modify: `src/app/privacy/page.tsx`
- Move/Modify: `src/app/terms/page.tsx`
- Move/Modify: `src/app/dmca/page.tsx`
- Move/Modify: `src/app/login/page.tsx`
- Move/Modify: `src/app/signup/page.tsx`
- Move/Modify: `src/app/forgot-password/page.tsx`
- Move/Modify: `src/app/logout/route.ts`
- Move/Modify: `src/app/auth/callback/route.ts`
- Move/Modify: `src/app/onboarding/page.tsx`
- Move/Modify: `src/app/account/age/page.tsx`
- Move/Modify: `src/app/admin/**`
- Move/Modify: `src/app/vault/**`
- Move/Modify: `src/app/movies/**`
- Move/Modify: `src/app/series/**`
- Move/Modify: `src/app/comics/**`
- Move/Modify: `src/app/shorts/**`
- Move/Modify: `src/app/watch/**`
- Move/Modify: `src/app/read/**`
- Modify: `tests/unit/structure-boundaries.test.mjs`

- [ ] **Step 1: Write a failing route tree assertion for grouped app segments**

```js
test("public/auth/vault/admin route groups exist", () => {
  const appDir = join(process.cwd(), "src/app");
  const names = readdirSync(appDir);
  assert.equal(names.includes("(public)"), true);
  assert.equal(names.includes("(auth)"), true);
  assert.equal(names.includes("(vault)"), true);
  assert.equal(names.includes("(admin)"), true);
});
```

- [ ] **Step 2: Run the boundary tests to verify failure**

Run: `rtk node --test tests/unit/structure-boundaries.test.mjs`
Expected: FAIL because route groups do not exist yet.

- [ ] **Step 3: Move App Router entrypoints into route groups without changing URLs**

Rules while moving:
- keep only special route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`, metadata files) at segment roots
- move any non-special route-local helper into `_components`, `_server`, or `_lib` under the owning segment
- keep imports compiling with temporary re-exports only if a move would otherwise block the lane

Required route inventory:
- `(public)`: `/`, `/watch/**`, `/read/**`, `/search`, `/movies/**`, `/series/[slug]`, `/series/[slug]/episodes/[episodeSlug]`, `/comics/[slug]`, `/comics/[slug]/chapters/[chapterSlug]`, `/shorts/[slug]`, `/shorts/[slug]/episodes/[episodeSlug]`, `/contact`, `/support`, `/privacy`, `/terms`, `/dmca`
- `(auth)`: `/login`, `/signup`, `/forgot-password`, `/logout`, `/auth/callback`, `/onboarding`
- `(vault)`: `/vault/**`, `/account/age`
- `(admin)`: `/admin/**`

Example:

```tsx
// src/app/(public)/movies/[slug]/page.tsx
export { default, metadata } from "@/domains/movies/ui/MovieDetailPage";
```

- [ ] **Step 4: Move shared route chrome helpers into `src/app/_shared`**

Candidate responsibilities:
- layout-only metadata helpers
- route-only shell wrappers
- route-local loading/error helpers that are not reusable product features

- [ ] **Step 5: Run focused route/type verification**

Run:
- `rtk node --test tests/unit/structure-boundaries.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app tests/unit/structure-boundaries.test.mjs
git commit -m "refactor: group app routes by product area"
```

## Task 3: Platform Extraction for Postgres, OpenSearch, Media, Enrichment, Redis, and Valkey

**Files:**
- Create: `src/platform/db/postgres/client.ts`
- Create: `src/platform/db/postgres/schema-capabilities.ts`
- Create: `src/platform/search/opensearch/client.ts`
- Create: `src/platform/search/opensearch/query-builder.ts`
- Create: `src/platform/search/opensearch/title-index.ts`
- Create: `src/platform/media/provider-contracts.ts`
- Create: `src/platform/enrichment/`
- Create: `src/platform/cache/redis/domain-cache.ts`
- Create: `src/platform/cache/valkey/query-cache.ts`
- Create: `src/platform/cache/http/cache-headers.ts`
- Modify: `src/lib/server/comic-db.ts`
- Modify: `src/lib/server/comic-db-schema.ts`
- Modify: `src/lib/search/opensearch.ts`
- Modify: `src/lib/search/opensearch-query.ts`
- Modify: `src/lib/media.ts`
- Modify: `src/lib/enrichment.ts`
- Modify: `src/lib/enrichment-shared.ts`
- Modify: `src/lib/enrichment-movie.ts`
- Modify: `src/lib/enrichment-jikan.ts`
- Modify: `src/lib/enrichment-written.ts`
- Modify: `src/lib/cloudflare-cache.ts`
- Modify: `src/lib/server/comic-cache.ts`
- Modify: `src/lib/server/comic-service.ts`
- Modify: `src/lib/server/request-rate-limit.ts`
- Modify: `src/lib/server/user-preferences.ts`
- Test: `tests/unit/opensearch-query.test.mjs`
- Test: `tests/unit/search-service.test.mjs`

- [ ] **Step 1: Write failing tests for explicit cache role ownership**

```js
test("redis domain cache and valkey query cache live in platform adapters", async () => {
  const { buildDomainCacheKey } = await import("../../src/platform/cache/redis/domain-cache.ts");
  const { buildQueryCacheKey } = await import("../../src/platform/cache/valkey/query-cache.ts");
  assert.equal(typeof buildDomainCacheKey, "function");
  assert.equal(typeof buildQueryCacheKey, "function");
});
```

- [ ] **Step 2: Run the targeted tests to verify failure**

Run: `rtk node --test tests/unit/search-service.test.mjs tests/unit/opensearch-query.test.mjs`
Expected: FAIL because the new platform modules do not exist yet.

- [ ] **Step 3: Extract Postgres and OpenSearch clients into `src/platform`**

Example:

```ts
// src/platform/db/postgres/client.ts
import "server-only";
import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function getPostgresClient() {
  if (client) return client;
  client = postgres(readDatabaseUrl(), buildPostgresOptions());
  return client;
}
```

```ts
// src/platform/search/opensearch/client.ts
import "server-only";

export async function requestOpenSearch(path: string, init?: RequestInit) {
  // moved from legacy src/lib/search/opensearch.ts
}
```

- [ ] **Step 4: Move provider-facing media and enrichment helpers into `src/platform`**

Required moves:
- `src/lib/media.ts` -> `src/platform/media/provider-contracts.ts`
- `src/lib/enrichment*.ts` -> `src/platform/enrichment/*`
- `src/lib/cloudflare-cache.ts` -> `src/platform/cache/http/cache-headers.ts`

Keep backwards-compatible re-exports only long enough to unblock parallel lanes.

- [ ] **Step 5: Split the old generic cache file into Redis and Valkey adapters**

Required result:
- `domain-cache.ts` handles page/data/domain cache
- `query-cache.ts` handles search/query cache
- the old `comic-cache.ts` becomes a thin compatibility shim for one short commit at most, then gets deleted in Task 10

- [ ] **Step 6: Point the old modules at the new adapters with temporary re-exports**

This keeps parallel lanes unblocked while domain extraction is in flight.

- [ ] **Step 7: Rewrite active `comic-cache` callers to explicit Redis or Valkey adapters**

Required migration checklist:
- `src/lib/server/comic-service.ts` -> explicit Redis domain-cache path
- `src/lib/server/request-rate-limit.ts` -> explicit Redis or dedicated cache adapter decision
- `src/lib/server/user-preferences.ts` -> explicit Redis domain-cache path
- any search-owned caller that still imports the generic shim -> Valkey query-cache path

- [ ] **Step 8: Run platform-focused verification**

Run:
- `rtk node --test tests/unit/opensearch-query.test.mjs tests/unit/search-service.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/platform src/lib/server/comic-db.ts src/lib/server/comic-db-schema.ts src/lib/search/opensearch.ts src/lib/search/opensearch-query.ts src/lib/media.ts src/lib/enrichment.ts src/lib/enrichment-shared.ts src/lib/enrichment-movie.ts src/lib/enrichment-jikan.ts src/lib/enrichment-written.ts src/lib/cloudflare-cache.ts src/lib/server/comic-cache.ts src/lib/server/comic-service.ts src/lib/server/request-rate-limit.ts src/lib/server/user-preferences.ts tests/unit/opensearch-query.test.mjs tests/unit/search-service.test.mjs
git commit -m "refactor: extract platform db search and cache adapters"
```

## Task 4: Supabase, Proxy, and Legacy Gateway Split

**Files:**
- Create: `src/platform/supabase/client.ts`
- Create: `src/platform/supabase/server.ts`
- Create: `src/platform/supabase/middleware.ts`
- Create: `src/platform/supabase/proxy-context.ts`
- Create: `src/platform/gateway/legacy/gateway.ts`
- Create: `src/platform/gateway/legacy/comic-origin.ts`
- Modify: `src/lib/supabase/client.ts`
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/lib/proxy/supabase-context.ts`
- Modify: `src/lib/gateway.ts`
- Modify: `src/lib/server/comic-origin.ts`
- Modify: `src/proxy.ts`
- Test: `tests/unit/proxy-routing.test.mjs`
- Test: `tests/unit/comic-origin.test.mjs`

- [ ] **Step 1: Write a failing test proving gateway code is isolated under legacy**

```js
test("legacy gateway adapter is isolated from main platform imports", async () => {
  const legacy = await import("../../src/platform/gateway/legacy/gateway.ts");
  assert.equal(typeof legacy.gatewayFetchJson, "function");
});
```

- [ ] **Step 2: Run targeted tests to verify failure**

Run: `rtk node --test tests/unit/proxy-routing.test.mjs tests/unit/comic-origin.test.mjs`
Expected: FAIL because the new platform files do not exist yet.

- [ ] **Step 3: Move Supabase runtime modules into `src/platform/supabase`**

Keep the public API names stable in the first commit so auth routes and proxy continue to compile.

- [ ] **Step 4: Move legacy gateway/origin modules into `src/platform/gateway/legacy`**

Example:

```ts
// src/platform/gateway/legacy/gateway.ts
export { buildGatewayUrl, gatewayFetchJson, unwrapGatewayData } from "@/lib/gateway";
```

Then invert the dependency so callers import the new path and the old path becomes temporary compatibility glue.

- [ ] **Step 5: Update `src/proxy.ts` to depend on platform-owned Supabase proxy context**

Required outcome:
- proxy still owns request flow
- Supabase environment/session mechanics live in `src/platform/supabase`

- [ ] **Step 6: Run focused verification**

Run:
- `rtk node --test tests/unit/proxy-routing.test.mjs tests/unit/comic-origin.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/platform/supabase src/platform/gateway src/lib/supabase src/lib/proxy/supabase-context.ts src/lib/gateway.ts src/lib/server/comic-origin.ts src/proxy.ts tests/unit/proxy-routing.test.mjs tests/unit/comic-origin.test.mjs
git commit -m "refactor: isolate supabase and legacy gateway adapters"
```

## Task 5: Movies and Series Domain Extraction

**Files:**
- Create: `src/domains/movies/contracts/`
- Create: `src/domains/movies/server/`
- Create: `src/domains/series/contracts/`
- Create: `src/domains/series/server/`
- Modify: `src/lib/adapters/movie.ts`
- Modify: `src/lib/adapters/movie-browse.ts`
- Modify: `src/lib/adapters/movie-detail.ts`
- Modify: `src/lib/adapters/movie-shared.ts`
- Modify: `src/lib/adapters/series.ts`
- Modify: `src/lib/adapters/series-browse.ts`
- Modify: `src/lib/adapters/series-detail.ts`
- Modify: `src/lib/adapters/series-shared.ts`
- Test: `tests/unit/movie-request-data.test.mjs`
- Test: `tests/unit/movie-route-alias.test.mjs`
- Test: `tests/unit/series-detail-presentation.test.mjs`

- [ ] **Step 1: Write failing imports against the new domain entrypoints**

```js
import { getMovieHubData } from "../../src/domains/movies/server/index.ts";
import { getSeriesHubData } from "../../src/domains/series/server/index.ts";
```

- [ ] **Step 2: Run targeted tests to verify failure**

Run:
- `rtk node --test tests/unit/movie-request-data.test.mjs tests/unit/movie-route-alias.test.mjs`
- `rtk node --test tests/unit/series-detail-presentation.test.mjs`

Expected: FAIL because the new domain entrypoints do not exist yet.

- [ ] **Step 3: Move movie and series orchestration into domain folders**

Required splits:
- `server/index.ts` = thin public domain entrypoint
- `server/browse.ts`
- `server/detail.ts`
- `server/shared.ts`
- `contracts/*.ts` for stable DTOs and normalized domain contracts

- [ ] **Step 4: Replace direct imports from `src/lib/adapters/*` at downstream call sites**

Examples:
- `src/features/home/server/home-feed-loader.ts`
- `src/app/api/search/movies/route.ts`
- `src/app/api/search/series/route.ts`

- [ ] **Step 5: Turn old adapter files into temporary re-export shims**

Example:

```ts
// src/lib/adapters/movie.ts
export * from "@/domains/movies/server";
```

- [ ] **Step 6: Run domain verification**

Run:
- `rtk node --test tests/unit/movie-request-data.test.mjs tests/unit/movie-route-alias.test.mjs tests/unit/series-detail-presentation.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/domains/movies src/domains/series src/lib/adapters/movie.ts src/lib/adapters/movie-browse.ts src/lib/adapters/movie-detail.ts src/lib/adapters/movie-shared.ts src/lib/adapters/series.ts src/lib/adapters/series-browse.ts src/lib/adapters/series-detail.ts src/lib/adapters/series-shared.ts src/features/home/server/home-feed-loader.ts src/app/api/search/movies/route.ts src/app/api/search/series/route.ts tests/unit/movie-request-data.test.mjs tests/unit/movie-route-alias.test.mjs tests/unit/series-detail-presentation.test.mjs
git commit -m "refactor: move movies and series into domain modules"
```

## Task 6: Comics and Shorts Domain Extraction

**Files:**
- Create: `src/domains/comics/contracts/`
- Create: `src/domains/comics/server/`
- Create: `src/domains/shorts/contracts/`
- Create: `src/domains/shorts/server/`
- Modify: `src/lib/adapters/comic-server.ts`
- Modify: `src/lib/adapters/comic-server-browse.ts`
- Modify: `src/lib/adapters/comic-server-detail.ts`
- Modify: `src/lib/adapters/comic-server-shared.ts`
- Modify: `src/lib/server/drama-db.ts`
- Test: `tests/unit/comic-response.test.mjs`
- Test: `tests/unit/comic-origin.test.mjs`
- Test: `tests/unit/video-player-media.test.mjs`

- [ ] **Step 1: Write failing imports against comics/shorts domain entrypoints**

```js
import { getPopularManga } from "../../src/domains/comics/server/index.ts";
import { listDramaItems } from "../../src/domains/shorts/server/index.ts";
```

- [ ] **Step 2: Run targeted tests to verify failure**

Run:
- `rtk node --test tests/unit/comic-response.test.mjs tests/unit/comic-origin.test.mjs tests/unit/video-player-media.test.mjs`
Expected: FAIL because the new domain entrypoints do not exist yet.

- [ ] **Step 3: Move comic and shorts orchestration into domain folders**

Required destination shape:
- `src/domains/comics/server/browse.ts`
- `src/domains/comics/server/detail.ts`
- `src/domains/comics/server/shared.ts`
- `src/domains/shorts/server/catalog.ts`
- `src/domains/shorts/server/detail.ts`
- `src/domains/shorts/server/episodes.ts`

- [ ] **Step 4: Point old callers at the new domain entrypoints**

Likely callers:
- `src/features/comics/*`
- `src/app/api/comic/**`
- `src/app/shorts/**`
- `src/features/shorts/*`

- [ ] **Step 5: Keep old `src/lib` files as temporary re-exports for one commit**

- [ ] **Step 6: Run verification**

Run:
- `rtk node --test tests/unit/comic-response.test.mjs tests/unit/comic-origin.test.mjs tests/unit/video-player-media.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/domains/comics src/domains/shorts src/lib/adapters/comic-server.ts src/lib/adapters/comic-server-browse.ts src/lib/adapters/comic-server-detail.ts src/lib/adapters/comic-server-shared.ts src/lib/server/drama-db.ts src/features/comics src/features/shorts src/app/api/comic src/app/shorts tests/unit/comic-response.test.mjs tests/unit/comic-origin.test.mjs tests/unit/video-player-media.test.mjs
git commit -m "refactor: move comics and shorts into domain modules"
```

## Task 7: Search Domain Extraction and Cache Role Correction

**Files:**
- Create: `src/domains/search/contracts/search-contract.ts`
- Create: `src/domains/search/server/search-service.ts`
- Create: `src/domains/search/server/search-merge.ts`
- Modify: `src/lib/search/search-contract.ts`
- Modify: `src/lib/search/search-service.ts`
- Modify: `src/lib/search/search-merge.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/search/movies/route.ts`
- Modify: `src/app/api/search/series/route.ts`
- Modify: `src/app/api/search/comic/route.ts`
- Modify: `src/features/home/server/home-feed-loader.ts`
- Test: `tests/unit/search-service.test.mjs`
- Test: `tests/unit/opensearch-query.test.mjs`

- [ ] **Step 1: Write failing tests that assert search uses Valkey query cache, not Redis domain cache**

```js
test("search service imports valkey query cache adapter", async () => {
  const source = readFileSync("src/domains/search/server/search-service.ts", "utf8");
  assert.equal(source.includes("@/platform/cache/valkey/"), true);
  assert.equal(source.includes("@/platform/cache/redis/"), false);
});
```

- [ ] **Step 2: Run targeted search tests to verify failure**

Run: `rtk node --test tests/unit/search-service.test.mjs tests/unit/opensearch-query.test.mjs`
Expected: FAIL because the new domain search service does not exist yet.

- [ ] **Step 3: Move search orchestration into `src/domains/search/server`**

Example:

```ts
// src/domains/search/server/search-service.ts
import "server-only";
import { rememberQueryCacheValue } from "@/platform/cache/valkey/query-cache";
import { searchIndexedDocuments, upsertSearchDocuments } from "@/platform/search/opensearch/title-index";
```

- [ ] **Step 4: Make `Valkey` the explicit owner of search/query cache**

Required result:
- unified search and per-domain search use `Valkey`
- Redis adapters are not imported by search domain modules

- [ ] **Step 5: Rewire route handlers and warmup loaders to the new domain path**

- [ ] **Step 6: Run search verification**

Run:
- `rtk node --test tests/unit/search-service.test.mjs tests/unit/opensearch-query.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/domains/search src/lib/search src/app/api/search src/features/home/server/home-feed-loader.ts tests/unit/search-service.test.mjs tests/unit/opensearch-query.test.mjs
git commit -m "refactor: move search into domain and valkey cache adapters"
```

## Task 8: Feature and App Rewiring

**Files:**
- Modify: `src/features/home/server/loadHomePageData.ts`
- Modify: `src/features/home/server/home-feed-loader.ts`
- Modify: `src/features/auth/**`
- Modify: `src/lib/auth/**`
- Modify: `src/lib/catalog/**`
- Modify: `src/lib/community.ts`
- Modify: `src/lib/server/community-activity.ts`
- Modify: `src/lib/media-slugs.ts`
- Modify: `src/lib/media-hub-segments.ts`
- Modify: `src/lib/media-safety.ts`
- Modify: `src/lib/marketing.ts`
- Modify: `src/lib/marketing-events.ts`
- Modify: `src/lib/store.ts`
- Modify: `src/lib/store/**`
- Modify: `src/store/**`
- Modify: `src/app/api/movies/**`
- Modify: `src/app/api/series/**`
- Modify: `src/app/api/vertical-drama/**`
- Modify: `src/app/api/lk21/**`
- Modify: `src/app/api/community/**`
- Modify: `src/app/api/personalization/**`
- Modify: `src/app/api/auth/**`
- Modify: `src/lib/server/public-api-cache.ts`
- Modify: `src/lib/server/viewer-nsfw-access.ts`
- Modify: `src/lib/server/comic-route-access.ts`
- Create: `src/domains/catalog/contracts/`
- Create: `src/domains/catalog/server/`
- Modify: `src/components/atoms/**`
- Modify: `src/components/molecules/**`
- Modify: `src/components/molecules/card/**`
- Modify: `src/components/organisms/video-player/**`
- Modify: `src/components/organisms/VideoPlayer.tsx`
- Modify: `src/components/admin/**`
- Modify: `src/features/comics/**`
- Modify: `src/features/series/**`
- Modify: `src/features/shorts/**`
- Modify: `src/app/(public)/**`
- Modify: `src/app/(auth)/**`
- Modify: `src/app/(vault)/**`
- Modify: `src/app/(admin)/**`
- Test: `tests/unit/structure-boundaries.test.mjs`
- Test: `tests/unit/home-ia.test.mjs`
- Test: `tests/unit/lib-runtime-imports.test.mjs`

- [ ] **Step 1: Write failing tests proving features no longer import legacy `src/lib` orchestration paths**

```js
test("feature modules do not import legacy lib adapters", () => {
  const source = readFileSync("src/features/home/server/home-feed-loader.ts", "utf8");
  assert.equal(source.includes("@/lib/adapters/"), false);
  assert.equal(source.includes("@/domains/"), true);
});
```

- [ ] **Step 2: Run feature/boundary tests to verify failure**

Run:
- `rtk node --test tests/unit/structure-boundaries.test.mjs tests/unit/home-ia.test.mjs tests/unit/lib-runtime-imports.test.mjs`
Expected: FAIL because downstream callers still depend on legacy paths.

- [ ] **Step 3: Rewire features to domain entrypoints and shared utilities**

Target rule:
- `features` import from `domains` and `shared`
- `app` imports from `features`, `domains`, `shared`, or route-local private helpers
- `src/lib/auth/*` drains into `src/domains/auth/*` and `src/platform/supabase/*`
- `src/lib/catalog/*` drains into `src/domains/catalog/*`
- generic client stores drain into `src/shared/ui/store/*`; feature-owned slices drain into `src/features/vault/store/*`
- marketing and route-segment helpers drain into `src/app/_shared/*`
- API route helpers drain to their owning `domains/*/server/*` or `src/platform/cache/http/*` paths before final shim deletion
- `src/app/api/community/*` stays as route handlers backed by `src/features/community/*` plus `src/platform/supabase/*`
- `src/app/api/personalization/*` stays as route handlers backed by `src/features/vault/*` plus `src/platform/supabase/*`
- `src/app/api/auth/*` stays as route handlers backed by `src/domains/auth/*` plus `src/platform/supabase/*`

Compact ownership matrix for the remaining legacy buckets:
- `src/components/atoms/*` -> `src/shared/ui/atoms/*`
- `src/components/molecules/*` and `src/components/molecules/card/*` -> `src/shared/ui/molecules/*`
- `src/components/admin/*` -> `src/features/admin/ui/*`
- `src/components/organisms/video-player/*` and `src/components/organisms/VideoPlayer.tsx` -> `src/features/player/*`
- `src/lib/community.ts` and `src/lib/server/community-activity.ts` -> `src/features/community/*`
- `src/lib/media-slugs.ts` -> `src/shared/utils/media-slugs.ts`
- `src/lib/media-hub-segments.ts` -> `src/app/_shared/route-helpers/media-hub-segments.ts`
- `src/lib/media-safety.ts` -> `src/domains/catalog/contracts/media-safety.ts`

- [ ] **Step 4: Replace any remaining route-root helper files with `_components` or feature modules**

- [ ] **Step 5: Run rewiring verification**

Run:
- `rtk node --test tests/unit/structure-boundaries.test.mjs tests/unit/home-ia.test.mjs tests/unit/lib-runtime-imports.test.mjs`
- `rtk npm run typecheck`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features src/app tests/unit/structure-boundaries.test.mjs tests/unit/home-ia.test.mjs tests/unit/lib-runtime-imports.test.mjs
git commit -m "refactor: rewire app and features to domain entrypoints"
```

## Task 9: Migrate `unstable_cache` to Next.js 16 Cache APIs

**Files:**
- Modify: `next.config.ts`
- Modify: `src/features/home/server/home-feed-loader.ts`
- Modify: `src/domains/movies/server/browse.ts`
- Modify: `src/domains/series/server/browse.ts`
- Modify: any remaining `unstable_cache` call sites
- Test: `tests/unit/structure-boundaries.test.mjs`

- [ ] **Step 1: Write a failing structural assertion that `unstable_cache` is gone from migrated modules**

```js
test("home and browse loaders do not use unstable_cache", () => {
  const files = [
    "src/features/home/server/home-feed-loader.ts",
    "src/domains/movies/server/browse.ts",
    "src/domains/series/server/browse.ts",
  ];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.equal(source.includes("unstable_cache"), false);
  }
});
```

- [ ] **Step 2: Run the boundary tests to verify failure**

Run: `rtk node --test tests/unit/structure-boundaries.test.mjs`
Expected: FAIL because the code still uses `unstable_cache`.

- [ ] **Step 3: Enable Next.js 16 cache components**

Add to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: projectRoot,
  },
};
```

- [ ] **Step 4: Replace `unstable_cache` with `use cache` or `use cache: remote` where appropriate**

Rules:
- domain/page/data cache backed by Vercel runtime cache can use `use cache: remote`
- request-time personalized flows stay request-time and should not be force-cached
- preserve explicit Redis/Valkey ownership for non-Next cache concerns

- [ ] **Step 5: Run verification**

Run:
- `rtk node --test tests/unit/structure-boundaries.test.mjs`
- `rtk npm run typecheck`
- `rtk npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add next.config.ts src/features/home/server/home-feed-loader.ts src/domains/movies/server/browse.ts src/domains/series/server/browse.ts tests/unit/structure-boundaries.test.mjs
git commit -m "refactor: migrate cache loaders to next16 cache apis"
```

## Task 10: Delete Compatibility Shims, Drain `src/lib`, and Final Verification

**Files:**
- Delete: compatibility re-export files in `src/lib/**` that are no longer needed
- Modify: `README.md`
- Modify: `docs/runtime-architecture.md`
- Modify: `tests/unit/structure-boundaries.test.mjs`
- Modify: any remaining imports to point at final `domains`/`platform`/`shared` locations
- Test: `tests/unit/*.test.mjs`

- [ ] **Step 1: Write a failing test that legacy ownership files are gone**

```js
test("legacy generic comic-cache file is removed", () => {
  assert.equal(existsSync("src/lib/server/comic-cache.ts"), false);
});
```

- [ ] **Step 2: Run full unit verification to verify remaining legacy shims still exist**

Run: `rtk npm run test:unit`
Expected: FAIL until callers stop depending on the old locations and the cleanup lands.

- [ ] **Step 3: Delete obsolete shims and finish import cleanup**

Required deletions:
- `src/lib/server/comic-cache.ts`
- legacy `src/lib/search/*` shims once all callers are migrated
- legacy `src/lib/adapters/*` shims once all callers are migrated
- migrated `src/lib/enrichment*.ts` shims once callers point at `src/platform/enrichment/*`
- migrated `src/lib/cloudflare-cache.ts` shim once callers point at `src/platform/cache/http/cache-headers.ts`
- migrated `src/lib/auth-gateway.ts`, `src/lib/shorts-paths.ts`, `src/lib/seo.ts`, `src/lib/site.ts`, `src/lib/navigation.ts`, `src/lib/route-chrome.ts`, `src/lib/video-player*.ts`, and `src/lib/watch-surface.ts` once their final owners are active

Before deleting `src/lib/server/comic-cache.ts`, confirm zero remaining imports from:
- `src/lib/server/comic-service.ts`
- `src/lib/server/request-rate-limit.ts`
- `src/lib/server/user-preferences.ts`
- `src/domains/search/**`
- `src/domains/movies/**`
- `src/domains/series/**`
- `src/domains/comics/**`
- `src/domains/shorts/**`

- [ ] **Step 4: Update architecture docs to match the new source tree**

Required docs:
- `README.md`
- `docs/runtime-architecture.md`

- [ ] **Step 5: Run final verification**

Run:
- `rtk npm run test:unit`
- `rtk npm run lint`
- `rtk npm run typecheck`
- `rtk npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add README.md docs/runtime-architecture.md tests/unit/structure-boundaries.test.mjs src
git commit -m "refactor: finalize jawatch file structure migration"
```

## Execution Notes

### Fresh-agent context brief
Every worker executing a task should assume:
- Vercel-first runtime
- development mode active
- public IA is fixed
- database is the source of truth
- OpenSearch handles retrieval/query
- Valkey owns search/query cache
- Redis owns page/data/domain cache
- Cloudflare/OpenNext/gateway path is legacy only

### Mutation protocol
- If a task discovers a shared file conflict with another lane, stop and split the file ownership before continuing.
- If a task needs a temporary shim, add it in that task and delete it in Task 10.
- Do not widen `shared` just to avoid thinking about ownership.

### Recommended execution order
1. Task 1
2. Tasks 2, 3, 4 in parallel
3. Tasks 5, 6, 7 in parallel
4. Task 8
5. Task 9
6. Task 10
