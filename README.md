## dwizzyWEEB

Next.js 16 app for the `weebs.dwizzy.my.id` frontend.

## Data Access Model

`dwizzyWEEB` reads media data through the API gateway (default `https://api.dwizzy.my.id`).

- No direct DB call from this app to Neon
- No direct media read path from Supabase
- Supabase is reserved for account/auth concerns outside media catalog reads

## Getting Started

Copy [.env.example](/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/.env.example) to `.env.local` and set your gateway/app URLs.

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
- `SITE_URL` (canonical site URL for metadata/sitemap)
- `NEXT_PUBLIC_SITE_URL` (client app origin fallback)

You can start editing the app from [src/app/page.tsx](/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/app/page.tsx). The page auto-updates as you edit the file.

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

Recommended Vercel envs:

- `DWIZZY_API_BASE_URL`
- optional `NEXT_PUBLIC_DWIZZY_API_BASE_URL`
- optional `SITE_URL`
- optional `NEXT_PUBLIC_SITE_URL`

`SITE_URL` automatically falls back to Vercel system envs like `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`, then to `https://weebs.dwizzy.my.id`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudflare Fallback

Cloudflare-specific deploy flows are still available, but no longer the primary target:

- preview: `npm run preview:cloudflare`
- deploy: `npm run deploy:cloudflare`
