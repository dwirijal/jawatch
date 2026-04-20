# Design Doc: Jawatch File Structure Refactor

## 1. Objective
Refactor the Jawatch source tree into a Vercel-first, Next.js 16-friendly structure that makes route ownership, domain ownership, platform integrations, and cache responsibilities explicit without changing the approved public IA.

## 2. Operating Decisions

### 2.1 Project mode
- Development mode is active.
- Internal breaking changes are allowed.
- Public URLs, primary runtime contracts, and user-facing behavior should stay stable unless a cleaner replacement is explicitly defined in this doc.

### 2.2 Runtime priority
- Primary deployment target: Vercel
- Framework/runtime baseline: Next.js 16 App Router + Turbopack
- Cloudflare/OpenNext/gateway compatibility is legacy and should not shape the primary file layout.

### 2.3 Data and cache contract
- Source of truth: Postgres database
- Search/query engine: OpenSearch
- `Valkey`: search/query cache and index-adjacent cache
- `Redis`: page/data/domain cache and other domain-oriented server cache
- Supabase remains the auth/profile authority

## 3. Why This Refactor Exists
The current tree already contains some healthy boundaries, but the top-level layout still mixes several concerns:

- `src/app` contains route entrypoints together with non-special helper files that are effectively shared implementation modules.
- `src/lib` acts as a catch-all for generic utils, domain orchestration, server integrations, cache plumbing, auth wiring, and platform adapters.
- `src/lib/server/comic-cache.ts` no longer matches the runtime contract. It still encodes a fallback story (`Valkey/Redis -> Upstash`) that conflicts with the approved Vercel-first cache split.
- `unstable_cache` is still used in multiple places even though Next.js 16 now recommends `use cache` and `Cache Components`.
- Legacy gateway and Cloudflare concerns still leak into the primary application tree.

This makes the codebase harder to reason about in the exact places that matter most for a Vercel-first Next.js app:

- bundle ownership
- route/server boundary ownership
- cache invalidation ownership
- dependency-safe parallel refactors
- migration from legacy cache APIs to Next.js 16 cache APIs

## 4. External Guidance Driving the Design

### 4.1 Next.js 16 project organization
The current Next.js project structure guidance explicitly recommends route groups, private folders, safe colocation inside `app`, and the optional `src` folder for separating application code from root config. Verified on April 20, 2026:

- `project-structure`: https://nextjs.org/docs/app/getting-started/project-structure
- `route-groups`: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups

Key takeaway used here:
- keep `app` focused on routing concerns
- use route groups to partition product areas without changing URLs
- use private folders for non-routable route-local implementation details

### 4.2 Next.js 16 caching direction
Next.js 16 documents `unstable_cache` as replaced by `use cache`, with `cacheComponents`/`cacheLife` as the current model. Verified on April 20, 2026:

- `caching`: https://nextjs.org/docs/app/getting-started/caching
- `unstable_cache`: https://nextjs.org/docs/app/api-reference/functions/unstable_cache

Key takeaway used here:
- do not redesign the tree around obsolete cache APIs
- stabilize file ownership first, then migrate cache APIs in place

### 4.3 Vercel runtime constraints
Vercel runtime docs emphasize regional runtime cache behavior and function bundle limits. Verified on April 20, 2026:

- `runtime-cache`: https://vercel.com/docs/caching/runtime-cache
- `functions-limits`: https://vercel.com/docs/functions/limitations

Inference from those docs:
- server-only integrations should be isolated to keep function bundles predictable
- cache adapters should be explicit because cache lifetime and locality differ by mechanism

## 5. Target Architecture

### 5.1 Top-level source tree

```text
src/
  app/
    (public)/
    (auth)/
    (vault)/
    (admin)/
    api/
    _shared/
  features/
  domains/
  platform/
  shared/
```

### 5.2 Ownership model

#### `src/app`
Owns:
- route entrypoints
- layouts
- metadata files
- route handlers
- route-group specific private helpers

