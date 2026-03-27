# Anime Index Supabase Design

## Goal

Move `/anime/list` away from the legacy `otakudesu/anime-list` fetch and make it consistent with the Supabase-backed anime catalog now used by the rest of the anime surfaces.

The index should:

- render from `samehadaku_anime_catalog`
- stay server-first for data loading
- keep the A-Z browsing experience
- show thumbnail cards instead of text-only rows

## Recommended Approach

Use a server data adapter in `src/lib/anime-source.ts` to read the catalog and group rows into index buckets by title initial.

Then rebuild `/anime/list` as:

- a server page that fetches grouped index data
- a thin client component that handles active-letter state and smooth scrolling

This keeps data fetching server-side while preserving browser-only interaction for sticky navigation.

## Data Flow

1. `/anime/list` requests grouped catalog data from the Supabase adapter.
2. The adapter reads only the columns needed for the index card surface.
3. Titles are grouped into `#` or `A-Z` buckets in the server adapter.
4. The page passes grouped results to a client UI component.
5. The client component handles scroll-to-letter and active nav state only.

## UI Shape

The index page keeps the current A-Z identity:

- large page title
- sticky alphabet scroller
- grouped sections per initial

But each section now renders compact visual cards using poster thumbnails. This makes the page more useful as a browse surface instead of just a directory.

## Error Handling

- If Supabase is unavailable, render an explicit empty index state.
- Do not fall back to the legacy upstream list endpoint.
- If a card is missing a poster, use the existing card fallback behavior.

## Verification

- `npm run lint`
- `npm run build`
- smoke test `/anime/list`
