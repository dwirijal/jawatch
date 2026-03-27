# dwizzyAUTH To dwizzyWEEB Soft Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `dwizzyWEEB` auth-aware by consuming a minimal session bridge from `dwizzyAUTH`, rendering signed-in state in shared navigation, and soft-gating personal actions while keeping bookmarks and history local in v1.

**Architecture:** Extend `dwizzyAUTH` with a credentialed session endpoint and a sanitized logout `returnTo` contract. Add a single auth adapter in `dwizzyWEEB`, use it to hydrate shell auth state, and route all gated actions through that adapter so the app never reads Supabase cookies directly.

**Tech Stack:** Next.js 16 App Router, Vercel, Supabase Auth SSR, React 19, TypeScript, Vitest in `dwizzyAUTH`, ESLint/build/manual smoke checks in `dwizzyWEEB`

---

### Task 1: Add Session Bridge Endpoint In `dwizzyAUTH`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/app/api/session/route.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/lib/auth/session-origin.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/lib/auth/current-user.ts`
- Test: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/tests/routes/session-route.test.ts`
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-24-dwizzyauth-weeb-soft-gate-design.md`

- [ ] **Step 1: Write the failing session-route tests**

Use `@security-review`.

Cover:

- trusted origin + signed out -> `401 { authenticated: false }`
- trusted origin + signed in -> `200` with minimal user payload only
- untrusted origin does not get permissive credentialed CORS headers
- `Cache-Control: private, no-store` is always present

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
pnpm test tests/routes/session-route.test.ts
```

Expected: FAIL because the session route and origin helper do not exist yet.

- [ ] **Step 3: Implement origin allowlist helper**

Add a helper that:

- reads trusted origins from env or a safe constant list
- validates exact origin matches only
- produces the headers needed for credentialed CORS

- [ ] **Step 4: Implement `GET /api/session`**

The route must:

- use the existing Supabase server client
- call `auth.getUser()`
- optionally read `public.profiles`
- return only:
  - `authenticated`
  - `user.id`
  - `user.displayName`
  - `user.avatarUrl`
  - `user.provider`

- [ ] **Step 5: Run the route tests and repo verification**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
pnpm test tests/routes/session-route.test.ts
pnpm lint
pnpm typecheck
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
git add app/api/session/route.ts lib/auth/session-origin.ts lib/auth/current-user.ts tests/routes/session-route.test.ts
git commit -m "feat: add auth session bridge endpoint"
```

### Task 2: Extend `dwizzyAUTH` Logout With Relative `returnTo`

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/app/logout/route.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/lib/auth/redirect.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/tests/routes/auth-routes.test.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/README.md`

- [ ] **Step 1: Write the failing logout tests**

Use `@security-review`.

Cover:

- `POST /logout` with safe relative `returnTo` redirects there
- invalid or absolute `returnTo` falls back to `/login`
- `GET /logout` still returns `405`

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
pnpm test tests/routes/auth-routes.test.ts
```

Expected: FAIL on the new logout cases.

- [ ] **Step 3: Reuse redirect sanitization for logout**

Add or reuse a helper so logout and login follow the same relative-only redirect rules.

- [ ] **Step 4: Update the logout route**

The route must:

- stay `POST`-only
- sanitize `returnTo`
- sign out with Supabase
- redirect to sanitized `returnTo` or `/login`

- [ ] **Step 5: Run repo verification**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
git add app/logout/route.ts lib/auth/redirect.ts tests/routes/auth-routes.test.ts README.md
git commit -m "feat: add safe logout return target"
```

### Task 3: Add A Single Auth Adapter In `dwizzyWEEB`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/auth-gateway.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/auth-types.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/providers/AuthSessionProvider.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/hooks/useAuthSession.ts`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/.env.example` or existing env docs if present
- Reference: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/app/api/session/route.ts`

- [ ] **Step 1: Write a tiny contract note inside the new auth files**

Document that `auth.dwizzy.my.id` is the only auth authority consumed by `dwizzyWEEB`.

- [ ] **Step 2: Implement the auth gateway**

Expose:

- `getAuthStatus()`
- `buildLoginUrl(nextPath)`
- `buildLogoutRequest(nextPath)`

The gateway must be the only place that knows the auth domain.

- [ ] **Step 3: Implement client-side auth session provider**

The provider must:

- fetch the session bridge from the browser with `credentials: include`
- expose loading, authenticated, and user states
- avoid direct Supabase coupling inside `dwizzyWEEB`

- [ ] **Step 4: Add environment/config access**

Support at least:

- production auth origin
- local override for development

