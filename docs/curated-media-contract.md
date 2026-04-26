# Curated Media Contract

This document defines the media data contract expected by `jawatch`.

The goal is to keep `jawatch` independent from a specific Postgres provider. Local/dev Postgres, a Cloudflare Tunnel origin, Aiven, or another SQL backend may be swapped behind the same app contract without changing page behavior.

## Runtime Shape

`jawatch` has two supported read modes:

- `COMIC_DATA_SOURCE=database`: the self-hosted origin reads curated comic rows directly from `DATABASE_URL`.
- `COMIC_DATA_SOURCE=gateway`: Vercel reads comic rows through `COMIC_API_BASE_URL`, usually the Cloudflare Tunnel origin.

Video and mixed media surfaces use the canonical API/backend path configured by `DWIZZY_API_BASE_URL`.

Recommended public topology while the curated DB is still being refined:

1. Vercel `jawatch` uses `COMIC_DATA_SOURCE=gateway`.
2. A self-hosted `jawatch` origin behind Cloudflare Tunnel uses `COMIC_DATA_SOURCE=database`.
3. The origin reads the local/dev curated DB through PgBouncer.
4. Valkey/Aiven Redis and Upstash Redis remain cache layers, not source-of-truth stores.

## Comic Contract

Comic surfaces include only:

- `media_type = 'manga'`
- `media_type = 'manhwa'`
- `media_type = 'manhua'`

Public comic reads must apply the same contract everywhere:

- hide `is_nsfw = true`
- hide rows whose `detail.genres`, `detail.genre_names`, `detail.category_names`, or `detail.tags` include `nsfw`
- only expose items that have at least one ready chapter
- only expose chapters whose `detail.pages` is a non-empty JSON array

The SQL fragments for this contract live in:

- `src/lib/adapters/comic-db-contract.ts`

The server adapter uses that helper for:

- latest/popular/ongoing lists
- search
- genre pages
- subtype poster selection
- detail pages
- chapter reader pages
- optional Jikan enrichment reads

This keeps “comic exists” and “comic is readable” as the same public condition.

## Video Contract

Video public pages should use canonical items and canonical units where available.

Availability is unit-level:

- stream options and download options belong to units, not only titles
- source-native payloads may be used as fallback only when the route explicitly permits it
- canonical provider options should win over source payloads when both exist

For series watch pages, `src/lib/adapters/series-canonical-utils.ts` owns the provider selection and canonical redirect behavior.

## NSFW Contract

NSFW is allowed only in authenticated adult flows. Public routes must default to `includeNsfw=false`.

The database contract uses two signals:

- explicit boolean: `is_nsfw`
- taxonomy labels: `genres`, `genre_names`, `category_names`, `tags`

Both signals are checked because source classification and enrichment can arrive at different times.

## Hardening Rules

- All user-controlled values must stay parameterized (`$1`, `$2`, etc.).
- SQL helper output must be static fragments owned by code, not user input.
- The self-hosted origin should connect through PgBouncer, not directly to Postgres.
- `COMIC_DB_POOL_MAX` should stay small; default is intentionally conservative.
- `COMIC_DB_STATEMENT_TIMEOUT_MS` should stay bounded; default is intentionally short.
- Do not point Vercel directly at a private `127.0.0.1` database.
- Do not switch public serving to Aiven until the curated DB size and dedupe gates pass.

## DB Migration Boundary

The app expects these public concepts, not a provider-specific database:

- media item rows for catalog/detail
- media unit rows for episode/chapter reads
- item/unit link tables for source aliases
- stream/download/reader option tables for provider availability
- canonical slugs stable enough for public URLs

If the backing SQL system changes, preserve those concepts in the origin or SQL views first, then switch envs.

## Verification

Run the focused unit contract first:

```bash
npm run test:unit -- tests/unit/comic-db-contract.test.mjs
```

Then run the normal local gate:

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run build
```

For production smoke checks, verify representative canonical routes:

- `/comics/<slug>`
- `/comics/<slug>/ch/<number>`
- `/series/<slug>`
- `/series/<slug>/ep/<number>`
- `/movies/<slug>`

Legacy redirects should also be verified:

- `/comic/<slug>` (redirects to `/comics/<slug>`)
- `/series/watch/<slug>` (redirects to canonical episode route)
- `/movies/watch/<slug>` (redirects to `/movies/<slug>`)