Does not own:
- domain orchestration
- database queries
- OpenSearch client code
- Valkey/Redis client code

#### `src/features`
Owns:
- UI composition per surface
- page-level and section-level assembly
- client/server presentation seams

Does not own:
- direct infrastructure clients
- raw SQL/OpenSearch wiring

#### `src/domains`
Owns:
- domain contracts
- domain server orchestration
- domain-specific UI that is reused across surfaces

Initial domains:
- `catalog`
- `movies`
- `series`
- `comics`
- `shorts`
- `search`
- `auth`
- `onboarding`

#### `src/platform`
Owns:
- Postgres access primitives
- OpenSearch access primitives
- Redis cache adapter
- Valkey cache adapter
- Supabase runtime adapter
- legacy gateway adapter kept in explicit legacy namespace

#### `src/shared`
Owns:
- generic UI primitives
- generic utilities
- global cross-domain types

Rule:
- if a file is named after one domain, provider, or product lane, it is not shared

## 6. Target Folder Map

### 6.1 `src/app`

```text
src/app/
  (public)/
    page.tsx
    watch/page.tsx
    watch/movies/page.tsx
    watch/series/page.tsx
    watch/shorts/page.tsx
    read/page.tsx
    read/comics/page.tsx
    search/page.tsx
    movies/[slug]/page.tsx
    series/[slug]/page.tsx
    series/[slug]/episodes/[episodeSlug]/page.tsx
    comics/[slug]/page.tsx
    comics/[slug]/chapters/[chapterSlug]/page.tsx
    shorts/[slug]/page.tsx
    shorts/[slug]/episodes/[episodeSlug]/page.tsx
    contact/page.tsx
    support/page.tsx
    privacy/page.tsx
    terms/page.tsx
    dmca/page.tsx
  (auth)/
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    logout/route.ts
    auth/callback/route.ts
    onboarding/page.tsx
  (vault)/
    vault/page.tsx
    vault/history/page.tsx
    vault/profile/page.tsx
    vault/saved/page.tsx
    account/age/page.tsx
  (admin)/
    admin/layout.tsx
    admin/page.tsx
  api/
    search/
    community/
    personalization/
    media/
    auth/
  _shared/
    layout/
    metadata/
    route-helpers/
```

Rules:
- only special route files stay at route roots
- route-local helpers move into `_components`, `_server`, or `_lib` under the owning route group when they are not reused elsewhere
- any module reused across multiple route families moves out of `app`

### 6.2 `src/features`

```text
src/features/
  home/
  auth/
  onboarding/
  vault/
  admin/
  community/
  search/
  player/
```

Rules:
- `features` assemble user-facing surfaces
- `features` can depend on `domains`, `shared`, and reusable contracts that live outside `app`
- `features` cannot import from `platform` directly unless the module is an explicit boundary entrypoint approved in tests

### 6.3 `src/domains`

```text
src/domains/
  catalog/
    contracts/
    server/
  movies/
    contracts/
    server/
    ui/
  series/
    contracts/
    server/
    ui/
  comics/
    contracts/
    server/
    ui/
  shorts/
    contracts/
    server/
    ui/
  search/
    contracts/
    server/
  auth/
    contracts/
    server/
  onboarding/
    contracts/
    server/
```

Rules:
- server orchestration is grouped by domain, not by transport or storage type
- DTOs and stable domain contracts live beside the domain, not inside generic `types.ts`

### 6.4 `src/platform`

```text
src/platform/
  db/
    postgres/
  search/
    opensearch/
  media/
  enrichment/
  cache/
    redis/
    valkey/
    http/
  supabase/
  gateway/
    legacy/
```

Rules:
- `platform/db/postgres` is the only owner of connection lifecycle and low-level SQL helpers
- `platform/search/opensearch` is the only owner of index creation, search requests, and bulk upserts
- `platform/enrichment` is the only owner of provider-specific enrichment clients such as TMDB and Jikan
- `platform/cache/redis` is the only owner of page/data/domain cache
- `platform/cache/valkey` is the only owner of search/query cache
- `platform/cache/http` owns shared HTTP cache header helpers for Vercel-first responses; provider-specific names like `cloudflare-cache` should not remain on the main path
- legacy gateway code is kept isolated so it cannot silently stay on the happy path

