# Jawatch Production Media Runtime

Last updated: 2026-04-26

Jawatch production is optimized as a media-only web runtime on Vercel.
The production database must stay small enough for the Supabase free plan and
must only store fields that are used by the app at request time.

## Runtime Ownership

| Area | Runtime owner | Notes |
| --- | --- | --- |
| Public watch/read catalog | Jawatch Supabase media DB | `public.media_items`, `public.media_units`, playback option tables, and enrichment payloads. |
| Watch route views | Jawatch Supabase media DB | `watch.*` views expose movies, series, episodes, streams, and downloads. |
| Read route views | Jawatch Supabase media DB | `"read".*` views expose manga, manhwa, manhua, chapters, and pages. |
| User profile, preference, history, bookmarks, community | dwizzyOS Supabase DB | Do not recreate these tables in the Jawatch media DB. |
| Scrape/import pipeline | `sloane/dwizzySCRAPE` | Writes compact media data into the Jawatch Supabase production DB. |
| Shared hot cache | Valkey/Redis or Upstash REST | Optional, but recommended for browse/detail cache and title popularity. |

## Database Shape

The serving DB uses a compact canonical catalog:

- `public.media_items`: title-level rows for watch and read content.
- `public.media_units`: playable/readable units such as movies, episodes, and chapters.
- `public.media_stream_options`: canonical stream mirrors for watch units.
- `public.media_download_options`: canonical download links for watch units.
- `public.media_item_enrichments`: small external enrichment payloads used by detail pages.
- `public.media_item_links` and `public.media_unit_links`: optional canonical mapping between duplicate rows.

The `watch` and `read` schemas are read-only route views. App code may still
query `public.*` directly when it needs shared logic, but the schemas document
the intended separation:

- `watch.media_items` and `watch.media_units` are for movies, anime, donghua,
  drama, vertical drama, and related episode/movie units.
- `"read".media_items` and `"read".media_units` are for manga, manhwa, manhua,
  and chapter units.

## Compact Data Rules

Keep only fields that are rendered, searched, routed, or needed for playback:

- title: `item_key`, `source`, `media_type`, `surface_type`, `title`,
  `cover_url`, `status`, `release_year`, `score`, `updated_at`, `search_vec`.
- routing: derive slugs from title, release year, label, number, and keys; do
  not persist redundant route slug columns unless a migration explicitly needs
  a compatibility period.
- title detail JSON: poster/background/logo candidates, year/rating/quality,
  runtime/duration, overview/synopsis, genres/tags, country/region, latest unit
  labels, author/director/cast/staff/studio/network, and trailer fields.
- chapter detail JSON: `pages` only.
- watch unit detail JSON: playback fallback keys, thumbnail, provider URL,
  presentation format, tags, synopsis/overview.
- enrichment: keep only providers used by the app, currently fanart/TMDB style
  assets for watch detail pages and compact search/display payloads.

Do not store user tables, raw scraper snapshots, provider debug payloads,
large unused JSON blobs, or duplicate reverse indexes in the production media DB.

## Vercel Database Env

Recommended production mode:

```bash
DATABASE_PROVIDER=supabase
COMIC_DATA_SOURCE=database
COMIC_DB_POOL_MAX=1
COMIC_DB_STATEMENT_TIMEOUT_MS=5000
COMIC_DB_CONNECT_TIMEOUT_SECONDS=3
COMIC_DB_IDLE_TIMEOUT_SECONDS=20
COMIC_DB_MAX_LIFETIME_SECONDS=900
COMIC_DB_APPLICATION_NAME=jawatch-web
```

Prefer an explicit Supabase pool URL when available:

```bash
SUPABASE_DATABASE_POOL_URL=postgresql://...
```

If building the URL from parts, set:

```bash
SUPABASE_PROJECT_REF=...
SUPABASE_DB_PASSWORD=...
SUPABASE_DB_NAME=postgres
SUPABASE_REGION=...
SUPABASE_DB_POOL_MODE=supavisor
```

The Postgres client intentionally avoids Supabase/Supavisor startup parameters
such as `statement_timeout`; statement timing stays app-side to avoid pooler
connection failures.

## Cache Env

Set at least one shared cache in production:

```bash
VALKEY_URL=rediss://...
# or
AIVEN_VALKEY_URL=rediss://...
# optional fallback
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

OpenSearch is optional. If it is not configured, search falls back to compact
Postgres title/search-vector queries.

## Scraper Contract

`sloane/dwizzySCRAPE` should write only the compact serving fields above.
Before promoting scraper output to production:

1. run the scraper source verification per source;
2. confirm every source maps into `media_items`, `media_units`, playback option
   tables, and enrichment rows without raw snapshot spillover;
3. run Supabase migrations that compact unused columns and recreate route indexes;
4. run Jawatch verification against production-equivalent env.

Jawatch app verification:

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run build
npm run smoke:production
```

## Release Checklist

1. Apply Supabase migrations with `npm run db:push:supabase`.
2. Verify `COMIC_DATA_SOURCE=database` in Vercel production.
3. Verify Supabase pooler env is present and no Aiven Postgres URL is active.
4. If indexes need a manual repair, run `scripts/postgres-media-performance-indexes.sql`
   with `psql` outside a transaction.
5. Deploy Jawatch to Vercel.
6. Warm `/`, `/read/comics`, `/watch/movies`, `/watch/series`, and hot detail
   API routes.
7. Run `npm run smoke:production`.
8. Check Vercel error logs for the deployment.
