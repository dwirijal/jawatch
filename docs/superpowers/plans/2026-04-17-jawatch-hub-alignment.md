# Jawatch Hub Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `/watch/movies`, `/watch/series`, and `/read/comics` behind one shared hero/layout rhythm using existing hub components only.

**Architecture:** Extend `MediaHubTemplate` so it owns the shared shell: spotlight hero, optional personal slot, and consistent section spacing. Extend `MediaHubHeader` so all hubs can render the same editorial hero without creating a second page-shell family. Keep hub content stacks composed from existing `SectionCard`, `MediaCard`, `ContinueWatching`, and `SavedContentSection`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind utility classes, existing Jawatch atoms/molecules/organisms.

---

## File Map

- Modify: `src/components/organisms/MediaHubTemplate.tsx`
  Responsibility: shared hub frame, optional hero data, optional personal slot, result section placement.
- Modify: `src/components/organisms/MediaHubHeader.tsx`
  Responsibility: shared spotlight hero proportions, image treatment, metadata/badge/actions layout, consistent height.
- Modify: `src/components/organisms/SavedContentSection.tsx`
  Responsibility: allow hub pages to hide auth-gate chrome when the personal slot should fully disappear.
- Modify: `src/components/organisms/ContinueWatching.tsx`
  Responsibility: allow hub pages to hide auth-gate chrome when the personal slot should fully disappear.
- Modify: `src/app/movies/MoviesPageClient.tsx`
  Responsibility: stop using custom standalone hero shell, supply shared hero data and personal modules, keep movie-specific shelves/filters.
- Modify: `src/app/series/SeriesPageClient.tsx`
  Responsibility: move to the same shared shell order, supply shared hero data and personal modules, keep release radar and spotlights.
- Modify: `src/app/_comics/ComicPageClient.tsx`
  Responsibility: move to the same shared shell order, supply shared hero data and personal modules, keep subtype shelves.
- Test: `tests/e2e/smoke.spec.ts`
  Responsibility: keep canonical hub route smoke coverage healthy if selectors or route behavior need updates.
- Test: `tests/e2e/ia-routes.spec.ts`
  Responsibility: keep route expectations aligned if hub behavior changes affect public surface assertions.

### Task 1: Shared Hub Shell Contract

**Files:**
- Modify: `src/components/organisms/MediaHubTemplate.tsx`
- Modify: `src/components/organisms/MediaHubHeader.tsx`

- [ ] **Step 1: Review the current shell API and write down the target contract**

Target additions:

```ts
type MediaHubHero = {
  label?: string;
  title: string;
  description: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  badges?: string[];
  actions?: React.ReactNode;
}
```

`MediaHubTemplate` should accept:
- `hero?: MediaHubHero`
- `personalSection?: React.ReactNode`
- `heroFooter?: React.ReactNode`
- keep current results/children behavior intact

- [ ] **Step 2: Extend `MediaHubHeader` to render the shared spotlight hero**

Implementation requirements:
- keep existing `layoutVariant="editorial"` path, do not create a parallel hero component
- support optional background image with a dark gradient overlay
- support badge row, meta line, and action row
- keep hero height stable across hubs
- preserve existing title/description-only usage for other pages

- [ ] **Step 3: Update `MediaHubTemplate` to own the common page rhythm**

Implementation requirements:
- render `MediaHubHeader` first
- render `personalSection` immediately below the hero when provided
- keep results section and `children` below personal content
- keep shared container width and shared section spacing
- preserve deferred ad placement after content stack

- [ ] **Step 4: Run targeted verification**

Run: `rtk npm run lint -- src/components/organisms/MediaHubTemplate.tsx src/components/organisms/MediaHubHeader.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/organisms/MediaHubTemplate.tsx src/components/organisms/MediaHubHeader.tsx
git commit -m "refactor: unify hub shell contract"
```

### Task 2: Personal Block Visibility Rules

**Files:**
- Modify: `src/components/organisms/SavedContentSection.tsx`
- Modify: `src/components/organisms/ContinueWatching.tsx`

- [ ] **Step 1: Add an opt-out for auth-gate placeholder rendering**

Target prop:

```ts
hideWhenUnavailable?: boolean
```

Rules:
- when loading: still return `null`
- when unauthenticated and `hideWhenUnavailable` is true: return `null`
- when authenticated but empty: return `null`
- default behavior must stay unchanged outside the hub pages

- [ ] **Step 2: Run targeted verification**

Run: `rtk npm run lint -- src/components/organisms/SavedContentSection.tsx src/components/organisms/ContinueWatching.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/organisms/SavedContentSection.tsx src/components/organisms/ContinueWatching.tsx
git commit -m "refactor: support hidden hub personal slots"
```

### Task 3: Movies Hub Migration

**Files:**
- Modify: `src/app/movies/MoviesPageClient.tsx`
- Modify: `src/components/organisms/MediaHubTemplate.tsx`

- [ ] **Step 1: Replace the standalone movie hero with the shared shell**

Implementation requirements:
- derive one featured movie from current `getFeaturedMovie(...)`
- pass hero label, title, description, meta, badges, image, and CTA row into `MediaHubTemplate`
- move movie browse controls into a movie-specific section below the personal slot

