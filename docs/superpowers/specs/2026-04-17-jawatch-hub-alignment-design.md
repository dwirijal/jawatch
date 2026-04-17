# Design Doc: Jawatch Hub Alignment

## 1. Objective
Align the public media hubs so `/watch/movies`, `/watch/series`, and `/read/comics` feel like one product family while preserving each hub's content-specific modules.

The alignment target is not a new page engine. The target is a shared hero/layout/frame system built from components that already exist in the codebase.

## 2. Scope

### In Scope
- Shared hero behavior and visual rhythm across hub pages
- Shared page frame behavior across hub pages
- Consistent placement rules for personal modules
- Consistent section spacing, heading rhythm, and container width
- Continued reuse of existing `SectionCard`, `MediaCard`, saved/continue modules, and current rail/grid content sections

### Out of Scope
- Replacing all hub content with a new schema-driven renderer
- Creating a new generic `HubPageAtom`
- Introducing a shared global control strip below the hero
- Rewriting existing cards and rails from scratch
- Changing route IA

## 3. Hard Constraints
- Do not create a new component when an existing component can be extended to do the job.
- Hero must focus on one featured/latest title only.
- There is no shared control strip below the hero.
- Personal content appears immediately after the hero.
- Personal content is fully hidden when no saved/continue/recommended data exists.
- Hub-specific content sections may differ, but the page pattern must remain recognizable across hubs.

## 4. Product Intent
- `Movies`, `Series`, and `Comics` should read as parallel hub surfaces.
- The hero should create an editorial premium mood, but not dominate the page for too long.
- The area immediately after the hero should feel personalized when possible.
- Discovery should remain hub-specific after the personal block.
- Consistency should come from shell, spacing, type hierarchy, and placement rules rather than identical content inventory.

## 5. Shared Pattern

### 5.1 Hub Rhythm
Each aligned hub follows this block order:

1. `Hero`
2. `Personal Block` if relevant
3. `Hub Content Stack`
4. `Optional Hub-Specific Modules`

### 5.2 Hero
The hero is a single spotlight item sourced from the strongest `featured` or `latest` item already available to the hub.

Rules:
- one item only
- one headline
- one supporting metadata line
- one short supporting description
- maximum two primary actions
- premium image-led presentation
- fixed hero height rules across hubs

Hero is not allowed to become a shared filter surface.

### 5.3 Personal Block
The first block after the hero is reserved for:
- `ContinueWatching`
- `SavedContentSection`
- recommendation modules derived from saved/fav/local history

Rules:
- render directly below hero
- hide completely when data is absent
- never render an empty placeholder state in this slot
- preserve existing module internals where possible

### 5.4 Hub Content Stack
After the personal block, each hub continues with its own existing sections:
- shelf rails
- popular grids
- latest grids
- subtype or genre groupings
- optional editorial modules

Rules:
- keep section primitives shared
- keep card sizing rules shared
- keep spacing between sections shared
- headings must follow the same hierarchy

## 6. Reuse Strategy

### 6.1 Existing Components To Reuse
- `src/components/organisms/MediaHubTemplate.tsx`
- `src/components/organisms/MediaHubHeader.tsx`
- `src/components/organisms/SectionCard.tsx`
- `src/components/atoms/Card.tsx`
- `src/components/organisms/SavedContentSection.tsx`
- `src/components/organisms/ContinueWatching.tsx`

### 6.2 Reuse Rules
- `MediaHubTemplate` becomes the shared page frame and section rhythm carrier
- `MediaHubHeader` becomes the shared hero shell
- `SectionCard` remains the standard section primitive
- `MediaCard` remains the shared catalog card primitive
- current hub-specific sections continue to compose through those primitives

### 6.3 What May Change
- `MediaHubTemplate` may gain explicit hero and personal slots
- `MediaHubHeader` may be extended so all hubs can render the same hero proportions and action layout
- existing hub pages may be reorganized so they plug their current sections into a shared frame in the same order

### 6.4 What Must Not Happen
- no second parallel page-frame system
- no new generic hub engine
- no duplicate hero components per route
- no new card family for the same browse surface

