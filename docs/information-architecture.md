# Jawatch Information Architecture

Last updated: 2026-04-27

This document describes the information architecture that is implemented in the current Jawatch codebase. It is an implementation-state reference, not a future-state product spec.

It should be read together with:

- [`docs/jawatch-ia-route-map.md`](./jawatch-ia-route-map.md) for the canonical route inventory and legacy redirect map
- [`docs/runtime-architecture.md`](./runtime-architecture.md) for backend/runtime concerns

## IA Summary

Jawatch is currently organized around five top-level product zones plus a supporting editorial zone:

| Zone | Primary route | Purpose |
| --- | --- | --- |
| Home | `/` | Curated front door across watch and read content |
| Watch | `/watch` | Browse entry for movies, series, and shorts |
| Read | `/read` | Browse entry for reading surfaces, currently comics |
| Search | `/search` | Global title discovery surface |
| Vault | `/vault` | Authenticated personal area for profile, history, and saved items |
| Blog | `/blog` | Supporting SEO/editorial guides linked from footer discovery |

Outside those zones, the app also includes:

- authentication and onboarding routes
- legal and support routes
- admin routes
- API routes used by the UI and media runtime

## Top-Level Navigation Model

### Public product IA

These routes define the primary public product structure:

| Route | Role in IA |
| --- | --- |
| `/` | Home hub |
| `/watch` | Watch hub |
| `/watch/movies` | Movie browse lane |
| `/watch/series` | Series browse lane |
| `/watch/shorts` | Hidden browse lane while source stability is limited; direct visits fall back to `/watch` |
| `/read` | Read hub |
| `/read/comics` | Comics browse lane |
| `/search` | Global search results page |
| `/blog` | Editorial guide index for SEO and internal discovery |

### Public utility and trust routes

These routes are part of the public site structure but are not primary discovery lanes:

| Route | Purpose |
| --- | --- |
| `/contact` | Contact page |
| `/support` | Support page |
| `/privacy` | Privacy policy |
| `/terms` | Terms page |
| `/dmca` | DMCA page |

## Authenticated IA

### Auth and onboarding

Authentication flows live outside the public browse IA:

| Route | Purpose |
| --- | --- |
| `/login` | Sign-in |
| `/signup` | Registration |
| `/forgot-password` | Password recovery |
| `/auth/callback` | Auth callback handler |
| `/logout` | Sign-out route |
| `/onboarding` | Post-auth onboarding flow |

### Vault

Vault is the authenticated personal area:

| Route | Purpose |
| --- | --- |
| `/vault` | Vault overview |
| `/vault/profile` | Profile and preference management |
| `/vault/history` | Watch/read history |
| `/vault/saved` | Saved/bookmarked items |
| `/account/age` | Age-access management route used by the account flow |

In IA terms, Vault is not a browse hub. It is an account and personalization zone.

## Admin IA

Admin is intentionally separated from the public product IA:

| Route | Purpose |
| --- | --- |
| `/admin` | Admin landing page |
| `/admin/titles` | Title management |
| `/admin/units` | Unit management |

## Canonical Content Model

Jawatch separates browse hubs from canonical content routes. Browse routes collect and filter content; canonical routes represent the stable title, episode, or chapter destinations.

### Movies

| Route | Purpose |
| --- | --- |
| `/movies/[slug]` | Canonical movie detail page with inline playback entry |

### Series

| Route | Purpose |
| --- | --- |
| `/series/[slug]` | Canonical series detail page |
| `/series/[slug]/ep/[episodeNumber]` | Canonical numbered episode playback route |

### Shorts

| Route | Purpose |
| --- | --- |
| `/shorts/[slug]` | Canonical short-series detail page |
| `/shorts/[slug]/episodes/[episodeSlug]` | Canonical shorts episode playback route |

### Comics

| Route | Purpose |
| --- | --- |
| `/comics/[slug]` | Canonical comic detail page |
| `/comics/[slug]/ch/[chapterNumber]` | Canonical numbered chapter reader route |
| `/comics/[slug]/chapter/[chapterSlug]` | Fallback non-numbered chapter reader route |

## Structural Rules In The Current IA

The implemented IA follows these structural rules:

- public browse hubs are mode-first: home, watch, read, search, vault
- movies, series, shorts, and comics each have their own canonical detail routes
- watch and read hubs do not own the final canonical title URL
- search is a global surface, not duplicated as a standalone search bar on every browse page
- vault is a personal area, not a public discovery lane
- admin remains outside the public information architecture

## Legacy And Alias Behavior

Jawatch still handles legacy route shapes, but those aliases are not part of the current IA. The current app treats them as compatibility redirects or removed surfaces.

Examples:

- old movie browse aliases such as `/movies`, `/movies/latest`, and `/movies/popular` redirect to `/watch/movies`
- old movie watch routes such as `/movies/watch/[slug]` redirect to `/movies/[slug]`
- old series browse aliases such as `/series/anime`, `/series/donghua`, and `/series/drama` redirect to `/watch/series`
- old series watch aliases redirect into canonical `/series/[slug]` routes
- old comic aliases under `/comic/*` redirect into `/read/comics` or `/comics/*`
- old collection routes redirect into `/vault/*`
- unsupported lanes such as `/novel/*` are not part of the current public IA

The detailed redirect inventory lives in [`docs/jawatch-ia-route-map.md`](./jawatch-ia-route-map.md).

## Route Grouping And Internal Structure

The Next.js app uses internal route groups to keep the codebase organized:

- `src/app/(public)` for public pages
- `src/app/(auth)` for auth and onboarding
- `src/app/(vault)` for authenticated personal pages
- `src/app/(admin)` for admin pages

These route groups are implementation structure only. They are not user-visible IA labels.

The repo also contains private implementation modules such as `_vault`, `_shorts`, and `_comics` in the broader architecture discussion. Those are internal organization devices, not public routes.

## Reserved Slugs And Guardrails

Some route words are explicitly reserved so legacy browse aliases do not accidentally resolve as title detail pages.

Current reserved examples include:

- movies: `latest`, `popular`, `watch`
- series: `anime`, `country`, `donghua`, `drama`, `genre`, `list`, `ongoing`, `short`, `watch`, `year`
- comics: `chapter`, `genre`, `latest`, `manga`, `manhua`, `manhwa`, `ongoing`, `popular`

These guardrails are implemented in [`src/lib/canonical-route-guards.ts`](../src/lib/canonical-route-guards.ts).

## What Is Not In The Public IA

The following are implemented in the repository but should not be treated as part of the public site IA:

- `src/app/api/*` endpoints
- Supabase callback and session plumbing
- proxy redirect/auth middleware behavior
- platform adapters, cache layers, and search infrastructure
- internal feature/module boundaries under `src/features`, `src/domains`, `src/lib`, and `src/platform`

Those are application architecture concerns rather than information architecture concerns.
