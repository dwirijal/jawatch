# dwizzyAUTH To dwizzyWEEB Soft Gate Design

Date: 2026-03-24
Status: Draft

## Goal

Integrate `dwizzyWEEB` with `auth.dwizzy.my.id` so the app becomes auth-aware, shows signed-in state in shared navigation, and soft-gates personal actions without blocking public browsing.

This v1 integration must:

- keep browsing public
- avoid assuming Supabase session cookies are directly readable across subdomains
- keep auth ownership inside `dwizzyAUTH`
- keep bookmarks and history local for now

## Current State

### 1. `dwizzyAUTH` already owns login

`auth.dwizzy.my.id` is already live on Vercel and uses:

- Supabase Auth
- Discord as the only provider
- callback handling in `dwizzyAUTH`
- `public.profiles` on Supabase

### 2. `dwizzyWEEB` is not auth-aware yet

Today `dwizzyWEEB`:

- has no signed-in shell
- has no auth status loader
- stores bookmarks and history in local storage
- exposes `BookmarkButton`, `SavedContentSection`, `ContinueWatching`, and history trackers with no auth integration

### 3. Cross-subdomain cookie readability is not assumed

Even though auth and app share the parent domain, this design does not assume `weebs.dwizzy.my.id` can safely read Supabase session cookies issued from `auth.dwizzy.my.id`.

This is intentional. The integration should work even if session cookies remain auth-origin-specific.

## Options Considered

### Option 1: Direct Supabase session access in `dwizzyWEEB`

`dwizzyWEEB` would create its own Supabase SSR client and try to read the same session directly.

Pros:

- less network hopping
- fewer moving parts

Cons:

- depends on cross-subdomain cookie behavior
- fragile if cookie domain/path behavior changes
- couples `dwizzyWEEB` directly to auth cookie semantics

### Option 2: Auth-status bridge endpoint in `dwizzyAUTH`

`dwizzyAUTH` exposes a minimal session endpoint that returns signed-in state and a small user payload. `dwizzyWEEB` queries that endpoint with credentials.

Pros:

- keeps auth ownership inside `dwizzyAUTH`
- does not require `dwizzyWEEB` to understand Supabase cookies
- easier to reason about and debug
- keeps app shell integration small

Cons:

- adds one cross-origin request for auth status
- requires explicit CORS and origin allowlist

### Option 3: Custom token handoff between subdomains

After login, `dwizzyAUTH` would mint or relay an app-specific token to `dwizzyWEEB`.

Pros:

- maximum flexibility

Cons:

- invents a new auth protocol
- unnecessary for v1
- much higher security and implementation risk

## Recommendation

Use **Option 2**.

`dwizzyAUTH` remains the only auth-aware backend. `dwizzyWEEB` becomes a consumer of a thin auth-status bridge and uses login redirects for gated actions.

## V1 Scope

### Public browsing stays open

The following remain public:

- home
- anime/movie/manga/donghua hubs
- detail pages
- watch pages
- search

### Personal actions become soft-gated

The following become login-aware:

- `BookmarkButton`
- `SavedContentSection`
- `ContinueWatching`
- watch history trackers
- future personal/community actions

Soft-gated means:

- the UI stays visible
- signed-out users see a login prompt or are redirected to login
- signed-in state enables the action
- data still remains local-only in v1

## Architecture

### 1. `dwizzyAUTH` exposes a session endpoint

Add a new read-only endpoint to `dwizzyAUTH`, recommended path:

- `GET /api/session`

Response contract:

- `200`

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "displayName": "dwirijal",
    "avatarUrl": "https://...",
    "provider": "discord"
  }
}
```

- `401`

```json
{
  "authenticated": false
}
```

The endpoint:

- uses the existing Supabase server client in `dwizzyAUTH`
- calls `auth.getUser()`
- optionally reads `public.profiles` for a stable display name/avatar
- returns a minimal payload only
- sets `Cache-Control: private, no-store`

### 2. `dwizzyAUTH` allows trusted cross-origin reads

Because `weebs.dwizzy.my.id` will fetch this endpoint with cookies, `dwizzyAUTH` must emit strict CORS headers for trusted origins only.

Required behavior:

- exact origin allowlist
- no wildcard origin
- `Access-Control-Allow-Credentials: true`
- `Vary: Origin`

Recommended allowlist inputs:

- `https://weebs.dwizzy.my.id`
- local development origins as needed, for example `http://localhost:3002`

