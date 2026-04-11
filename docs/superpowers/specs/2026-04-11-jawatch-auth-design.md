# Jawatch Embedded Auth Design

Date: 2026-04-11
Status: Draft for review
Scope: Replace the legacy external auth bridge in `jawatch` with embedded auth built on Supabase Auth and Supabase Postgres, while keeping media data on Aiven and cache on Valkey/Redis.

## Goals

- Build authentication directly into `jawatch.web.id`.
- Stop depending on `auth.dwizzy.my.id` at runtime from the `jawatch` app.
- Share user identity with the existing auth ecosystem through the same Supabase project, not through the `dwizzyAUTH` repo or its routes.
- Store all user-owned app data in Supabase with RLS.
- Keep media/catalog data on the existing Aiven Postgres stack.
- Remove the dedicated `/nsfw` surface and gate NSFW content inside normal media routes.

## Non-Goals

- Do not modify the `dwizzyAUTH` repo.
- Do not migrate media/catalog ownership from Aiven to Supabase.
- Do not share cookies across `jawatch.web.id` and `auth.dwizzy.my.id`.
- Do not keep `/nsfw` as a supported product surface.
- Do not use Cloudflare Workers as the primary web app runtime for v1.

## Recommended Stack

- Auth engine: Supabase Auth
- Next.js integration: `@supabase/ssr`
- OAuth providers: Google OAuth, Discord OAuth
- Email flow: magic link / OTP
- User-owned data: Supabase Postgres with RLS
- Media data: Aiven Postgres
- Cache: Valkey/Redis and Upstash fallback where already used
- Primary web runtime: Vercel for the Next.js app
- Companion edge/async runtime: Cloudflare Workers via Wrangler where useful

Rejected options:

- NextAuth/Auth.js: not recommended because it introduces a second auth/session model separate from Supabase Auth.
- Better Auth: unnecessary extra auth layer when Supabase is already the source of truth.

## System Boundaries

- Supabase owns:
  - `auth.users`
  - shared `public.profiles`
  - all `jawatch` user-owned data
- Jawatch app owns:
  - login UI
  - auth callback and logout routes
  - route protection
  - NSFW gating
- Aiven owns:
  - media/catalog rows
  - existing media ingestion and serving model
- Redis/Valkey owns:
  - cache only

This keeps identity centralized while keeping runtime behavior embedded in `jawatch`.

## Cloudflare Workers Role

Cloudflare Workers remain part of the `jawatch` architecture, but not as a replacement for Vercel in v1.

Recommended role:

- Vercel runs the main Next.js application
- Supabase handles auth and user-owned data
- Aiven handles media/catalog data
- Cloudflare Workers handle optional companion workloads that are edge-heavy, async, or network-adjacent

Good candidate workloads for Workers:

- media proxy and normalization helpers
- source-health or cache-warming cron jobs
- webhook receivers
- queue consumers for async jobs
- request filtering, lightweight abuse controls, or bot shielding
- network-edge utilities that should not live inside the main Next.js request path

Not recommended for v1:

- moving the entire `jawatch` web app runtime off Vercel
- splitting core auth/session logic across both Vercel and Workers
- storing primary user data in Workers-managed storage instead of Supabase

Wrangler stays relevant in the repo for:

- Cloudflare deployment fallback
- previewing companion Workers locally
- type generation for Cloudflare bindings

## Runtime Flow

1. User visits `jawatch.web.id`.
2. User opens an embedded login page inside the app.
3. User signs in with Google, Discord, or email magic link through Supabase Auth.
4. Supabase redirects back to `jawatch.web.id/auth/callback`.
5. `jawatch` exchanges the auth code for a session and stores session cookies via the Supabase SSR flow.
6. `jawatch` ensures a minimal profile row exists in `public.profiles`.
7. Protected pages and write actions read the Supabase session server-side.
8. User-owned data reads/writes go to Supabase; media reads remain on Aiven.

## Shared Identity Model

`jawatch` must share identity with the existing `auth.dwizzy.my.id` ecosystem through the same Supabase project.

Rules:

- Shared global identity:
  - `auth.users`
  - `public.profiles`
- Jawatch-specific tables:
  - `public.user_preferences`
  - `public.user_collections`
  - `public.user_bookmarks`
  - `public.user_history`

This allows identity sharing without runtime dependency on `dwizzyAUTH`.

## Supabase Data Model

### Shared table

`public.profiles`