### 6.5 `src/shared`

```text
src/shared/
  ui/
  utils/
  types/
```

Rules:
- generic means reusable across at least two domains without domain-aware naming
- shared code should never import from `domains` or `platform`
- shared UI hooks and small UI stores may live under `src/shared/ui` or `src/shared/ui/store`, but they cannot depend on route-local modules in `app`

## 7. Route-Local and Feature Contract Rule
`features` must not import from `src/app`.

If a route needs route-local data or typed props:
- the contract lives in `src/domains/*/contracts`, `src/features/*`, or `src/shared/types`
- `src/app` may consume those contracts
- `src/app` does not become the owner of reusable types consumed elsewhere

This removes the ambiguity around “selected route-local props/contracts”:
- route-local implementation helpers can stay private under `app`
- reusable contracts must live outside `app`

## 7. Current-to-Target Mapping

### 7.1 Route and route-local modules
- `src/app/movies/*.ts`
  - route entry stays in `src/app/(public)/movies/...`
  - reusable page composition moves to `src/features/...`
  - domain loaders move to `src/domains/movies/server/...`
- `src/app/series/*.ts`
  - same treatment as movies
- `src/app/onboarding/*.tsx`
  - route shells stay under `src/app/(auth)/onboarding`
  - wizard/presentation modules move to `src/features/onboarding`

### 7.2 Domain orchestration now in `src/lib/adapters/*`
- `src/lib/adapters/movie*` -> `src/domains/movies/server/*`
- `src/lib/adapters/series*` -> `src/domains/series/server/*`
- `src/lib/adapters/comic*` -> `src/domains/comics/server/*`
- `src/lib/server/drama-db.ts` plus shorts-specific orchestration -> `src/domains/shorts/server/*`

### 7.3 Search
- `src/lib/search/search-contract.ts` -> `src/domains/search/contracts/search-contract.ts`
- `src/lib/search/search-service.ts` -> `src/domains/search/server/search-service.ts`
- `src/lib/search/opensearch.ts` -> `src/platform/search/opensearch/client.ts` and `title-index.ts`
- `src/lib/search/opensearch-query.ts` -> `src/platform/search/opensearch/query-builder.ts`

### 7.4 Database and cache infrastructure
- `src/lib/server/comic-db.ts` -> `src/platform/db/postgres/client.ts`
- `src/lib/server/comic-db-schema.ts` -> split between `src/platform/db/postgres/schema-capabilities.ts` and domain-specific query helpers where appropriate
- `src/lib/server/comic-cache.ts` -> removed and replaced by:
  - `src/platform/cache/redis/domain-cache.ts`
  - `src/platform/cache/valkey/query-cache.ts`

### 7.5 Supabase and proxy
- `src/lib/supabase/*` -> `src/platform/supabase/*`
- `src/lib/proxy/*` -> split between `src/platform/supabase/proxy/*` and `src/platform/gateway/legacy/*` depending on concern

### 7.6 Generic leftovers
- truly generic `src/lib/*` moves to `src/shared/utils` or `src/shared/types`
- anything still branded by domain or provider must not remain in `shared`

### 7.7 Components
- `src/components/atoms/*` -> `src/shared/ui/atoms/*`
- `src/components/molecules/*` and `src/components/molecules/card/*` -> `src/shared/ui/molecules/*`
- `src/components/admin/*` -> `src/features/admin/ui/*`
- `src/components/organisms/video-player/*` and `src/components/organisms/VideoPlayer.tsx` -> `src/features/player/*`
- product-surface organisms such as home, search, vault, and community composites move to their owning `src/features/*` area
- global shell organisms that are route-shell concerns may move to `src/app/_shared/layout/*`

