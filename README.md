## jawatch

Next.js 16 app for the `jawatch.web.id` frontend.

## Data Access Model

`jawatch` currently mixes two media read paths:

- comic surfaces (`manga`, `manhwa`, `manhua`) read directly from `DATABASE_URL`
- the remaining media surfaces still read through the API gateway (default `https://api.dwizzy.my.id`)

- Aiven Valkey / Redis can be used as the primary shared comic cache and hot leaderboard
- Upstash Redis can remain as REST fallback cache
- Supabase analytics is optional for comic access events
- `dwizzyBRAIN` is not required for the comic read path

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
- `DATABASE_URL` (optional direct Postgres read path for comics)
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
- optional `SITE_URL`
- optional `NEXT_PUBLIC_SITE_URL`

`SITE_URL` automatically falls back to Vercel system envs like `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`, then to `https://jawatch.web.id`.

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
