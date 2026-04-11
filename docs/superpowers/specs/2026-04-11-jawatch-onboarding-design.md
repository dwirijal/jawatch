# Jawatch Onboarding Design

Date: 2026-04-11
Status: Draft for review
Scope: Add a first-sign-up onboarding wizard for `jawatch` on top of the embedded Supabase auth flow.

## Goals

- Show onboarding immediately after first sign up, not on every login.
- Collect the minimum required profile and age-gate fields before normal app usage.
- Capture optional taste and opt-in preferences that can drive later personalization.
- Redirect finished users back into the main app at `/`.
- Keep onboarding embedded inside `jawatch.web.id`, not a separate auth product.

## Non-Goals

- Do not build full recommendation ranking logic in this phase.
- Do not require every optional preference before completing onboarding.
- Do not block existing returning users who already have a usable profile.
- Do not merge onboarding into the login page itself.

## Product Rules

- Onboarding appears only after first sign up or when the profile is considered incomplete.
- Returning users with completed onboarding go straight into the app.
- The flow is a multi-step wizard, not a single long form.
- Required to finish:
  - `display_name`
  - `birth_date`
  - explicit adult-content choice
- Optional:
  - media preferences
  - genre preferences
  - favorite-title seeds
  - newsletter opt-in
  - community opt-in
- Completion redirects to `/`.

## User Flow

1. User signs up through embedded auth.
2. Auth callback exchanges the session and bootstraps the shared `profiles` row.
3. App checks whether onboarding is complete.
4. If incomplete, user is redirected to `/onboarding`.
5. User completes the multi-step wizard.
6. Required data is saved progressively or per step.
7. On final submit, onboarding is marked complete.
8. User is redirected to `/`.

## Wizard Structure

### Step 1: Identity

Purpose:
- confirm or edit `display_name`

Rules:
- required
- prefill from provider metadata when available

### Step 2: Age And Access

Purpose:
- collect `birth_date`
- collect `adult_content_enabled`

Rules:
- both fields are required decisions
- `birth_date` must be a valid past date
- NSFW eligibility remains server-derived from age `>= 21` plus adult opt-in

### Step 3: Media Preferences

Purpose:
- collect preferred media categories for personalization

Initial categories:
- `movies`
- `series`
- `anime`
- `donghua`
- `drachin`
- `comic`
- `novel`

Rules:
- optional
- multi-select

### Step 4: Taste Seeds

Purpose:
- collect preference seeds for future recommendation quality

Inputs:
- favorite genres
- favorite titles

Rules:
- optional
- can be skip-able
- titles may be freeform or selected from a lightweight search picker

### Step 5: Opt-Ins

Purpose:
- collect soft-growth preferences

Inputs:
- newsletter opt-in
- join community opt-in

Rules:
- optional

## Data Model Changes

### Existing shared table

`public.profiles`

Keep existing identity fields and extend with:
- `onboarding_completed_at timestamptz null`

Existing required usage in onboarding:
- `display_name`
- `birth_date`
- `age_verified_at`

### Existing user table

`public.user_preferences`

Keep:
- `adult_content_enabled`
- `subtitle_locale`
- `theme`

Extend with:
- `newsletter_opt_in boolean not null default false`
- `community_opt_in boolean not null default false`

### New onboarding tables

`public.user_media_preferences`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `media_type text not null`
- `created_at timestamptz not null default now()`
- unique `(user_id, media_type)`

`public.user_genre_preferences`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `genre_key text not null`
- `created_at timestamptz not null default now()`
- unique `(user_id, genre_key)`

`public.user_title_seeds`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `title text not null`
- `media_type text null`
- `source text not null default 'onboarding'`
- `created_at timestamptz not null default now()`

## RLS Rules

For all onboarding-owned tables:
- user can only read/write their own rows with `user_id = auth.uid()`

For `profiles`:
- keep existing own-row policies
- authenticated user may update their own onboarding fields

For `user_preferences`:
- extend existing own-row access policy to cover new opt-in fields

## Route And Enforcement Rules

New route:
- `/onboarding`

Server-side enforcement:
- callback flow must redirect incomplete users to `/onboarding`
- protected account flows may also redirect there if required fields are still missing

Exempt from onboarding redirect:
- `/login`
- `/logout`
- `/auth/callback`
- `/onboarding`
- static and public media routes

This keeps onboarding from causing redirect loops while still making first-run completion reliable.

## Completion Rules

The user is considered complete when:
- `display_name` is non-empty
- `birth_date` is present
- adult-content choice has been saved
- `profiles.onboarding_completed_at` is set

Optional preferences do not block completion.

## UX Direction

- Keep the wizard lightweight and fast.
- Use one clear question per step.
- Show progress across steps.
- Prefill known values when possible.
- Allow skipping optional preference steps.
- Final CTA returns user to `/`.

## Error Handling

- Invalid birth date returns inline validation.
- Save failures should keep the user on the current step with a clear retry message.
- Partial progress should not destroy prior completed steps.
- Callback fallback should never strand the user without a session; if onboarding bootstrap fails, redirect to a recoverable app route with an error code.

## Testing Requirements

- first sign up redirects to `/onboarding`
- returning user with completed onboarding bypasses `/onboarding`
- invalid birth date is rejected
- adult-content choice persists correctly
- optional steps can be skipped
- finishing onboarding sets completion state and redirects to `/`
- users cannot read or mutate another user's onboarding data

## Recommended Implementation Shape

- new route group for onboarding UI under `src/app/onboarding`
- server helpers for:
  - onboarding completion status
  - step persistence
  - step validation
- callback flow integration in `src/app/auth/callback/route.ts`
- small focused tables instead of packing every preference into `profiles`

## Open Follow-Up Work

- sync bookmark/history/collection into Supabase after onboarding is stable
- use onboarding preferences to improve home feed and recommendations
- decide whether favorite-title input should be freeform first or media-search backed
