# Design Doc: Jawatch IA Redesign

## 1. Objective
Redesign Jawatch into a mode-first media product with a clean public information architecture, stable canonical routes, hybrid guest/account behavior, explicit content availability states, and a monetization/search model that fits the current free-stack constraints.

## 2. Product Principles
- Jawatch is a curated unified catalog, not a source-shaped portal.
- Browsing follows user intent and consumption mode, not scraper structure.
- Public pages may consume only canonical title/unit data, never raw source rows directly.
- Routes, search, SEO, and admin behavior must remain compatible with future migration across storage/search layers.

## 3. Top-Level IA

### 3.1 Public Product IA
- `/`
- `/watch`
- `/read`
- `/vault`
- search as a header affordance, with canonical search hub at `/search?q=...`

### 3.2 Utility/Auth Routes
- `/login`
- `/signup`
- `/forgot-password`
- `/auth/callback`
- `/onboarding`

### 3.3 Admin IA
- `/admin/*`
- Admin remains outside public IA.

## 4. Route Strategy

### 4.1 Browse Routes
- `/watch`
- `/watch/shorts`
- `/watch/series`
- `/watch/movies`
- `/read`
- `/read/comics`

### 4.2 Canonical Content Routes
- `/movies/[slug]`
- `/series/[slug]`
- `/series/[slug]/episodes/[episodeSlug]`
- `/shorts/[slug]`
- `/shorts/[slug]/episodes/[episodeSlug]`
- `/comics/[slug]`
- `/comics/[slug]/chapters/[chapterSlug]`

### 4.3 Route Fallbacks
- `/series/[slug]/episodes` -> `/series/[slug]?tab=episodes`
- `/comics/[slug]/chapters` -> `/comics/[slug]?tab=chapters`

## 5. Home
- Home is adaptive.

### 5.1 New User
- First viewport: small featured/editorial stage
- Followed by 2-3 algorithmic shelves

### 5.2 Returning User
- First viewport: `Continue Watching` / `Continue Reading`
- Discovery shelves follow below

### 5.3 Home Shelf Vocabulary
- `Continue`
- `Fresh Release`
- `Trending Now`
- `Popular`
- `Top Rated`
- `Because You Watched/Read`
- `Recommended Picks`

These labels are semantic product surfaces, not decorative copy.

## 6. Watch
- `Watch` is a real landing page.
- Primary sub-navigation uses segmented control.
- Top-level segments:
  - `Shorts`
  - `Series`
  - `Movies`
- `Anime`, `Donghua`, and `Drama` are subfilters under `Series`, not peer lanes.
- List pages use `Load More`, not numbered pagination and not full infinite scroll.

## 7. Read
- `Read` is a real landing page.
- V1 focuses on comics.
- Uses segmented-control navigation consistent with `Watch`.
- Main comic subtype filters:
  - `All`
  - `Manga`
  - `Manhwa`
  - `Manhua`
- List pages use `Load More`.

## 8. Vault
- `Vault` is the personal area and account center.

### 8.1 Routes
- `/vault`
- `/vault/profile`
- `/vault/history`
- `/vault/saved`

### 8.2 Vault Overview
- short profile summary
- recent history summary
- saved items summary
- likes/comments summary

### 8.3 Vault Subpages
- `/vault/profile`
  - profile
  - theme
  - language
  - playback/reading preferences
  - age access
  - NSFW opt-in controls
- `/vault/history`
  - segmented control:
    - `All`
    - `Watch`
    - `Read`
- `/vault/saved`
  - segmented control:
    - `All`
    - `Watch`
    - `Read`

### 8.4 Settings Behavior
- Changes made in `/vault/profile` are persistent.
- Quick player/reader controls are session-local only for the current browser.

## 9. Auth and Onboarding

### 9.1 Auth
- Use Supabase Auth for current phase.
- Providers:
  - `Google`
  - `Discord`
  - `email + password`
- `magic link` is deferred.

### 9.2 Guest Model
- Browser-local first
- Guest history/saved state merges into account after signup/login

### 9.3 Onboarding
- short, utility-focused flow
- captures:
  - identity
  - birth date / age access
  - media interests
  - taste seeds
  - opt-ins

## 10. Search

### 10.1 Product Behavior
- Search entry:
  - desktop: expanding header search affordance
  - mobile: more persistent search affordance
- Canonical route: `/search?q=...`

### 10.2 Search Model
- grouped results, not flat mixed lists
- title-level only in global search
- episode/chapter search stays inside title pages
- `Top Match` is the first item in a normal result group, not a hero block

### 10.3 Search Backend
- single combined OpenSearch index
- title-first indexing and retrieval
- query/filter/search state lives in URL

## 11. Canonical Page Behavior

### 11.1 Movies
- single page
- player near the top
- metadata, synopsis, cast, related below

### 11.2 Series
- title hub with tabs:
  - `Overview`
  - `Episodes`
  - `Related`
  - `Clips` if available
  - `Cast` if available

### 11.3 Comics
- title hub with tabs:
  - `Overview`
  - `Chapters`
  - `Related`

### 11.4 Shorts
- title hub exists
- main consumption happens in the episode player

## 12. Player and Reader Rules

### 12.1 Movies
- detail + player in one page
- player is the main action surface

### 12.2 Series Episode Player
- richer than shorts
- nearby access to:
  - episode navigation
  - source picker
  - comments

### 12.3 Shorts Episode Player
- minimal chrome
- thin header
- mini drawer/handle overlay
- interactions:
  - `swipe up` -> next episode
  - `swipe down` -> previous episode
  - `swipe right` -> comments
  - `swipe left` -> title detail + quick episode navigation
  - `double tap` -> like
