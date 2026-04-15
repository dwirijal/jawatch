# Design Draft: Jawatch IA Redesign

## Status
Working draft checkpoint. This is not the final approved spec yet.

## Objective
Redesign Jawatch from a source-shaped product into a mode-first media product with a cleaner public IA, clearer canonical routes, hybrid guest/account behavior, and a watch/read experience that fits each medium.

## Approved Decisions So Far

### 1. Product IA
- Top-level public IA:
  - `/`
  - `/watch`
  - `/read`
  - `/vault`
  - search as a header affordance, with canonical hub at `/search?q=`
- Admin remains separate from the public IA under `/admin/*`

### 2. Browse vs Canonical Content Routes
- Browse routes are mode-first:
  - `/watch`
  - `/watch/shorts`
  - `/watch/series`
  - `/watch/movies`
  - `/read`
  - `/read/comics`
- Canonical content routes are entity-rooted:
  - `/movies/[slug]`
  - `/series/[slug]`
  - `/series/[slug]/episodes/[episodeSlug]`
  - `/shorts/[slug]`
  - `/shorts/[slug]/episodes/[episodeSlug]`
  - `/comics/[slug]`
  - `/comics/[slug]/chapters/[chapterSlug]`
- Fallback routes:
  - `/series/[slug]/episodes` -> `/series/[slug]?tab=episodes`
  - `/comics/[slug]/chapters` -> `/comics/[slug]?tab=chapters`

### 3. Home
- Home is adaptive.
- New user / no history:
  - first viewport shows a small featured/editorial stage
  - followed by 2-3 shelves
- Returning user / has history:
  - first viewport shows continue watching / continue reading
- Current strategy is algorithmic-first because admin curation tools do not exist yet.

### 4. Watch
- `Watch` is a real landing page.
- Primary sub-navigation uses segmented control.
- Main top-level watch segmentation:
  - `Shorts`
  - `Series`
  - `Movies`
- `Anime`, `Donghua`, and `Drama` belong as subfilters inside the `Series` lane, not as peers of `Shorts`, `Series`, and `Movies`.
- List pages use `Load More`, not numbered pagination and not full infinite scroll.

### 5. Read
- `Read` is a real landing page.
- V1 focuses on comics.
- Read also uses segmented control.
- Main read segmentation can remain simple for now, with subtype filtering for:
  - `All`
  - `Manga`
  - `Manhwa`
  - `Manhua`
- Comic detail uses tabs:
  - `Overview`
  - `Chapters`
  - `Related`

### 6. Vault
- `Vault` is the personal area and account center.
- Routes:
  - `/vault`
  - `/vault/profile`
  - `/vault/history`
  - `/vault/saved`
- `/vault` is an overview page with summaries for:
  - recent history
  - saved items
  - likes summary
  - short profile summary
- `/vault/profile` stores persistent profile/settings.
- Quick player/reader controls are temporary for the current browser/session only.
- `/vault/history` uses segmented control:
  - `All`
  - `Watch`
  - `Read`
- `/vault/saved` uses the same segmented control:
  - `All`
  - `Watch`
  - `Read`
- Likes and comment history remain overview summaries in v1, not dedicated pages.

### 7. Auth and Onboarding
- Keep `Supabase Auth` for now because it is the lowest-cost, lowest-ops path for the current architecture.
- V1 auth providers:
  - `Google`
  - `Discord`
  - `email + password`
- `magic link` can wait until later.
- Utility/auth routes:
  - `/login`
  - `/signup`
  - `/forgot-password`
  - `/auth/callback`
  - `/onboarding`
- Onboarding is short and utility-focused.
- Guest behavior is browser-local first, then merged into the account on signup/login.

### 8. Search
- Search is grouped, not a flat mixed result list.
- Search hub stays canonical at `/search?q=`.
- Search uses a single combined OpenSearch index for canonical title-level search.
- Episode/chapter search stays inside title pages.

### 9. Social Model
- Comments are written at the unit level.
- Title pages aggregate unit comments into a collapsible tree view.
- Comment tree depth is capped at 2:
  - original comment
  - replies
- Users can only reply to the original comment.
- Likes are also unit-level only.
- Title likes are the aggregate sum of unit likes.

### 10. Media-Specific Interaction Rules
- Movies:
  - one page
  - detail + player together
  - player stays near the top
- Series:
  - title hub with tabs:
    - `Overview`
    - `Episodes`
    - `Related`
    - `Clips` if available
    - `Cast` if available
- Shorts:
  - title hub plus dedicated episode player
  - player is gesture-rich and minimal
  - `swipe up` = next episode
  - `swipe down` = previous episode
  - `swipe right` = comments
  - `swipe left` = title detail + quick episode navigation
  - `double tap` = like
  - visible buttons for like/comment remain available
- Comic reader:
  - default reading mode is long vertical scroll
  - persistent reading settings live in `/vault/profile`
  - quick controls in the reader header are session-local only

### 11. Availability State Contract
- V1 availability states are locked to:
  - `ready`
  - `partial`
  - `updating`
  - `unavailable`
- These states should be usable consistently across:
  - title pages
  - unit pages
  - shelves
  - search results
  - continue/resume rows

### 12. Resume Contract
- Primary continue target is the last unfinished unit for the title.
- If that unit is no longer consumable, continue falls forward to the nearest viable unit within the same title.
- Priority for fallback selection:
  - nearest ready unit after the user's last progress point
  - otherwise the nearest viable unit in the same title
  - otherwise the title hub

