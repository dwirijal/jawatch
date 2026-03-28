# Runtime Architecture

## Data Layers

### `src/lib/media.ts`

Source layer.

- owns provider base URLs and endpoint contracts
- fetches public content from Sanka and Kanata
- does not do domain orchestration
- does not own premium metadata decisions

### `src/lib/enrichment.ts`

Metadata layer.

- enriches movie visuals from TMDB
- enriches anime/manga metadata from Jikan
- enriches novel covers from Google Books and Open Library
- must stay optional: page flow cannot depend on enrichment success

### `src/lib/adapters/*`

Domain orchestration layer.

- anime
- comic
- donghua
- movie
- novel
- random

Each adapter:

- fetches base content from `media.ts` or direct provider contract helpers
- applies domain normalization
- merges optional enrichment
- returns final DTOs for app routes

## Route Families

### Horizontal Media Detail

Used by:

- `/anime/[slug]`
- `/donghua/[slug]`
- `/movies/[slug]`

Shared shell:

- `HorizontalMediaDetailPage`
- `VideoDetailHero`

### Horizontal Player

Used by:

- `/anime/episode/[slug]`
- `/donghua/episode/[episodeSlug]`
- `/movies/watch/[slug]`

Shared shell:

- `HorizontalPlayerPage`
- `VideoPlaybackScaffold`

Desktop rule:

- player stage `75%`
- picker / context rail `25%`

### Vertical Series Detail

Used by:

- `/drachin/[slug]`
- `/dramabox/[bookId]`

Shared shell:

- `VerticalSeriesDetailScaffold`

### Vertical Player

Used by:

- `/drachin/episode/[slug]`

Shared shell:

- `VerticalPlayerPage`

### Reader Detail

Used by:

- `/manga/[slug]`
- `/novel/[slug]`

Shared shell:

- `ReaderMediaDetailPage`

### Image Reader

Used by:

- `/manga/[slug]/[chapter]`

Shared shell:

- `ImageReaderScaffold`

### Text Reader

Used by:

- `/novel/[slug]/read/[chapter]`

Shared shell:

- `TextReaderScaffold`

### Download Flow

Used by:

- `/anime/batch/[slug]`

Shared shell:

- `DownloadMediaPage`

## Image Policy

### Movie

- content source: Kanata movietube
- visual source: TMDB enrichment
- ignore raw Kanata poster URLs
- catalog/detail poster ratio: `2:3`

### Anime

- content source: Sanka Samehadaku
- poster ratio: `3:4`

### Comic / Manga

- content source: Sanka comic family
- poster ratio: `3:4`

### Donghua

- content source: Kanata Anichin
- poster ratio: `3:4`

### Vertical Drama

- content source: Sanka vertical drama family
- poster ratio: `9:16`

### Novel

- content source: SakuraNovel via Sanka
- cover reliability is unstable because upstream host can block image access
- ratio: `210:297`
- fallback surface uses decorative book-cover rendering with title on cover

## Important Rules

- Do not reintroduce snapshot runtime reads.
- Do not expose provider/source names on user-facing detail pages.
- Do not route movie poster handling through comic thumbnail helpers.
- Keep `enrichment.ts` optional and server-safe.
- Keep provider failures degradable into empty/error state, not runtime crashes.