### 7.8 Hooks and UI stores
- `src/hooks/useAuthGate.ts`, `useAuthSession.ts`, `useRedirectTarget.ts`, `auth-session-store.ts` -> `src/features/auth/hooks/*`
- `src/hooks/useMediaHub.ts`, `useMediaQuery.ts` -> `src/shared/ui/hooks/*` unless they become surface-specific enough for `src/features/home`
- `src/hooks/usePWAInstall.ts` -> `src/shared/ui/hooks/usePWAInstall.ts`
- `src/store/useColorModeStore.ts`, `src/store/useUIStore.ts` -> `src/shared/ui/store/*`

### 7.9 Remaining `src/lib` buckets
- `src/lib/video-player-media.ts`, `video-player-controls.ts`, `video-player-ui.ts`, `watch-surface.ts` -> `src/features/player/*`
- `src/lib/seo.ts`, `site.ts`, `navigation.ts`, `route-chrome.ts` -> `src/app/_shared/metadata/*` or `src/app/_shared/route-helpers/*` depending on ownership
- `src/lib/auth-gateway.ts` -> `src/domains/auth/server/auth-gateway.ts`
- `src/lib/enrichment.ts`, `enrichment-shared.ts`, `enrichment-movie.ts`, `enrichment-jikan.ts`, `enrichment-written.ts` -> `src/platform/enrichment/*`
- `src/lib/shorts-paths.ts` -> `src/domains/shorts/contracts/paths.ts`
- `src/lib/cloudflare-cache.ts` -> `src/platform/cache/http/cache-headers.ts`
- `src/lib/types.ts` -> `src/shared/types/index.ts`

### 7.10 Auth, catalog, media, marketing, and store families
- `src/lib/auth/*` -> split between:
  - `src/domains/auth/contracts/*`
  - `src/domains/auth/server/*`
  - `src/platform/supabase/*` for Supabase-specific runtime adapters
- `src/lib/catalog/*` -> `src/domains/catalog/contracts/*` and `src/domains/catalog/server/*`
- `src/lib/community.ts` and `src/lib/server/community-activity.ts` -> `src/features/community/*` unless a server-only ownership boundary requires a dedicated domain entrypoint
- `src/lib/media.ts` -> `src/platform/media/provider-contracts.ts`
- `src/lib/media-slugs.ts` -> `src/shared/utils/media-slugs.ts`
- `src/lib/media-hub-segments.ts` -> `src/app/_shared/route-helpers/media-hub-segments.ts`
- `src/lib/media-safety.ts` -> `src/domains/catalog/contracts/media-safety.ts`
- `src/lib/marketing.ts` and `src/lib/marketing-events.ts` -> `src/app/_shared/metadata/marketing.ts` plus `src/features/home/*` if event emission remains surface-owned
- `src/lib/store.ts`, `src/lib/store/*`, and `src/store/*` -> split between `src/shared/ui/store/*` for generic client store plumbing and `src/features/vault/store/*` for vault/personalization slices

### 7.11 Remaining `src/app` and `src/features` families
- `src/app/read/page.tsx` -> `src/app/(public)/read/page.tsx`
- `src/app/search/page.tsx` -> `src/app/(public)/search/page.tsx`
- `src/app/auth/callback/route.ts` -> `src/app/(auth)/auth/callback/route.ts`
- `src/app/account/age/page.tsx` -> `src/app/(vault)/account/age/page.tsx`
- `src/app/series/[slug]/page.tsx` and `src/app/series/[slug]/episodes/[episodeSlug]/page.tsx` stay canonical under `src/app/(public)/series/**`
- `src/app/shorts/[slug]/page.tsx` and `src/app/shorts/[slug]/episodes/[episodeSlug]/page.tsx` stay canonical under `src/app/(public)/shorts/**`
- `src/app/comics/[slug]/page.tsx` and `src/app/comics/[slug]/chapters/[chapterSlug]/page.tsx` stay canonical under `src/app/(public)/comics/**`
- `src/features/shorts/*` stays under `src/features/shorts/*` for UI/client composition, with server/data loaders moved to `src/domains/shorts/server/*`
- `src/features/comics/*`, `src/features/series/*`, `src/features/auth/*`, `src/features/home/*`, `src/features/community/*`, and `src/features/vault/*` stay in feature ownership unless a specific module is proven to belong in `domains/*/ui`

