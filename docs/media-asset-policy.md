# Media Asset Policy

## Current Decision

Do not introduce a wide media card that assumes 16:9 artwork until the data contract explicitly exposes landscape-safe assets.

## Source Capabilities

### TMDB

TMDB is suitable for both portrait and landscape media presentation.

- `poster_path`: portrait poster asset, good for catalog cards
- `backdrop_path`: landscape/backdrop asset, good for cinematic or 16:9 cards

When a movie or series item is backed by TMDB metadata, we can safely support:

- `poster`
- `backdrop`

### Jikan / MyAnimeList

Jikan is currently suitable for portrait coverage, not for guaranteed landscape presentation.

- `images.jpg` / `images.webp`: cover/poster-like assets
- `anime/pictures`: gallery images, but not a canonical backdrop contract
- `trailer.images`: inconsistent and not a reliable replacement for backdrop art

For anime and manga backed mainly by Jikan, assume:

- `poster` or `cover`: available
- `backdrop`: not guaranteed

## Rendering Rule

Until the data model is expanded:

- render portrait catalog surfaces with the existing media card
- only render future `MediaWideCard` when an item has a trusted `backdrop` or `banner`
- never crop a 3:4 poster into a pseudo-16:9 card by default

## Follow-Up

Before introducing `MediaWideCard`, add an explicit image contract for:

- `poster`
- `thumbnail`
- `backdrop`
- `banner`

Then map sources per domain:

- movies / series: TMDB-first for wide assets
- anime / manga: fallback to portrait unless a real landscape asset exists