### 3. `dwizzyWEEB` adds an auth client

Add a small auth adapter in `dwizzyWEEB` that:

- fetches `https://auth.dwizzy.my.id/api/session`
- sends `credentials: include`
- normalizes the response into:
  - `authenticated`
  - `user`
  - `loginUrl`
  - `logoutUrl`

This adapter should be the only place in `dwizzyWEEB` that knows about `auth.dwizzy.my.id`.

### 4. Shared shell becomes auth-aware

`dwizzyWEEB` layout/navigation should render:

- signed out:
  - `Login`
- signed in:
  - avatar
  - display name or compact identity label
  - `Logout`

This should appear in:

- desktop navbar
- mobile nav or a compact mobile entry point

### 5. Soft-gated components do not sync server-side yet

For v1:

- bookmarks remain in local storage
- watch history remains in local storage
- continue watching remains local

Auth changes only whether the app treats the action as allowed or gated.

This means v1 solves:

- identity awareness
- login routing
- auth-aware UI

but does not yet solve:

- cross-device sync
- server persistence for bookmarks/history

## Login And Logout Flow

### Login

When a signed-out user hits a gated action:

- compute the current relative path
- redirect to:
  - `https://auth.dwizzy.my.id/login?next=<relative-path>`

The `next` parameter stays relative-only.

### Logout

`dwizzyWEEB` should not own logout logic.

Instead it should:

- submit to `https://auth.dwizzy.my.id/logout`
- include a relative-only `returnTo` targeting a safe public route on `weebs.dwizzy.my.id`
- rely on `dwizzyAUTH` to sanitize `returnTo` with the same relative-only discipline used for login

## UI Behavior

### Signed out

- navbar shows `Login`
- clicking `Save` / `Bookmark` / gated history actions routes to login
- `SavedContentSection` and `ContinueWatching` may show a compact prompt instead of full personal content

### Signed in

- navbar shows user identity
- gated actions are enabled
- local bookmarks/history continue to work

### Copy strategy

The copy should be low-friction, for example:

- `Login to save`
- `Login to keep your place`
- `Sign in to use personal features`

Avoid modal-heavy flows in v1.

## Security Constraints

### 1. No auth decisions from client-only heuristics

`dwizzyWEEB` must not infer signed-in state from:

- local storage flags
- manually copied tokens
- query params

Only the `dwizzyAUTH` session bridge is authoritative.

### 2. No wildcard CORS

`dwizzyAUTH` must not return `Access-Control-Allow-Origin: *` on the session endpoint.

### 3. Minimal session payload only

The session endpoint should not expose:

- full Supabase user object
- provider token details
- role blobs
- raw metadata dumps

### 4. Relative redirects only

Both login and logout return flows must sanitize `next` so untrusted absolute URLs cannot be injected.

## Testing Strategy

### `dwizzyAUTH`

Test:

- signed-out session endpoint returns `401`
- signed-in session endpoint returns minimal user payload
- untrusted origin does not receive permissive CORS headers
- trusted origin does receive the expected credentialed CORS response

### `dwizzyWEEB`

Test:

- auth adapter normalizes signed-in and signed-out responses
- navbar renders signed-out state correctly
- navbar renders signed-in state correctly
- soft-gated action redirects to login when signed out
- public routes remain renderable without auth

## Non-Goals

This v1 does not include:

- server-side bookmark sync
- server-side watch-history sync
- account settings
- comments/social graph
- Web3 auth
- moving auth into `dwizzyWEEB`

## Success Criteria

This design is successful when:

- `dwizzyWEEB` shows correct signed-in or signed-out shell state
- public browsing remains unchanged
- `Save`, `Bookmark`, and history-related actions are soft-gated
- `dwizzyWEEB` does not depend on direct Supabase cookie parsing
- `dwizzyAUTH` remains the single auth authority