- [ ] **Step 5: Verify with existing repo checks**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
git add src/lib/auth-gateway.ts src/lib/auth-types.ts src/components/providers/AuthSessionProvider.tsx src/components/hooks/useAuthSession.ts .env.example
git commit -m "feat: add dwizzyauth gateway adapter"
```

### Task 4: Make The Shared Shell Auth-Aware

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/app/layout.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/AuthNavEntry.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/AuthMobileEntry.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/Navbar.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/MobileNav.tsx`

- [ ] **Step 1: Keep `layout.tsx` as a shell only**

Do not fetch auth state in the server layout. The layout should mount the client-side auth session provider and preserve current shell structure.

- [ ] **Step 2: Implement client-driven nav entries**

Use the auth session hook only.

- [ ] **Step 3: Create desktop and mobile auth entry components**

Signed out:

- show `Login`

Signed in:

- show avatar
- compact display name
- logout form or trigger

- [ ] **Step 4: Wire nav components**

Keep existing navigation intact. Only add the auth entry points.

- [ ] **Step 5: Verify the app builds**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
git add src/app/layout.tsx src/components/organisms/AuthNavEntry.tsx src/components/organisms/AuthMobileEntry.tsx src/components/organisms/Navbar.tsx src/components/organisms/MobileNav.tsx
git commit -m "feat: render auth-aware shell in weeb"
```

### Task 5: Soft-Gate Bookmark And Saved Content

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/molecules/BookmarkButton.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/SavedContentSection.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/molecules/AuthGateNotice.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/hooks/useAuthGate.ts`

- [ ] **Step 1: Add a reusable auth-gate helper**

It should:

- know whether the current user is authenticated
- expose the login redirect target
- provide a single way to gate click handlers

- [ ] **Step 2: Update `BookmarkButton`**

When signed out:

- do not toggle local bookmark state
- redirect to login or show a compact notice per chosen UI

When signed in:

- preserve current local-only bookmark behavior

- [ ] **Step 3: Update `SavedContentSection`**

When signed out:

- render a compact gated prompt instead of the saved grid

When signed in:

- keep the existing local-only content behavior

- [ ] **Step 4: Verify**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
git add src/components/molecules/BookmarkButton.tsx src/components/organisms/SavedContentSection.tsx src/components/molecules/AuthGateNotice.tsx src/components/hooks/useAuthGate.ts
git commit -m "feat: soft-gate saved content actions"
```

### Task 6: Soft-Gate Continue Watching And History Trackers

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/organisms/ContinueWatching.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/app/anime/episode/[slug]/AnimeEpisodeHistoryTracker.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/app/movies/watch/[slug]/MovieWatchHistoryTracker.tsx`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/lib/store.ts`

- [ ] **Step 1: Add explicit auth-aware helpers to local store flow**

Do not remove local storage. Only make it easy for trackers/components to skip writes when signed out.

- [ ] **Step 2: Update `ContinueWatching`**

When signed out:

- show a compact prompt instead of local history cards

When signed in:

- keep local history rendering

- [ ] **Step 3: Update history trackers**

Trackers should no-op when the user is signed out.

- [ ] **Step 4: Verify**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
git add src/components/organisms/ContinueWatching.tsx src/app/anime/episode/[slug]/AnimeEpisodeHistoryTracker.tsx src/app/movies/watch/[slug]/MovieWatchHistoryTracker.tsx src/lib/store.ts
git commit -m "feat: soft-gate history and continue watching"
```

### Task 7: End-To-End Smoke Verification

**Files:**
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH/README.md`
- Modify: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/README.md` or equivalent docs if present

- [ ] **Step 1: Verify `dwizzyAUTH` endpoints**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH
pnpm test
pnpm lint
pnpm typecheck
pnpm build
curl -i https://auth.dwizzy.my.id/api/session
```

Expected:

- tests/build pass
- session endpoint returns either `401` or `200` with the documented contract

- [ ] **Step 2: Verify `dwizzyWEEB` app**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual browser smoke pass**

Check:

- signed out navbar shows `Login`
- signed in navbar shows user identity
- signed out `Save` redirects to login
- signed out `SavedContentSection` and `ContinueWatching` show gated prompts
- signed in local bookmark/history flows still work

- [ ] **Step 4: Commit docs if needed**

```bash
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH add README.md
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyAUTH commit -m "docs: document auth session bridge"
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB add README.md
git -C /home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB commit -m "docs: document weeb soft-gate auth"
```

### Task 8: Acceptance Criteria

**Files:**
- Reference only

- [ ] `dwizzyAUTH` exposes a minimal credentialed session endpoint.
- [ ] `dwizzyAUTH` logout accepts optional relative `returnTo`.
- [ ] `dwizzyWEEB` shell reflects signed-in and signed-out state.
- [ ] public browsing remains open.
- [ ] bookmarks and history remain local-only for v1.
- [ ] personal actions are soft-gated through a single auth adapter path.
