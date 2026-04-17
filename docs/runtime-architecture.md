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
- must stay optional: page flow cannot depend on enrichment success

### `src/lib/adapters/*`

Domain orchestration layer.

- comic
- drama / shorts
- movie
- search
- series

Each adapter:

- fetches base content from `media.ts` or direct provider contract helpers
- applies domain normalization
- merges optional enrichment
- returns final DTOs for app routes

## Route Families

### Horizontal Media Detail

Used by:

- `/movies/[slug]`
- `/series/[slug]`

Shared shell:

- `HorizontalMediaDetailPage`
- `VideoDetailHero`

### Horizontal Player

Used by:

- `/movies/[slug]` inline player section
- `/series/[slug]/episodes/[episodeSlug]`

Shared shell:

- `HorizontalPlayerPage`
- `VideoPlaybackScaffold`

Desktop rule:

- player stage `75%`
- picker / context rail `25%`

### Vertical Series Detail

Used by:

- `/shorts/[slug]`

Shared shell:

- `VerticalSeriesDetailScaffold`

### Vertical Player

Used by:

- `/shorts/[slug]/episodes/[episodeSlug]`

Shared shell:

- `VerticalPlayerPage`

### Reader Detail

Used by:

- `/comics/[slug]`

Shared shell:

- `ReaderMediaDetailPage`

### Image Reader

Used by:

- `/comics/[slug]/chapters/[chapterSlug]`

Shared shell:

- `ImageReaderScaffold`

## Image Policy

### Movie

- content source: Kanata movietube
- visual source: TMDB enrichment
- ignore raw Kanata poster URLs
- catalog/detail poster ratio: `2:3`

### Series

- content source: normalized series catalog including anime, donghua, and drama rows
- poster ratio: `3:4`

### Comic / Manga

- content source: Sanka comic family
- poster ratio: `3:4`

### Vertical Drama

- content source: Sanka vertical drama family
- poster ratio: `9:16`

## Important Rules

- Do not reintroduce snapshot runtime reads.
- Do not expose provider/source names on user-facing detail pages.
- Do not route movie poster handling through comic thumbnail helpers.
- Keep `enrichment.ts` optional and server-safe.
- Keep provider failures degradable into empty/error state, not runtime crashes.
- Keep public IA canonical: watch browse lives under `/watch/*`, reader browse under `/read/*`, and title/unit routes under `/movies`, `/series`, `/shorts`, and `/comics`.
- Do not reintroduce legacy redirect shims for removed public route families.