## 7. Per-Hub Mapping

### 7.1 Movies
Shared:
- hero shell
- frame
- personal slot placement
- section spacing

Custom:
- featured movie selection
- genre/sort controls inside movie-specific browse area
- `Top Rated`
- movie genre rows

### 7.2 Series
Shared:
- hero shell
- frame
- personal slot placement
- section spacing

Custom:
- active series spotlight selection
- anime/donghua/drama filtering behavior
- `Release Radar`
- `Donghua Spotlight`
- `Drama Spotlight`

### 7.3 Comics
Shared:
- hero shell
- frame
- personal slot placement
- section spacing

Custom:
- subtype spotlight selection
- manga/manhwa/manhua browse logic
- subtype shelves
- comic-specific latest/popular groupings

## 8. Visual System Rules

The visual direction should follow the already approved Jawatch premium media direction and the validated design research outcome:
- premium neutral surfaces
- restrained gold accent
- large section gaps
- strong image-led hero
- stable 3:4 card baseline
- no playful block-heavy visual language

### 8.1 Hero Rules
- hero image is LCP-aware and uses responsive image fill
- hero should feel identical in proportion across hubs
- hero copy width should be constrained for readability
- CTA row should not exceed two primary actions

### 8.2 Type Rhythm
- h1 in hero
- h2 for section titles
- small uppercase kicker only when needed
- no random per-hub heading sizes

### 8.3 Layout Rhythm
- same page container width across hubs
- same outer top/bottom spacing rhythm
- same section-to-section spacing rhythm
- same rail/grid placement rhythm

## 9. Interaction Rules
- no shared control strip under hero
- subtype, genre, and sort controls remain local to the hub-specific content area
- keyboard order must follow visual order
- active states remain explicit
- existing back/URL behavior must remain predictable

## 10. State and Data Rules

### 10.1 Source of Truth
- server data remains route-owned
- hero item is derived from route payload
- personal block visibility is derived from actual available data
- no mirrored client state for values that can be computed from props

### 10.2 Personal Block Logic
- if there is continue data, show continue
- if there is saved data, show saved
- if there is recommendation-from-saved/fav data, show recommendation
- if none of the above exist, omit the personal slot entirely

### 10.3 Hero Fallback
If the hub has no good featured/latest image candidate:
- keep shared hero layout
- fall back to text-led presentation
- use safe placeholder media
- do not switch to a different page structure

## 11. Failure Handling
- Optional hub modules must fail soft and never break the page shell
- Empty hub sections may use current skeleton/empty states
- Missing personal data must remove the block, not render broken chrome
- Hero failure must degrade to text-led, not blank

## 12. Testing Plan

### 12.1 Visual Regression Targets
- `/watch/movies`
- `/watch/series`
- `/read/comics`
- `/read/comics?type=manga`
- `/read/comics?type=manhwa`
- `/read/comics?type=manhua`
- `/watch/series?type=anime`
- `/watch/series?type=donghua`

### 12.2 Assertions
- hero proportions match across hubs
- personal slot placement matches across hubs
- personal slot hides fully when empty
- section spacing is consistent
- rails and grids retain shared card sizing
- hub-specific modules still appear in their intended positions

### 12.3 Verification
- lint
- typecheck
- build
- targeted screenshot review on desktop/tablet/mobile
- smoke checks for aligned routes

## 13. Implementation Order
1. Refine `MediaHubTemplate` into a shared page frame with hero/personal slots
2. Refine `MediaHubHeader` into the shared hero shell
3. Migrate `MoviesPageClient` to the shared frame
4. Migrate `SeriesPageClient` to the shared frame
5. Migrate `ComicPageClient` to the shared frame
6. Harmonize spacing and placement of personal modules
7. Run visual verification and route smoke checks

## 14. Success Criteria
- A user can move between movies, series, and comics hubs and immediately feel they belong to one design system
- Each hub retains its own content personality without inventing its own page skeleton
- No redundant page component family is introduced
- Existing section/card modules stay in service rather than being replaced unnecessarily