### 13. Shelf Semantics
- Shelf vocabulary for V1 is locked to:
  - `Continue`
  - `Fresh Release`
  - `Trending Now`
  - `Popular`
  - `Top Rated`
  - `Because You Watched/Read`
  - `Recommended Picks`
- These labels are product semantics, not decorative copy.
- Their backing rules should stay stable across Home, Watch, and Read.

### 14. Admin Direction
- Admin remains separate from the public IA under `/admin/*`.
- Core admin for Jawatch will be custom-built inside the app, not based on Payload.
- Payload may be considered later only as an editorial CMS subsystem, not as the main operations/admin foundation.
- Core admin routes are split but connected:
  - `/admin/titles`
  - `/admin/units`
- `/admin/titles` v1 supports:
  - search/filter title
  - edit core metadata
  - edit availability state
  - view unit aggregate
  - view summary for comments and search visibility
- `/admin/units` v1 supports:
  - search/filter unit
  - edit unit state
  - inspect stream/pages readiness
  - jump to parent title context
  - light unit-level comment moderation
- Release date is editable manually as a controlled canonical override:
  - title-level canonical release date in `/admin/titles`
  - unit-level release date in `/admin/units`
  - source-derived values should remain preserved behind the scenes for audit/reconciliation

### 15. NSFW and Access Gating
- NSFW is modeled minimally with boolean flags.
- If `title.is_nsfw = true`, the entire title and all child units are treated as NSFW.
- If `title.is_nsfw = false` but `unit.is_nsfw = true`, that unit is restricted independently.
- Public behavior for non-eligible users is hide-total, not blur/tease:
  - NSFW/restricted content is hidden from shelves, search, continue rows, and general discovery
  - the system does not prompt users to enable NSFW
- NSFW access requires both:
  - age eligibility based on birth date
  - manual opt-in in `/vault/profile`

### 16. Public Availability Behavior
- Unavailable titles remain live as detail pages.
- Unavailable units also remain live as unit pages.
- `unavailable` is not treated as `404`.
- Public unavailable pages should:
  - explain state clearly
  - disable misleading primary consumption actions
  - offer fallback paths such as nearest viable unit or the title hub

### 17. Global State Vocabulary
- `loading` should use layout-shaped skeletons, not generic empty spinners
- `empty` should be contextual and include a next action
- `error` should offer retry or a clear fallback
- `unavailable` is a content state, not a transport/load error
- Empty and error copy should stay short and utilitarian, not theatrical/editorial

### 18. Public Data Contract
- The public app may consume only canonical title/unit data, never raw source-shaped rows directly.
- Public pages should read from a canonical API/view layer.
- Minimum public title/unit fields should include:
  - `id`
  - `slug`
  - `title`
  - `family/type`
  - `availability`
  - `release_date` when available
  - `is_nsfw`
  - primary poster/cover/thumbnail
- Consumption readiness must be explicit:
  - watch units can expose `streams` and optional `downloads`
  - comic chapters require `pages` to be readable
- Public CTA behavior should be driven by availability + readiness contracts, not by ad hoc field presence alone

### 19. SEO / Indexability Policy
- SEO for V1 is title-first, not unit-first.
- Primary indexable surfaces:
  - `/`
  - `/watch`
  - `/read`
  - major lane pages
  - genre pages
  - canonical title pages
- Default non-indexable surfaces:
  - `/search`
  - auth routes
  - vault routes
  - admin routes
  - dynamic query/filter result pages
  - unit pages by default
- Canonical URLs must be strict and stable.
- Sitemap should include only indexable routes and should be segmented by page family.
- Structured data focus for V1:
  - `BreadcrumbList`
  - `VideoObject` on relevant video pages
- NSFW-hidden content should not be indexable and should be excluded from sitemaps.

### 20. Monetization Policy
- V1 monetization lanes:
  - display ads
  - support / donation
  - controlled download interstitials
- Ad network baseline for V1:
  - Google AdSense
  - publisher account: `ca-pub-8868090753979495`
  - global account meta tag required
  - root-level AdSense script should load once
  - root `ads.txt` should publish:
    - `google.com, pub-8868090753979495, DIRECT, f08c47fec0942fa0`
- Monetization must not alter canonical content routes or break the main watch/read flow.
- Display ads may also appear in players and readers as long as they do not materially obstruct the core content experience.
- Support / donation entry may exist on all pages, but with tiered intensity:
  - high: download interstitials and `/vault`
  - medium: title pages
  - low: home, watch, read, player, and reader surfaces
- Download monetization should use a first-party Worker-rendered interstitial owned by Jawatch, not a third-party shortlink chain.
- V1 interstitial host can live on `jawatch.workers.dev`.
- V1 download interstitial applies to all download links.
- Interstitial page requirements:
  - short title/unit summary
  - two ad cards
  - support CTA
  - countdown wait of 15 seconds
  - locked `Continue to Download` button until countdown completes
  - clear back action
  - explicit indication that the user is leaving for an external destination
  - `Continue to Download` opens the target in a new tab
  - after the target opens, the interstitial tab remains on-page
  - the page should switch to a `download opened` state
  - the download button becomes unavailable until the page is refreshed
- Interstitial pages should be:
  - `noindex`
  - single-hop
  - used only for download flows, never for core watch/read consumption

## Pending Design Sections
- Detailed state behavior for title pages, players, and readers
- Search interaction model and result composition
- Admin IA for content operations
- Error/empty/loading states
- Data contracts and testing expectations