- `id uuid primary key references auth.users(id)`
- `email text`
- `display_name text`
- `avatar_url text`
- `provider text`
- `birth_date date`
- `age_verified_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

### Jawatch-owned tables

`public.user_preferences`

- `user_id uuid primary key references auth.users(id)`
- `adult_content_enabled boolean not null default false`
- `subtitle_locale text`
- `theme text`
- `created_at timestamptz`
- `updated_at timestamptz`

`public.user_collections`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `media_kind text not null`
- `media_id text not null`
- `status text not null default 'saved'`
- `created_at timestamptz`
- unique `(user_id, media_kind, media_id)`

`public.user_bookmarks`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `media_kind text not null`
- `media_id text not null`
- `chapter_or_episode_id text not null default ''`
- `created_at timestamptz`
- unique `(user_id, media_kind, media_id, chapter_or_episode_id)`

`public.user_history`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `media_kind text not null`
- `media_id text not null`
- `chapter_or_episode_id text not null default ''`
- `progress_seconds numeric`
- `progress_percent numeric`
- `last_seen_at timestamptz not null default now()`
- unique `(user_id, media_kind, media_id, chapter_or_episode_id)`

## Profile Bootstrap Rules

At first sign-in:

- create or upsert `profiles`
- populate:
  - `id`
  - `email`
  - `display_name`
  - `avatar_url`
  - `provider`
- do not require username creation in v1
- create `user_preferences` lazily when first needed

## Route Protection

Protected in v1:

- account surfaces
- collection/bookmark/history/preference reads and writes
- all current or future interactive write surfaces
- NSFW access path inside media routes

Protection rules:

- enforce server-side with a `requireUser()` helper
- do not rely on client-only auth state
- client hooks may hydrate UI but are not the source of enforcement

## NSFW Policy

`jawatch` does not keep a dedicated `/nsfw` product area.

Rules:

- NSFW content exists under normal routes:
  - `/movies`
  - `/series`
  - `/comic`
- NSFW content is hidden completely from:
  - listings
  - search
  - recommendations
  - detail pages
- access is allowed only if:
  - user is authenticated
  - user age is computed as `>= 21` from `birth_date`
  - user explicitly enables adult content via preferences
- `/nsfw` and `/nsfw/*` return `404`

This is enforced server-side.

## Age Verification Model

V1 uses two-step gating:

1. user enters `birth_date`
2. user explicitly enables adult content

Server behavior:

- compute age server-side
- set `age_verified_at` when the app first records a valid adult verification event
- derive `canAccessNsfw = isAuthenticated && age >= 21 && adult_content_enabled`

V1 does not require document verification or a separate identity provider.

## Required Environment Variables

New envs for `jawatch`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL=https://jawatch.web.id`
- `NEXT_PUBLIC_SITE_URL=https://jawatch.web.id`

Existing envs that remain relevant:

- `DATABASE_URL`
- `VALKEY_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- media/API-related envs already in use

OAuth provider secrets are configured in the Supabase dashboard, not in repo source.

## Files To Add

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/profile.ts`
- `src/app/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/logout/route.ts`

Optional future Worker-side additions:

- `workers/*` or another dedicated folder for companion Worker code
- Worker config additions in `wrangler.jsonc` only when a concrete sidecar workload is introduced

## Files To Refactor

- `src/lib/auth-gateway.ts`
- `src/lib/auth-origin.ts`
- `src/components/hooks/useAuthSession.ts`
- `src/components/providers/AuthSessionProvider.tsx`
- protected server pages/actions that currently depend on the legacy bridge
- media data loaders and search/recommendation/detail loaders for NSFW filtering
- old `/nsfw` routes so they return `404`
- `next.config.ts` CSP so legacy auth host allowances can be removed when no longer needed

## Security Requirements

- keep secrets in env only
- use Supabase SSR session cookies, not localStorage as the security boundary
- all user-owned tables use RLS
- all writes validate authenticated user server-side
- no trust in client-provided age or eligibility flags without server validation
- no direct coupling to `dwizzyAUTH` runtime endpoints

## SQL Baseline

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  provider text,
  birth_date date,
  age_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adult_content_enabled boolean not null default false,
  subtitle_locale text,
  theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id)
);

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  chapter_or_episode_id text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id, chapter_or_episode_id)
);

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_kind text not null,
  media_id text not null,
  chapter_or_episode_id text not null default '',
  progress_seconds numeric,
  progress_percent numeric,
  last_seen_at timestamptz not null default now(),
  unique (user_id, media_kind, media_id, chapter_or_episode_id)
);
```

## RLS Baseline

```sql
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_collections enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_history enable row level security;

create policy "profiles own read" on public.profiles
for select using (auth.uid() = id);

create policy "profiles own insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles own update" on public.profiles
for update using (auth.uid() = id);

create policy "prefs own access" on public.user_preferences
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections own access" on public.user_collections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "bookmarks own access" on public.user_bookmarks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "history own access" on public.user_history
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Migration Sequence

1. Add Supabase auth envs.
2. Add SQL schema and RLS.
3. Add Supabase client/server helpers.
4. Add embedded login, callback, and logout routes.
5. Add profile bootstrap.
6. Replace auth bridge session usage in `jawatch`.
7. Protect account and write paths server-side.
8. Add age verification and `adult_content_enabled`.
9. Apply NSFW filtering across listing/search/recommendation/detail.
10. Make `/nsfw` routes return `404`.
11. Remove remaining runtime dependence on the legacy auth bridge from `jawatch`.
12. Evaluate whether any media-edge or async jobs should be extracted into companion Cloudflare Workers after auth migration is stable.

## Testing Requirements

- Google OAuth login works
- Discord OAuth login works
- email magic link login works
- first sign-in creates `profiles`
- anonymous user cannot access protected pages
- anonymous user cannot see NSFW content anywhere
- logged-in user under 21 cannot see NSFW content
- logged-in adult with NSFW disabled cannot see NSFW content
- logged-in adult with NSFW enabled can see NSFW content on normal routes
- `/nsfw` and `/nsfw/*` return `404`
- media reads continue to resolve from Aiven
- if companion Workers are introduced later, they must not become the auth/session source of truth

## Open Risks

- shared `profiles` must stay generic enough for multiple apps
- Supabase OAuth configuration must match `jawatch.web.id` callback URLs exactly
- CSP cleanup must not break the new auth flow
- any old code path still assuming `auth.dwizzy.my.id` can cause partial auth regressions during migration