### 7.12 API families and API-support helpers
- `src/app/api/search/*` stays in `src/app/api/search/*` as route handlers backed by `src/domains/search/server/*` and `src/platform/cache/http/*`
- `src/app/api/movies/*` stays in `src/app/api/movies/*` as route handlers backed by `src/domains/movies/server/*`
- `src/app/api/series/*` stays in `src/app/api/series/*` as route handlers backed by `src/domains/series/server/*`
- `src/app/api/vertical-drama/*` stays in `src/app/api/vertical-drama/*` as route handlers backed by `src/domains/shorts/server/*`
- `src/app/api/comic/*` stays in `src/app/api/comic/*` as route handlers backed by `src/domains/comics/server/*`
- `src/app/api/lk21/*` stays in `src/app/api/lk21/*` while its implementation moves under `src/platform/gateway/legacy/*` or a later canonical movie-domain entrypoint
- `src/app/api/community/*` stays in `src/app/api/community/*` as route handlers backed by `src/features/community/*` for response shaping and `src/platform/supabase/*` for persistence adapters
- `src/app/api/personalization/*` stays in `src/app/api/personalization/*` as route handlers backed by `src/features/vault/*` and `src/platform/supabase/*`
- `src/app/api/media/*` stays in `src/app/api/media/*` as route handlers backed by the owning domain server module or `src/platform/gateway/legacy/*` when the endpoint is still source-shaped
- `src/app/api/auth/*` stays in `src/app/api/auth/*` as route handlers backed by `src/domains/auth/server/*` and `src/platform/supabase/*`
- `src/lib/server/public-api-cache.ts` -> `src/platform/cache/http/public-api-request-context.ts`
- `src/lib/server/request-rate-limit.ts` -> `src/platform/cache/redis/request-rate-limit.ts`
- `src/lib/server/viewer-nsfw-access.ts` -> `src/domains/auth/server/viewer-access.ts`
- `src/lib/server/comic-route-access.ts` -> `src/domains/comics/server/route-access.ts`

### 7.13 Intentionally deferred or compatibility-owned paths
- Any route or helper not explicitly remapped above is considered out of scope for Phase A only if it remains behind a compatibility shim with a named owner.
- Omissions are not permission to leave code in catch-all `src/lib` buckets indefinitely; they must be added to the plan before implementation starts.

## 8. Boundary Rules to Enforce in Tests

### 8.1 Allowed dependency directions
- `app` -> `features`, `domains`, `shared`, route-local private modules
- `features` -> `domains`, `shared`
- `domains` -> `platform`, `shared`
- `platform` -> `shared`

### 8.2 Forbidden dependency directions
- `shared` -> `domains` or `platform`
- `platform` -> `domains` or `features`
- `features` -> raw `platform` imports, except explicit approved entrypoints if needed
- `app` -> legacy gateway path on the default Vercel path

### 8.3 Naming rules
- stop using `comic-cache` as the generic server cache name
- stop using `server` as a catch-all when the concern is really `db`, `cache`, `search`, or `auth`

## 9. Cache Strategy After Refactor

### 9.1 Redis
Use for:
- page/data/domain cache
- browse hub aggregates
- detail aggregates
- surface-level reusable domain payloads

Examples:
- movie hub blocks
- series hub blocks
- detail payload aggregates
- home page section aggregates

### 9.2 Valkey
Use for:
- search/query cache
- OpenSearch query result cache
- index warm/write-adjacent cache
- query dedupe and query result TTL management

Examples:
- unified search result cache
- per-domain search cache
- query normalization cache
- search warmup helper state

