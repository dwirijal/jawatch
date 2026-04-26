## jawatch

Next.js 16 app for the `jawatch.web.id` frontend.

## Data Access Model

Production Jawatch is a media-only runtime:

- watch/read catalog data is served from the compact Jawatch Supabase media DB
- profile, preference, history, bookmarks, and community data stays in the dwizzyOS Supabase DB
- `sloane/dwizzySCRAPE` owns media import and should write only fields used by the app
- Valkey/Redis or Upstash can be used as shared hot cache
- OpenSearch is optional; Postgres search-vector and trigram indexes are the fallback

The legacy env name `COMIC_DATA_SOURCE` is still the switch for direct DB versus gateway reads:

- `COMIC_DATA_SOURCE=database`: watch/read media surfaces read directly from Postgres/Supabase
- `COMIC_DATA_SOURCE=gateway`: media surfaces read from `COMIC_API_BASE_URL` over HTTP

Operational details live in [`docs/production-media-runtime.md`](docs/production-media-runtime.md). App-facing curated media rules are documented in [`docs/curated-media-contract.md`](docs/curated-media-contract.md).

## Getting Started

Copy `.env.example` to `.env.local` and set your gateway/app URLs.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open the local URL printed by Next.js with your browser to see the result.

Main envs:

- `DWIZZY_API_BASE_URL` (server fetch base, default: `https://api.dwizzy.my.id`)
- `NEXT_PUBLIC_DWIZZY_API_BASE_URL` (optional client-safe mirror)
- `DATABASE_PROVIDER=supabase` (recommended for the Jawatch media DB)
- `SUPABASE_DATABASE_POOL_URL` or `SUPABASE_DATABASE_URL` (preferred direct Postgres read path)
- `DATABASE_URL` (fallback direct Postgres read path)
- `COMIC_DATA_SOURCE` (`database` or `gateway`; default falls back to `database` when a database URL is set, otherwise `gateway`)
- `COMIC_API_BASE_URL` (remote comic origin used when `COMIC_DATA_SOURCE=gateway`)
- `COMIC_ORIGIN_SHARED_TOKEN` (shared secret for trusted comic-origin forwarding across Vercel and the self-hosted origin)
- `SUPABASE_POSTGRES_CA_PEM`, `SUPABASE_DB_CA_PEM`, `AIVEN_POSTGRES_CA_PEM`, or `DATABASE_CA_PEM` (optional Postgres CA bundle for TLS verification)
- `VALKEY_URL` or `REDIS_URL` (optional primary shared comic cache)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional Redis REST fallback)
- `SUPABASE_COMIC_ANALYTICS_TABLE` + Supabase service role envs (optional comic analytics sink)
- `SITE_URL` (canonical site URL for metadata/sitemap)
- `NEXT_PUBLIC_SITE_URL` (client app origin fallback)

Embedded auth envs (Supabase runtime authority for `jawatch`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL` (recommended: `https://jawatch.web.id`)
- `NEXT_PUBLIC_SITE_URL` (recommended: `https://jawatch.web.id`)

`jawatch` embedded auth uses Supabase directly. `auth.dwizzy.my.id` is not a runtime authority for auth/session flows in this app.

## Verification

Primary local verification flow:

```bash
npm run verify
```

This runs:

- unit tests
- ESLint
- TypeScript
- production build
- route performance budgets

Performance budgets are defined in `perf-budgets.json`. Operational notes live in `docs/performance-release-playbook.md`.

You can start editing the app from `src/app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Preferred deployment target:

- first-time auth: `npx vercel login`
- link project: `npm run link:vercel`
- production deploy: `npm run deploy:vercel`
- project name: `jawatch`
- project id: `prj_98bKwCd8PWLD0HpBHp8Fo9WFvCFy`
- team id: `team_LkIeOkeNrl7eNLKUJUljLeaC` (`fudcourt`)
- production domain: `jawatch.web.id`

Recommended Vercel envs:

- `DWIZZY_API_BASE_URL`
- optional `NEXT_PUBLIC_DWIZZY_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_PROVIDER=supabase`
- `SUPABASE_DATABASE_POOL_URL` or Supabase pooler parts documented in `docs/production-media-runtime.md`
- `COMIC_DATA_SOURCE`
- optional `COMIC_API_BASE_URL`
- optional `COMIC_ORIGIN_SHARED_TOKEN`
- optional `VALKEY_URL` / `AIVEN_VALKEY_URL`
- optional `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- optional `SUPABASE_POSTGRES_CA_PEM` / `DATABASE_CA_PEM`
- optional `SITE_URL`
- optional `NEXT_PUBLIC_SITE_URL`

`SITE_URL` automatically falls back to Vercel system envs like `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`, then to `https://jawatch.web.id`.

## Cloudflare Tunnel Origin Split

Recommended split when the live app should read from a self-hosted dev/local media backend:

- Vercel `jawatch`:
  - `COMIC_DATA_SOURCE=gateway`
  - `COMIC_API_BASE_URL=https://<your-cloudflare-tunnel-host>`
  - `COMIC_ORIGIN_SHARED_TOKEN=<same-random-secret>`
  - keep `VALKEY_URL` / `UPSTASH_*` as shared cache
- self-hosted `jawatch` origin behind Cloudflare Tunnel:
  - `COMIC_DATA_SOURCE=database`
  - `DATABASE_URL=postgres://postgres@127.0.0.1:5432/jawatch_catalog`
  - use `jawatch_catalog_raw` only when you intentionally want the fuller local dataset instead of the curated/default runtime
  - `COMIC_ORIGIN_SHARED_TOKEN=<same-random-secret>`

For non-comic media, point `DWIZZY_API_BASE_URL` at the backend origin that is already backed by the desired datasource. This keeps cutover to Aiven or another SQL system as an origin/env change rather than a frontend rewrite.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudflare Fallback

Cloudflare-specific deploy flows are still available, but no longer the primary target:

- preview: `npm run preview:cloudflare`
- deploy: `npm run deploy:cloudflare`

## CI

GitHub Actions CI is defined in `.github/workflows/ci.yml`.

It currently gates:

- `npm run test:unit`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run perf:budgets`
