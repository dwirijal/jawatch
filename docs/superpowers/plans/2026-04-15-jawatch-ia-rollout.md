# Jawatch IA Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved Jawatch IA redesign in safe, testable increments without breaking the current public product, while moving the app onto canonical routes, title-first search/SEO, Vault-based personal surfaces, explicit availability states, and controlled monetization.

**Architecture:** This spec is too broad for a single big-bang rewrite, so the rollout is split into seven shippable tasks. Each task produces a stable increment with its own tests, route redirects, and minimal blast radius. Runtime reads stay SQL/canonical-data-first, auth remains on Supabase for now, and search/SEO/monetization/admin are layered on top of the new route and contract foundations instead of being intertwined from day one.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth, `postgres`, OpenSearch, Cloudflare Workers, Playwright, Node test runner

---

## File Structure Lock-In

### Existing files that stay central
- `src/app/layout.tsx` — global metadata, shell chrome, root script/meta integration
- `src/lib/navigation.ts` — top-level nav model
- `src/components/organisms/Navbar.tsx` — desktop/global nav shell
- `src/components/organisms/MobileNav.tsx` — mobile nav shell
- `src/components/organisms/MobileMenuPanel.tsx` — mobile browse/account menu
- `src/components/organisms/HomePageView.tsx` — home surface composition
- `src/app/page.tsx` — home entrypoint
- `src/app/search/page.tsx` and `src/app/search/SearchResultsPageClient.tsx` — search hub
- `src/lib/auth/session.ts` — auth gates, post-auth redirects, protected routes
- `src/lib/auth/profile.ts` — profile persistence helpers
- `src/lib/onboarding/server.ts` and `src/app/onboarding/*` — onboarding flow
- `src/app/robots.ts`, `src/app/sitemap.ts` — crawl/index controls
- `src/components/organisms/AdNetworkScripts.tsx`, `src/components/organisms/AdNetworkBootstrap.tsx`, `src/components/atoms/Ads.tsx` — ad network plumbing
- `wrangler.jsonc` — current Cloudflare config for the app

### New files/directories to create
- `src/app/watch/page.tsx`
- `src/app/watch/movies/page.tsx`
- `src/app/watch/series/page.tsx`
- `src/app/watch/shorts/page.tsx`
- `src/app/read/page.tsx`
- `src/app/read/comics/page.tsx`
- `src/app/vault/page.tsx`
- `src/app/vault/profile/page.tsx`
- `src/app/vault/history/page.tsx`
- `src/app/vault/saved/page.tsx`
- `src/app/collection/page.tsx` (convert to redirect shim if retained)
- `src/lib/catalog/public-contract.ts`
- `src/lib/catalog/availability.ts`
- `src/lib/catalog/resume.ts`
- `src/lib/search/search-contract.ts`
- `src/lib/search/search-indexability.ts`
- `tests/unit/navigation-ia.test.mjs`
- `tests/unit/catalog-availability.test.mjs`
- `tests/unit/catalog-resume.test.mjs`
- `tests/unit/search-indexability.test.mjs`
- `tests/unit/adsense-config.test.mjs`
- `tests/e2e/ia-routes.spec.ts`
- `workers/download-interstitial/src/index.ts`
- `workers/download-interstitial/wrangler.jsonc`

### Redirect/compatibility surfaces to preserve during rollout
- `/collection` -> `/vault/saved`
- existing `/comic/*` -> eventually redirect/bridge to `/comics/*`
- existing `/series/short/*` -> eventually redirect/bridge to `/shorts/*`
- existing `/movies/watch/[slug]` and `/series/watch/[slug]` -> bridged to canonical routes until consumers migrate

## Scope Note

The approved spec covers multiple subsystems. This plan intentionally turns them into seven working increments:
1. route/navigation foundation
2. vault/auth migration
3. canonical availability/resume contract
4. search + SEO policy
5. monetization baseline
6. admin foundation
7. cleanup/hardening and compatibility redirects

Each increment must land in a working state before the next begins.

### Task 1: Route and Navigation Foundation