### 9.3 Next.js cache APIs
Migration order:
1. finish file ownership refactor
2. replace `unstable_cache` with `use cache` or `use cache: remote`
3. align `cacheLife` with the new domain/platform cache split

Reason:
- migrating cache APIs before cleaning ownership would freeze the wrong boundaries in place

## 10. Execution Strategy

### 10.0 Phase boundaries
This refactor is intentionally delivered in three named phases:

- **Phase A: Structure and ownership extraction**
  - destination roots exist
  - route groups exist
  - platform adapters exist
  - domain modules exist
  - temporary re-export shims are allowed
- **Phase B: Rewiring and drain-down**
  - `features` and `app` point at final ownership paths
  - legacy `src/lib` entrypoints are no longer the default import path
  - compatibility shims are removed
- **Phase C: Next.js 16 cache migration**
  - replace `unstable_cache`
  - enable `cacheComponents`
  - align Next cache policy with the new Redis/Valkey split

The first implementation plan may cover all three phases, but each phase must have an exit criterion and may be shipped as a separate PR if the work expands.

### 10.1 Serial foundation
Start with one short serial step:
- create new directory skeleton
- add/update boundary tests
- define import path rules and ownership rules

### 10.2 Parallel lanes after guardrails
Once guardrails are in place, the following work can proceed in parallel with controlled write ownership:

- Lane A: app route groups and route-local private folder cleanup
- Lane B: platform extraction (`db`, `search`, `cache`, `supabase`, `legacy gateway`)
- Lane C: domain extraction for media domains (`movies`, `series`, `comics`, `shorts`)
- Lane D: search domain extraction and cache role correction

### 10.3 Rejoin phase
After the parallel extraction lanes are stable:
- rewire `features` and `app`
- remove compatibility imports
- migrate cache APIs
- update docs/tests

### 10.4 Exit criteria
- Phase A exit:
  - every top-level ownership bucket has a destination
  - no new code lands in catch-all `src/lib` locations
- Phase B exit:
  - runtime entrypoints compile against `domains`, `platform`, and `shared`
  - temporary shims are gone or explicitly tracked
- Phase C exit:
  - no target modules rely on `unstable_cache`
  - `cacheComponents` is enabled with verified behavior

## 11. Non-Goals
- changing the approved public IA
- redesigning user-facing copy or layout
- replacing Supabase auth in this refactor
- rebuilding OpenSearch mapping strategy beyond what is needed for ownership cleanup
- preserving Upstash fallback as a first-class runtime path

## 12. Risks and Mitigations

### 12.1 Import churn
Risk:
- large path churn can break builds repeatedly

Mitigation:
- add boundary tests first
- move by stable seams
- keep refactor in wave-based commits

### 12.2 Cache regressions
Risk:
- `comic-cache` callers may silently rely on old fallback behavior

Mitigation:
- split cache ownership explicitly
- rename adapters so every call site must make a conscious cache choice

### 12.3 Vercel bundle creep
Risk:
- platform code leaking into UI entrypoints increases function bundles

Mitigation:
- isolate platform imports to domain/server modules
- keep `app` thin

## 13. Acceptance Criteria
- `src/app` contains route concerns plus explicit private route-local helpers only
- `src/lib` no longer acts as the primary architecture bucket
- domain orchestration lives under `src/domains/*/server`
- Postgres, OpenSearch, Redis, Valkey, and Supabase live under `src/platform/*`
- legacy gateway code is isolated under `src/platform/gateway/legacy`
- `comic-cache` is removed
- cache roles match the approved split:
  - Redis = page/data/domain cache
  - Valkey = search/query cache
- boundary tests enforce the new architecture
- public URLs remain aligned with the approved IA

## 14. Verification Targets
At minimum before merge:

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run build
```

Refactor-specific verification must also include:
- boundary tests proving dependency direction
- targeted route smoke tests for moved App Router entrypoints
- targeted search tests proving OpenSearch + Valkey ownership did not regress
- targeted cache tests proving Redis and Valkey responsibilities are distinct
