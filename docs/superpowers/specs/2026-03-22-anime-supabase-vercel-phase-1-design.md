# Anime Supabase Vercel Phase 1 Design

## Goal

Move anime list and anime detail reads in `dwizzyWEEB` away from unstable upstream provider calls and away from the homelab API hot path.

Phase 1 will use:

- `dwizzySCRAPE` as the ingest pipeline
- Supabase as the source of truth for anime catalog, anime details, and episode details
- `dwizzyWEEB` server-side data access for public anime pages
- Vercel as the target deployment runtime for the public site

The primary success criteria are:

- anime pages render from Supabase-backed data
- public page rendering stays server-first and cacheable
- browser-side requests do not need privileged Supabase access
- homelab traffic is reduced or removed from anime read paths

## Scope

Included in phase 1:

- home anime section
- `/anime`
- `/anime/[slug]`
- shared anime data adapter inside `dwizzyWEEB`
- server-side caching and fallback behavior

Explicitly out of scope for phase 1:

- migrating manga, movies, or donghua
- replacing every legacy anime provider call
- full search migration
- auth changes
- monetization or ad runtime changes
- Vercel deployment cutover itself

## Recommended Approach

Use `dwizzyWEEB -> server-side adapter -> Supabase` for anime pages.

Why this is the recommended boundary:

- It removes the homelab from the anime hot path.
- It avoids exposing elevated Supabase access to the browser.
- It fits Next App Router well because list and detail pages can render on the server and use `revalidate`.
- It keeps the current frontend architecture incremental. Only anime surfaces change first.

Alternatives considered:

1. Browser reads Supabase directly.
   This has fewer hops but weakens control over query shape, caching, and rollout safety.

2. `dwizzyWEEB -> api.dwizzy.my.id -> Supabase`.
   This is a clean backend boundary, but today it adds another network hop and depends on a less stable origin path.

## Architecture

### Data Pipeline

`dwizzySCRAPE` continues writing:

- `samehadaku_anime_catalog`
- `samehadaku_anime_details`
- `samehadaku_episode_details`

`dwizzyWEEB` will read anime data from Supabase using server-side functions only.

The browser should receive rendered HTML and serialized page props, not direct privileged queries.

### Application Boundary

Add a new anime repository layer in `dwizzyWEEB`:

- `src/lib/anime-source.ts` or similar

Responsibilities:

- fetch catalog rows for list pages
- fetch detail row by slug
- normalize Supabase row shapes into UI-friendly models
- hide Supabase column names from page components
- provide safe fallbacks when detail data is incomplete

Existing `src/lib/api.ts` remains in place for non-anime domains and for transitional paths still using legacy providers.

### Deployment Shape

Target runtime after phase 1:

- `dwizzyWEEB` on Vercel
- anime pages rendered server-side with cached reads
- Supabase used as the anime data origin

This keeps page rendering close to the framework while reducing server load on the homelab.

## Data Flow

### Home Anime Section

1. Home page server component requests a small anime list from the Supabase adapter.
2. Adapter reads catalog rows ordered for the home surface.
3. Page renders cards directly from normalized data.
4. Result is cached with `revalidate`.

### Anime Hub

1. `/anime` requests paged catalog rows from the Supabase adapter.
2. Adapter returns normalized catalog cards.
3. Client-side filters remain UI-only at first if possible.
4. If server-side filtering is needed, it is added through adapter query params, not ad hoc fetches in components.

### Anime Detail

1. `/anime/[slug]` requests detail from Supabase.
2. Adapter joins or composes:
   - catalog row
   - anime detail row
   - optional episode count or first episode link
3. Page renders hero, metadata, synopsis, cast, and episode CTA from normalized data.
4. If detail enrichment is missing, the page still renders from catalog fallback fields.

## Caching Strategy

Use server-side caching first.

Recommended default:

- anime list surfaces: `revalidate` around `10m`
- anime detail surfaces: `revalidate` around `30m`

Principles:

- no browser polling for public anime pages
- no client-side fan-out to upstream sources
- no direct client cache dependency for primary page content

The scraper remains responsible for freshness. The web app remains responsible for stable delivery.

## Supabase Access Model

For phase 1, prefer server-side access from Vercel to Supabase.

Two acceptable models:

1. Vercel server components use Supabase with restricted server-side credentials
2. Vercel server components use a locked-down public read surface with RLS

Preferred phase 1 implementation:

- server-side read path only
- no service key in the browser
- no direct browser dependency for anime list/detail

## UI Impact

Anime pages should keep the current visual system introduced in the recent detail-page consistency work.

What changes:

- data origin changes from legacy provider calls to Supabase-backed models

What should stay stable:

- spacing rhythm
- hero treatment
- CTA layout
- cast rail
- section order

This phase is primarily a data source migration, not a visual redesign.

## Error Handling

If Supabase data is partial:

- list page shows available catalog cards
- detail page falls back to catalog title, poster, genres, and synopsis excerpt

If a slug does not exist:

- render standard `notFound`

If Supabase is temporarily unavailable:

- page returns a degraded but explicit empty state
- do not fall back to live upstream provider calls for phase 1 public pages

The reason for avoiding fallback to the old upstreams is to keep runtime behavior predictable and keep page latency bounded.

## Rollout Plan

1. Add anime Supabase adapter and normalizers.
2. Migrate home anime section to adapter.
3. Migrate `/anime` hub to adapter.
4. Migrate `/anime/[slug]` detail to adapter.
5. Leave episode page and search modal on legacy path until phase 2.
6. Validate local build and render behavior.
7. Prepare Vercel env vars and deploy.

## Testing Strategy

Required verification for this phase:

- adapter unit tests for row normalization and fallback behavior
- page-level smoke validation for `/`, `/anime`, `/anime/[slug]`
- `npm run lint`
- `npm run build`

Live checks after deployment:

- home anime section renders from Supabase-backed data
- anime hub pagination/list works
- anime detail pages resolve existing slugs
- no browser-side privileged Supabase access appears in the client bundle

## Risks

### Incomplete Backfill

Some anime may exist in catalog but not yet have detail rows. The adapter must tolerate this and degrade gracefully.

### Schema Drift

Scraper schema may evolve. The adapter should isolate the UI from raw database fields.

### Over-fetching

If the adapter pulls too many columns or too many rows for list surfaces, Vercel render time will degrade. Queries should stay minimal and surface-specific.

### Mixed Runtime Paths

If some anime pages still call old provider APIs while others read Supabase, debugging becomes noisy. This phase should keep the migration boundary explicit and documented.

## Phase 2 Preview

After phase 1 stabilizes:

- migrate anime episode page to Supabase-backed episode details
- migrate anime search to a Supabase-backed path or dedicated search index
- decide whether `api.dwizzy.my.id` should later become a read facade again for media domains
