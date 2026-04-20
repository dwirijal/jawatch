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

### Browse Hubs

Used by:

- `/watch/movies`
- `/watch/series`
- `/read/comics`

Shared shell:

- `MediaHubTemplate`
- `MediaHubHeader`

Rules:

- shared order is `hero -> personal block (optional) -> hub content stack`
- hero stays single-item spotlight only, never a control strip
- personal block is composed from existing modules like `ContinueWatching` and `SavedContentSection`
- hub-specific discovery stays route-owned inside the content stack
- do not create parallel browse-shell components when the existing hub shell can be extended

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
- `WatchModeSurface`
- `VideoPlayer`

Desktop rule:

- player stage `75%`
- picker / context rail `25%`

### Shared Watch Stack

Shared watch behavior is split across tested helpers and small client islands.

Core ownership:

- `src/components/organisms/VideoPlayer.tsx`
  - thin public entrypoint only
  - composes player frame, controls, mirror panel, and shortcut/state hooks
- `src/components/organisms/video-player/VideoPlayerFrame.tsx`
  - renders empty/native/HLS/embed media branches
  - owns HLS attach and teardown
- `src/components/organisms/video-player/VideoPlayerControls.tsx`
  - renders the utility control tray only
- `src/components/organisms/video-player/VideoPlayerMirrorPanel.tsx`
  - renders mirror switching and autoplay controls only
- `src/components/organisms/video-player/useVideoPlayerState.ts`
  - owns internal URL, player refresh key, dead-mirror state, autoplay, and per-session reporting
- `src/components/organisms/video-player/useVideoPlayerShortcuts.ts`
  - owns keyboard shortcut registration only
- `src/lib/video-player-media.ts`
  - source of truth for `empty | native | hls | embed` mode resolution
- `src/lib/video-player-controls.ts`
  - source of truth for control order and labels
- `src/lib/video-player-ui.ts`
  - source of truth for mirror label normalization
- `src/lib/watch-surface.ts`
  - source of truth for watch-mode policy, rail visibility, compact ordering, and bordered section layout

Rules:

- Keep page composition server-led. Series/movie pages should assemble `header`, `stage`, `body`, and `rail`, not re-own player runtime logic.
- Keep browser-only player state inside `video-player/*` hooks or subcomponents.
- Do not reintroduce dead public player props unless a real caller needs them. The current shared player contract is intentionally minimal.
- Keep compact watch order deterministic: `stage -> body -> rail`.
- Preserve deferred/non-critical work outside the primary player frame when possible.

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
