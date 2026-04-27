# Jawatch IA Route Map

Last updated: 2026-04-27

This document records the implemented public information architecture for Jawatch. It follows `docs/superpowers/specs/2026-04-15-jawatch-ia-design.md` and keeps browse surfaces separate from canonical title/player/reader routes.

## Public Hubs

| Route | Purpose |
| --- | --- |
| `/` | Curated home surface across watch and read content. |
| `/watch` | Watch hub for movies, series, and shorts. |
| `/watch/movies` | Movie browse, genre filters, latest/popular sections. |
| `/watch/series` | Series browse for anime, donghua, and drama via `?type=` filters. |
| `/watch/shorts` | Paused for now while source stability is fixed; direct visits fall back to `/watch`. |
| `/read` | Read hub. |
| `/read/comics` | Comics browse for manga, manhwa, and manhua via `?type=` filters. |
| `/search` | Global search surface, launched from navbar/command UI. |
| `/vault` | Saved/history/profile area with auth/onboarding gates. |

## Canonical Content Routes

| Route | Purpose |
| --- | --- |
| `/movies/[slug]` | Movie title detail and inline player entry. |
| `/series/[slug]` | Series title detail and episode list. |
| `/series/[slug]/ep/[number]` | Canonical numbered series episode playback. |
| `/series/[slug]/special/[episodeSlug]` | Canonical non-numbered series episode playback. |
| `/shorts/[slug]` | Short-series title detail. |
| `/shorts/[slug]/episodes/[episodeSlug]` | Canonical short-series episode playback. |
| `/comics/[slug]` | Comic title detail and chapter list. |
| `/comics/[slug]/ch/[number]` | Canonical numbered comic reader route. |
| `/comics/[slug]/chapter/[chapterSlug]` | Fallback non-numbered comic reader route. |

## Removed Public Routes

These folders/routes are intentionally removed instead of redirected:

| Removed route | Replacement |
| --- | --- |
| `/movies` | `/watch/movies` |
| `/movies/latest` | `/watch/movies#latest` |
| `/movies/popular` | `/watch/movies#popular` |
| `/movies/watch/[slug]` | `/movies/[slug]` |
| `/series` | `/watch/series` for browse, `/series/[slug]` for detail |
| `/series/anime` | `/watch/series?type=anime` |
| `/series/donghua` | `/watch/series?type=donghua` |
| `/series/drama` | `/watch/series?type=drama` |
| `/series/list` | `/watch/series` |
| `/series/ongoing` | `/watch/series#latest` |
| `/series/country/[country]` | `/watch/series` with canonical filters |
| `/series/genre/[genre]` | `/watch/series` with canonical filters |
| `/series/year/[year]` | `/watch/series` with canonical filters |
| `/series/watch/[slug]` | `/series/[slug]/ep/[number]` or `/series/[slug]/special/[episodeSlug]` |
| `/series/short/*` | `/watch/shorts`, `/shorts/[slug]`, `/shorts/[slug]/episodes/[episodeSlug]` |
| `/drachin/*` | `/watch` for hub-level traffic while shorts are paused; `/shorts/*` for canonical legacy episodes |
| `/dramabox/*` | `/watch` for hub-level traffic while shorts are paused; `/shorts/*` for canonical legacy episodes |
| `/comic/*` | `/read/comics` and `/comics/*` |
| `/collection/*` | `/vault/*` |
| `/novel/*` | Not part of the current IA |
| `/nsfw/*` | Not a public lane |

## Implementation Notes

- Private implementation folders use `_comics`, `_shorts`, and `_vault`; they are modules only and are not public Next routes.
- Removed public aliases are redirected to their canonical counterparts in `src/proxy.ts` (308 permanent redirect) or via dedicated Next.js redirect pages.
- `next.config.ts` does not define IA compatibility redirects; redirection logic is handled by the proxy and legacy route shims.
- Browse pages do not include duplicate search bars because global search already lives in the navbar.
- Card sizing remains consistent: default cards use `3:4`; featured/radar/recommendation section reels may opt into `2:3`.
- `SectionCard` supports stable `id` anchors for `#latest`, `#popular`, and `#release-radar` without extra route folders.
- Movie playback now lives inline on `/movies/[slug]` so users do not bounce into a separate `/movies/watch` route.
- Series playback uses canonical series-aware URLs, which keeps episode navigation tied to its parent title.
- Reserved dynamic slugs such as `/movies/latest`, `/series/short`, and `/comics/manga` are guarded to avoid old browse aliases being rendered as detail pages.

## Verification Targets

Before deployment, run:

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run perf:budgets
```

For deployed preview smoke checks, expected HTTP behavior is:

```text
200 / /watch /watch/movies /watch/series /read /read/comics
308 /drachin /dramabox /collection /novel
308 /comic /comic/* /manga/* /manhua/* /manhwa/*
308 /movies/watch/* /movies/latest /movies/popular
308 /series/watch/* /series/short /series/anime /series/donghua /series/drama
```