**Files:**
- Create: `src/app/watch/page.tsx`
- Create: `src/app/watch/movies/page.tsx`
- Create: `src/app/watch/series/page.tsx`
- Create: `src/app/watch/shorts/page.tsx`
- Create: `src/app/read/page.tsx`
- Create: `src/app/read/comics/page.tsx`
- Modify: `src/lib/navigation.ts`
- Modify: `src/components/organisms/Navbar.tsx`
- Modify: `src/components/organisms/MobileNav.tsx`
- Modify: `src/components/organisms/MobileMenuPanel.tsx`
- Modify: `src/components/organisms/Footer.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/navigation-ia.test.mjs`
- Test: `tests/e2e/ia-routes.spec.ts`

- [ ] **Step 1: Write failing unit tests for the new IA vocabulary**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { DESKTOP_NAV_ITEMS, MOBILE_NAV_ITEMS } from "../../src/lib/navigation.ts";

test("desktop nav exposes Home, Watch, Read, Vault", () => {
  const labels = DESKTOP_NAV_ITEMS.map((item) => item.label);
  assert.deepEqual(labels, ["Home", "Watch", "Read", "Vault"]);
});

test("mobile nav keeps search as an action instead of a top-level page link", () => {
  const searchItem = MOBILE_NAV_ITEMS.find((item) => item.key === "search");
  assert.equal(searchItem?.action, "search");
});
```

- [ ] **Step 2: Run unit tests to verify they fail**

Run: `rtk node --test tests/unit/navigation-ia.test.mjs`
Expected: FAIL because the current nav still exposes `Video`, `Komik`, `Novel`, and `Bookmark`.

- [ ] **Step 3: Add the new route pages as IA shells**

Create browse entrypoints that reuse existing browse builders first:

```tsx
// src/app/watch/page.tsx
export default function WatchLandingPage() {
  return <MediaHubTemplate mode="watch" defaultSegment="shorts" />;
}
```

```tsx
// src/app/read/page.tsx
export default function ReadLandingPage() {
  return <MediaHubTemplate mode="read" defaultSegment="comics" />;
}
```

Use existing browse/page builders where possible; avoid rewriting data loaders in this task.

- [ ] **Step 4: Rewrite navigation to the new IA**

Update `src/lib/navigation.ts` to expose:
- `Home`
- `Watch`
- `Read`
- `Vault`
- search remains an action surface

Update consumers in `Navbar`, `MobileNav`, `MobileMenuPanel`, and `Footer` so they render these new items without leaking legacy `/collection`, `/comic`, `/series/short`, or `/novel` language into top-level chrome.

- [ ] **Step 5: Add an E2E route smoke test**

```ts
import { expect, test } from "@playwright/test";

