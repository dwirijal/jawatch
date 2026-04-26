# Performance And Release Playbook

## What CI Enforces

The default CI gate for this repo now checks:

- unit tests
- ESLint with `--max-warnings=0`
- TypeScript typecheck
- production `next build`
- route bundle budgets from `.next/diagnostics/route-bundle-stats.json`

The local equivalent is:

```bash
npm run verify
```

## Route Budget Policy

Bundle budgets are configured in `perf-budgets.json`.

Current route groups:

- `landing-listing`
- `detail`
- `watch-read`

The checker lives in `scripts/check-route-budgets.mjs`.

Useful commands:

```bash
npm run perf:budgets
npm run perf:build-and-budgets
```

If a route regresses:

1. run `npm run build`
2. run `npm run perf:budgets`
3. inspect the affected route and shared chunks in `.next/diagnostics/route-bundle-stats.json`
4. move non-critical client logic behind server boundaries or deferred islands

## Release Flow

Recommended release flow for production:

1. confirm the media DB/env checklist in `docs/production-media-runtime.md`
2. `npm run verify`
3. commit and push to `main`
4. wait for GitHub Actions CI to pass
5. deploy to Vercel
6. run `npm run smoke:production`
7. confirm the deployment has no Vercel 5xx/error logs

## Deployment Commands

Local Vercel deploy:

```bash
npm run deploy:vercel
```

Cloudflare fallback:

```bash
npm run deploy:cloudflare
```

## Current Performance Baseline

After the latest route-splitting and deferred-island work, all tracked app routes are inside budget.

- `38 OK`
- `0 WARN`
- `0 FAIL`

Shared shell still remains report-only, so future work should focus on reducing global chunks rather than individual detail routes.