- [ ] **Step 2: Move personal modules directly after the hero**

Use:
- `ContinueWatching type="movie" ... hideWhenUnavailable`
- `SavedContentSection type="movie" ... hideWhenUnavailable`

- [ ] **Step 3: Preserve movie-specific discovery**

Keep:
- filtered results section
- movie browse controls
- browse by shelf
- popular
- latest
- top rated
- genre rows

Constraints:
- do not reintroduce a second top-level page shell
- keep card sizes and section spacing on the shared rhythm

- [ ] **Step 4: Run targeted verification**

Run: `rtk npm run lint -- src/app/movies/MoviesPageClient.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/movies/MoviesPageClient.tsx
git commit -m "refactor: align movies hub shell"
```

### Task 4: Series Hub Migration

**Files:**
- Modify: `src/app/series/SeriesPageClient.tsx`

- [ ] **Step 1: Derive a single spotlight series item**

Preferred source order:
1. active filtered latest
2. active filtered popular
3. any latest

The hero copy should describe anime, donghua, and drama as one canonical episodic hub.

- [ ] **Step 2: Move personal modules immediately after the hero**

Use existing modules only:
- `ContinueWatching` for episodic content using the closest supported saved type
- `SavedContentSection` for the closest supported episodic saved type

If a clean multi-type mapping is not possible without broad store refactors, omit the module rather than adding a new store abstraction.

- [ ] **Step 3: Keep series-specific sections in the shared rhythm**

Keep:
- browse by shelf
- popular
- latest
- release radar
- donghua spotlight
- drama spotlight

Shift browse/filter UI into hub content, not the hero footer.

- [ ] **Step 4: Run targeted verification**

Run: `rtk npm run lint -- src/app/series/SeriesPageClient.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/series/SeriesPageClient.tsx
git commit -m "refactor: align series hub shell"
```

### Task 5: Comics Hub Migration

**Files:**
- Modify: `src/app/_comics/ComicPageClient.tsx`

- [ ] **Step 1: Derive a single spotlight comic item**

Preferred source order:
1. current subtype newest
2. current subtype popular
3. all-variant newest

- [ ] **Step 2: Move personal modules immediately after the hero**

Use:
- `SavedContentSection type="manga" ... hideWhenUnavailable`

If `ContinueWatching` is already meaningful for manga history in store, place it above saved; otherwise keep saved only.

- [ ] **Step 3: Keep comic-specific sections in the shared rhythm**

Keep:
- browse by shelf
- browse by type
- trending
- latest

Genre filtering remains a content-area control, not a hero control strip.

- [ ] **Step 4: Run targeted verification**

Run: `rtk npm run lint -- src/app/_comics/ComicPageClient.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/_comics/ComicPageClient.tsx
git commit -m "refactor: align comics hub shell"
```

### Task 6: Cross-Hub Verification

**Files:**
- Modify if needed: `tests/e2e/smoke.spec.ts`
- Modify if needed: `tests/e2e/ia-routes.spec.ts`

- [ ] **Step 1: Run static verification**

Run: `rtk npm run lint`
Expected: PASS

Run: `rtk npm run typecheck`
Expected: PASS

Run: `rtk npm run build`
Expected: PASS

- [ ] **Step 2: Run targeted hub checks**

Routes to inspect:
- `/watch/movies`
- `/watch/movies?genre=Action`
- `/watch/series`
- `/watch/series?type=anime`
- `/watch/series?type=donghua`
- `/read/comics`
- `/read/comics?type=manga`
- `/read/comics?type=manhwa`
- `/read/comics?type=manhua`

Expected:
- shared hero rhythm across all hubs
- no shared control strip below hero
- personal block appears only when populated
- section order matches the approved pattern

- [ ] **Step 3: Update smoke tests only if markup or route expectations require it**

Run: `rtk npm run test:e2e -- --grep \"smoke|ia\"`
Expected: PASS or documented environment limitation

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts tests/e2e/ia-routes.spec.ts
git commit -m "test: cover aligned media hubs"
```

### Task 7: Documentation Sync

**Files:**
- Modify if needed: `docs/runtime-architecture.md`
- Modify if needed: `docs/jawatch-ia-route-map.md`

- [ ] **Step 1: Update docs if the shared shell contract or hub responsibilities changed materially**

Minimum doc note:
- `MediaHubTemplate` is now the shared hub frame
- `MediaHubHeader` is now the shared spotlight hero
- hub-specific discovery remains route-owned

- [ ] **Step 2: Run final status check**

Run: `rtk git status -sb`
Expected: only intended changes remain staged or unstaged

- [ ] **Step 3: Commit**

```bash
git add docs/runtime-architecture.md docs/jawatch-ia-route-map.md
git commit -m "docs: record aligned hub shell"
```

## Self-Review Checklist

- [ ] No new parallel hub shell component was added
- [ ] `MediaHubHeader` handles the shared spotlight hero
- [ ] `MediaHubTemplate` owns the shared page rhythm
- [ ] Movies, series, and comics use the same shell order
- [ ] Personal blocks disappear when unavailable
- [ ] Movie/series/comic-specific sections still work
- [ ] `lint`, `typecheck`, and `build` pass