test("watch and read landings render without crashing", async ({ page }) => {
  await page.goto("/watch", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toContainText(/Watch/i);

  await page.goto("/read", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toContainText(/Read/i);
});
```

- [ ] **Step 6: Run verification**

Run:
- `rtk node --test tests/unit/navigation-ia.test.mjs`
- `rtk npx playwright test tests/e2e/ia-routes.spec.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/watch src/app/read src/lib/navigation.ts src/components/organisms/Navbar.tsx src/components/organisms/MobileNav.tsx src/components/organisms/MobileMenuPanel.tsx src/components/organisms/Footer.tsx tests/unit/navigation-ia.test.mjs tests/e2e/ia-routes.spec.ts
git commit -m "feat: add mode-first navigation shell"
```

### Task 2: Vault and Auth Surface Migration

**Files:**
- Create: `src/app/vault/page.tsx`
- Create: `src/app/vault/profile/page.tsx`
- Create: `src/app/vault/history/page.tsx`
- Create: `src/app/vault/saved/page.tsx`
- Modify: `src/app/collection/page.tsx`
- Modify: `src/lib/auth/session.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/onboarding/OnboardingWizard.tsx`
- Test: `tests/unit/onboarding-session.test.mjs`
- Test: `tests/e2e/auth-proxy.spec.ts`

- [ ] **Step 1: Write failing redirect/gate tests for Vault**

Add assertions that incomplete users and signed-out users are redirected through `/vault/*`, not `/collection`.

```js
test("post-auth redirect sends incomplete users to onboarding before vault", () => {
  assert.equal(resolvePostAuthRedirectPath("/vault/saved", false), "/onboarding");
});
```

```ts
test("signed-out /vault/saved redirects to /login with next parameter", async ({ page }) => {
  await page.goto("/vault/saved", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login\?next=%2Fvault%2Fsaved/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
- `rtk node --test tests/unit/onboarding-session.test.mjs`
- `rtk npx playwright test tests/e2e/auth-proxy.spec.ts`

Expected: FAIL on `/vault/*` assumptions because current protected surface is `/collection`.

- [ ] **Step 3: Create the Vault route family**

Implement pages with minimal composition first:
- `/vault` overview shell
- `/vault/profile`
- `/vault/history`
- `/vault/saved`

For the first increment, reuse existing `CollectionSections` and auth helpers where possible instead of rewriting stateful content.

- [ ] **Step 4: Update auth gates and redirects**

Modify:
- `src/lib/auth/session.ts`
- `src/app/auth/callback/route.ts`
- `src/app/login/page.tsx`

So safe `next` paths and protected prefixes recognize `/vault/*` as the personal area. Keep `/collection` temporarily as a compatibility shim that redirects to `/vault/saved`.

- [ ] **Step 5: Wire onboarding post-auth behavior to Vault-aware destinations**

Keep onboarding logic intact, but migrate post-auth and post-onboarding destinations away from `/collection`.

- [ ] **Step 6: Run verification**

Run:
- `rtk node --test tests/unit/onboarding-session.test.mjs`
- `rtk npx playwright test tests/e2e/auth-proxy.spec.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/vault src/app/collection/page.tsx src/lib/auth/session.ts src/app/login/page.tsx src/app/auth/callback/route.ts src/app/onboarding/page.tsx src/app/onboarding/OnboardingWizard.tsx tests/unit/onboarding-session.test.mjs tests/e2e/auth-proxy.spec.ts
git commit -m "feat: migrate personal surfaces to vault"
```

### Task 3: Canonical Availability and Resume Contract

**Files:**
- Create: `src/lib/catalog/public-contract.ts`
- Create: `src/lib/catalog/availability.ts`
- Create: `src/lib/catalog/resume.ts`
- Modify: `src/lib/adapters/movie.ts`
- Modify: `src/lib/adapters/series.ts`
- Modify: `src/lib/adapters/comic-server.ts`
- Modify: `src/components/organisms/PageStateScaffold.tsx`
- Modify: `src/components/organisms/MediaWatchPage.tsx`
- Modify: `src/components/organisms/ImageReaderScaffold.tsx`
- Test: `tests/unit/catalog-availability.test.mjs`
- Test: `tests/unit/catalog-resume.test.mjs`

- [ ] **Step 1: Write failing unit tests for availability**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { resolveAvailabilityState } from "../../src/lib/catalog/availability.ts";

test("title with live units but missing some data is partial", () => {
  assert.equal(resolveAvailabilityState({ totalUnits: 10, readyUnits: 6, updating: false }), "partial");
});
```

- [ ] **Step 2: Write failing unit tests for resume**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { resolveResumeTarget } from "../../src/lib/catalog/resume.ts";

test("resume falls to nearest viable unit when last unit is unavailable", () => {
  const target = resolveResumeTarget({
    lastUnitId: "ep-2",
    units: [
      { id: "ep-2", availability: "unavailable" },
      { id: "ep-3", availability: "ready" }
    ]
  });
  assert.equal(target?.id, "ep-3");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
- `rtk node --test tests/unit/catalog-availability.test.mjs`
- `rtk node --test tests/unit/catalog-resume.test.mjs`

Expected: FAIL because the contract modules do not exist yet.

- [ ] **Step 4: Implement canonical public contract helpers**

Create `public-contract.ts` with normalized title/unit surface types such as:

```ts
export type PublicAvailability = "ready" | "partial" | "updating" | "unavailable";

export type PublicUnit = {
  id: string;
  slug: string;
  title: string;
  family: "movie" | "series" | "short" | "comic";
  availability: PublicAvailability;
  releaseDate: string | null;
  isNsfw: boolean;
  hasStreams?: boolean;
  hasPages?: boolean;
};
```

Keep this module free of UI concerns.

- [ ] **Step 5: Implement availability and resume helpers**

Keep the rules in one place:
- `resolveAvailabilityState(...)`
- `resolveResumeTarget(...)`

Then adapt movie/series/comic adapters to emit canonical readiness rather than ad hoc booleans.

- [ ] **Step 6: Run verification**

Run:
- `rtk node --test tests/unit/catalog-availability.test.mjs`
- `rtk node --test tests/unit/catalog-resume.test.mjs`
- `rtk npm run test:movie`
- `rtk npm run test:series`
- `rtk npm run test:comic`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/catalog src/lib/adapters/movie.ts src/lib/adapters/series.ts src/lib/adapters/comic-server.ts src/components/organisms/PageStateScaffold.tsx src/components/organisms/MediaWatchPage.tsx src/components/organisms/ImageReaderScaffold.tsx tests/unit/catalog-availability.test.mjs tests/unit/catalog-resume.test.mjs
git commit -m "feat: add canonical availability and resume contracts"
```

### Task 4: Search, SEO, and Indexability Foundation

**Files:**
- Create: `src/lib/search/search-contract.ts`
- Create: `src/lib/search/search-indexability.ts`
- Modify: `src/app/search/page.tsx`
- Modify: `src/app/search/SearchResultsPageClient.tsx`
- Modify: `src/app/robots.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/lib/seo.ts` or equivalent SEO helpers if present
- Test: `tests/unit/search-indexability.test.mjs`
- Test: `tests/unit/next-config.test.mjs`

- [ ] **Step 1: Write failing indexability tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { isIndexablePath } from "../../src/lib/search/search-indexability.ts";

test("search page is not indexable", () => {
  assert.equal(isIndexablePath("/search?q=one-piece"), false);
});

test("canonical title pages are indexable", () => {
  assert.equal(isIndexablePath("/series/one-piece"), true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk node --test tests/unit/search-indexability.test.mjs`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Extract search contract and grouped result model**

Create a single grouped title-level result contract:

```ts
export type SearchGroupKey = "top" | "movies" | "series" | "shorts" | "comics";
```

Use it in `src/app/search/page.tsx` and `SearchResultsPageClient.tsx`. Do not expose raw source rows to the UI.

- [ ] **Step 4: Update crawl/index rules**

Modify:
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/layout.tsx`

to reflect the approved SEO policy:
- `/search` noindex
- `/vault`, auth, admin noindex
- title-first indexability
- prepare for `google-adsense-account` meta tag in the root layout

- [ ] **Step 5: Run verification**

Run:
- `rtk node --test tests/unit/search-indexability.test.mjs`
- `rtk node --test tests/unit/next-config.test.mjs`
- `rtk npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/search src/app/search/page.tsx src/app/search/SearchResultsPageClient.tsx src/app/robots.ts src/app/sitemap.ts src/app/layout.tsx tests/unit/search-indexability.test.mjs tests/unit/next-config.test.mjs
git commit -m "feat: add title-first search and indexability policy"
```

### Task 5: AdSense and Download Interstitial Foundation

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `public/ads.txt`
- Modify: `src/components/organisms/AdNetworkScripts.tsx`
- Modify: `src/components/organisms/AdNetworkBootstrap.tsx`
- Modify: `src/components/atoms/Ads.tsx`
- Create: `workers/download-interstitial/src/index.ts`
- Create: `workers/download-interstitial/wrangler.jsonc`
- Create: `tests/unit/adsense-config.test.mjs`

- [ ] **Step 1: Write failing tests for AdSense config**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("ads.txt contains the AdSense publisher declaration", () => {
  const adsTxt = fs.readFileSync(new URL("../../public/ads.txt", import.meta.url), "utf8");
  assert.match(adsTxt, /google\\.com, pub-8868090753979495, DIRECT, f08c47fec0942fa0/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk node --test tests/unit/adsense-config.test.mjs`
Expected: FAIL until `ads.txt` and layout metadata are updated.

- [ ] **Step 3: Add AdSense root integration**

Update `src/app/layout.tsx` to include:
- `<meta name="google-adsense-account" content="ca-pub-8868090753979495" />`
- one global AdSense script load

Do not allow component-level duplicate script injection.

- [ ] **Step 4: Add first-party download interstitial worker**

Create a separate worker entry such as:

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(renderInterstitialHtml(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  },
};
```

The page must include:
- title/unit summary
- two ad cards
- support CTA
- 15 second countdown
- disabled continue button until countdown ends
- continue opens target in a new tab
- button becomes unavailable afterward until refresh

- [ ] **Step 5: Run verification**

Run:
- `rtk node --test tests/unit/adsense-config.test.mjs`
- `rtk npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx public/ads.txt src/components/organisms/AdNetworkScripts.tsx src/components/organisms/AdNetworkBootstrap.tsx src/components/atoms/Ads.tsx workers/download-interstitial tests/unit/adsense-config.test.mjs
git commit -m "feat: add adsense baseline and download interstitial worker"
```

### Task 6: Admin Titles and Units Foundation

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/titles/page.tsx`
- Create: `src/app/admin/units/page.tsx`
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/AdminTitleTable.tsx`
- Create: `src/components/admin/AdminUnitTable.tsx`
- Create: `src/lib/admin/title-overrides.ts`
- Create: `src/lib/admin/unit-overrides.ts`
- Test: `tests/e2e/admin-shell.spec.ts`

- [ ] **Step 1: Write a failing route smoke test for admin**

```ts
import { expect, test } from "@playwright/test";

test("admin titles and units routes render a shell", async ({ page }) => {
  await page.goto("/admin/titles", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toContainText(/Titles/i);

  await page.goto("/admin/units", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toContainText(/Units/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `rtk npx playwright test tests/e2e/admin-shell.spec.ts`
Expected: FAIL because the routes do not exist yet.

- [ ] **Step 3: Add the custom admin shell**

Implement `/admin`, `/admin/titles`, and `/admin/units` as split-but-connected surfaces. Keep v1 narrow:
- title search/filter
- title metadata/state summary
- unit search/filter
- unit readiness/state summary

Do not build full edit forms in this task; land the shell first.

- [ ] **Step 4: Add minimal override storage interfaces**

Create narrow helpers that support:
- canonical release date override
- availability override
- `edited_by`
- `edited_at`

Keep persistence details behind `title-overrides.ts` and `unit-overrides.ts`.

- [ ] **Step 5: Run verification**

Run: `rtk npx playwright test tests/e2e/admin-shell.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/admin src/components/admin src/lib/admin tests/e2e/admin-shell.spec.ts
git commit -m "feat: add custom admin titles and units shell"
```

### Task 7: Compatibility Redirects, Cleanup, and Full Verification

**Files:**
- Modify: `src/lib/navigation.ts`
- Modify: `src/lib/auth/session.ts`
- Modify: `src/app/collection/page.tsx`
- Create or modify compatibility route shims under:
  - `src/app/comics/*`
  - `src/app/shorts/*`
  - `src/app/vault/*`
- Modify: `src/app/robots.ts`
- Modify: `src/app/sitemap.ts`
- Test: `tests/e2e/smoke.spec.ts`
- Test: `tests/e2e/media-detail.spec.ts`

- [ ] **Step 1: Write a checklist test for legacy route compatibility**

Add smoke assertions for the legacy surfaces that must redirect or remain stable during rollout:
- `/collection` -> `/vault/saved`
- legacy title/unit aliases remain reachable

- [ ] **Step 2: Run smoke tests to verify failures**

Run:
- `rtk npx playwright test tests/e2e/smoke.spec.ts`
- `rtk npx playwright test tests/e2e/media-detail.spec.ts`

Expected: FAIL on unimplemented redirect/alias behavior.

- [ ] **Step 3: Add compatibility shims and route redirects**

Prefer server redirects at route entrypoints rather than client-side hacks. Keep old URLs working while canonical UI/link generation moves to the new IA.

- [ ] **Step 4: Run full verification**

Run:
- `rtk npm run test:unit`
- `rtk npx playwright test`
- `rtk npm run build`
- `rtk npm run test:security`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app src/lib/navigation.ts src/lib/auth/session.ts tests/e2e/smoke.spec.ts tests/e2e/media-detail.spec.ts
git commit -m "chore: add ia compatibility redirects and verification"
```

## Delivery Guardrails
- Do not expose raw source rows to public UI.
- Keep legacy URLs working until internal linking is fully migrated.
- Do not mix availability, visibility, and indexability into one field.
- Keep NSFW hidden by default for non-eligible/non-opted-in users.
- Do not let AdSense script injection happen more than once in the root shell.
- Do not allow download interstitials to become open redirects; use signed/validated targets only.

## Suggested Execution Order
1. Task 1 — route/navigation foundation
2. Task 2 — vault/auth migration
3. Task 3 — availability/resume contract
4. Task 4 — search/SEO foundation
5. Task 5 — monetization baseline
6. Task 6 — admin foundation
7. Task 7 — compatibility cleanup and full verification