- visible fallback buttons for like/comment remain available
- gesture-heavy model is exclusive to shorts

### 12.4 Comic Reader
- default mode: vertical long scroll
- quick controls in reader header
- persistent reading settings live in `/vault/profile`
- quick header overrides are session-local only

## 13. Social Model
- comments are written at unit level
- title pages aggregate unit comments into a collapsible tree view
- max comment depth: 2
  - original comment
  - replies
- replies may target only the original comment
- likes are unit-level only
- title likes are aggregate sums of unit likes

## 14. Availability Contract

### 14.1 Availability States
- `ready`
- `partial`
- `updating`
- `unavailable`

### 14.2 Public Behavior
- unavailable titles remain live as detail pages
- unavailable units remain live as unit pages
- `unavailable` is not treated as `404`
- fallback actions should guide the user to:
  - nearest viable unit
  - or the title hub

## 15. Resume Contract
- continue target = last unfinished unit
- if that unit is not consumable:
  - choose the nearest viable unit after the user’s last progress point
  - otherwise nearest viable unit in the same title
  - otherwise title hub

## 16. NSFW and Age Access
- minimal model uses boolean flags
- if `title.is_nsfw = true`, the whole title tree is NSFW
- if `title.is_nsfw = false` but `unit.is_nsfw = true`, that unit is independently restricted
- non-eligible users see NSFW/restricted content hidden completely
- no blur/teaser discovery for hidden NSFW content
- NSFW access requires both:
  - age eligibility via birth date
  - manual opt-in in `/vault/profile`
- the system does not actively push users to enable NSFW

## 17. Public State Vocabulary
- `loading` = skeletons shaped like final layout
- `empty` = contextual message + next action
- `error` = retry or clear fallback
- `unavailable` = content-state messaging, not load failure
- empty/error copy stays short and utilitarian

## 18. Public Data Contract
- public app reads only canonical title/unit data
- public app does not query raw source-shaped rows directly
- minimum public title/unit fields:
  - `id`
  - `slug`
  - `title`
  - `family/type`
  - `availability`
  - `release_date` when available
  - `is_nsfw`
  - primary poster/cover/thumbnail
- consumption readiness is explicit:
  - watch units expose valid stream readiness and optional downloads
  - comic chapters require `pages` to be readable
- CTA behavior must depend on availability + readiness, not ad hoc field presence

## 19. SEO / Indexability
- SEO v1 is title-first, not unit-first

### 19.1 Primary Indexable Surfaces
- `/`
- `/watch`
- `/read`
- major lane pages
- family genre pages
- canonical title pages

### 19.2 Default Non-Indexable Surfaces
- `/search`
- auth routes
- vault routes
- admin routes
- dynamic query/filter result pages
- unit pages by default

### 19.3 SEO Rules
- canonical URLs must be strict and stable
- sitemap must contain only indexable routes
- sitemap should be segmented by page family
- structured data focus:
  - `BreadcrumbList`
  - `VideoObject` where relevant
- NSFW-hidden content must not be indexable

## 20. Monetization

### 20.1 Monetization Lanes
- display ads
- support / donation
- controlled download interstitials

### 20.2 Display Ads
- may appear on:
  - home
  - watch
  - read
  - title pages
  - players
  - reader
- must not materially obstruct the core content experience

### 20.3 Support / Donation
- may appear on all pages
- intensity is tiered:
  - high: download interstitials and `/vault`
  - medium: title pages
  - low: home, watch, read, player, reader

### 20.4 Download Interstitials
- first-party Worker-rendered page
- host for v1: `jawatch.workers.dev`
- applies to all download links
- requirements:
  - short title/unit summary
  - 2 ad cards
  - support CTA
  - 15-second countdown
  - locked `Continue to Download` button until countdown completes
  - clear back action
  - explicit note that the user is leaving to an external destination
  - button opens target in a new tab
  - original interstitial tab remains open
  - page switches into `download opened` state afterward
  - button stays unavailable until refresh
- pages must be:
  - `noindex`
  - single-hop
  - restricted to download flow only

## 21. Admin
- admin is custom-built, not based on Payload
- Payload may be considered later only as an editorial CMS subsystem

### 21.1 Core Admin Routes
- `/admin/titles`
- `/admin/units`

These routes are split but connected:
- title pages can jump to related units
- unit pages can jump back to parent title context

### 21.2 `/admin/titles`
- search/filter title
- edit core metadata
- edit availability state
- edit canonical release date
- view unit aggregate
- view summary for comments and search visibility

### 21.3 `/admin/units`
- search/filter unit
- edit unit state
- inspect stream/pages readiness
- edit unit release date
- jump to parent title context
- light unit-level comment moderation

### 21.4 Admin Edit Policy
- manual edits are controlled overrides, not destructive blind overwrites
- keep source-derived values available behind the scenes for audit/reconciliation
- minimal audit requirement:
  - `edited_by`
  - `edited_at`

## 22. Testing Baseline
The redesign must not regress these guarantees:
- canonical routes do not conflict
- continue always resolves to a viable target or clean fallback
- NSFW content remains hidden for non-eligible/non-opted-in users
- unavailable title/unit pages remain live
- public app reads canonical layer only
- comic chapter public pages do not render as readable without `pages`
- watch units do not present ready-to-consume states without valid readiness

## 23. Delivery Notes
- This spec deliberately favors stable IA and behavioral contracts over premature feature expansion.
- Editorial curation can stay algorithmic-first now and become hybrid/manual later once admin curation exists.
- The app should optimize for trustworthy discovery, low route ambiguity, and transportable data boundaries.
