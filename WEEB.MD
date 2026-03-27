# dwizzyWEEB Runtime Map

This file documents how the app currently moves data through UI sections, search, local persistence, Zustand, and internal API routes.

## Architecture Snapshot

- The app now uses a layered runtime:
  - `src/lib/media.ts` for source fetch contracts
  - `src/lib/enrichment.ts` for metadata enrichment
  - `src/lib/adapters/*` for domain orchestration
- Most route pages still split into `page.tsx` and `*PageClient.tsx`.
- `src/app/api/*` exists for selected server adapters and cacheable search endpoints.
- Personalization is local-first through `localStorage`.
- UI interaction state is centralized in Zustand.

```mermaid
flowchart LR
  A["Route page<br/>server or client component"] --> B["src/lib/adapters/*"]
  B --> C["src/lib/media.ts"]
  B -. "optional metadata" .-> D["src/lib/enrichment.ts"]
  C --> E["External providers"]
  A --> D["local component state"]
  D --> F["MediaHubTemplate / Card / player UI"]
  A --> G["src/lib/store.ts<br/>localStorage"]
  A --> H["src/store/useUIStore.ts<br/>Zustand"]
  I["src/app/api/*"] -. "used for selected search and server routes" .-> A
```

## App Shell And Shared UI

Primary shell lives in `src/app/layout.tsx`.

- `DeviceListener`
- `Navbar`
- route content
- `PWAInstallPrompt`
- `LiveActivityToast`
- `MobileNav`
- `Footer`

```mermaid
flowchart TD
  A["RootLayout<br/>src/app/layout.tsx"] --> B["DeviceListener"]
  A --> C["Navbar"]
  A --> D["Route content"]
  A --> E["PWAInstallPrompt"]
  A --> F["LiveActivityToast"]
  A --> G["MobileNav"]
  A --> H["Footer"]

  B --> I["set device in Zustand"]
  I --> C
  I --> G
  I --> J["VideoPlayer layout mode"]
  I --> K["reader behavior"]
```

## UI Sections

### Home Page Sections

Home page lives in `src/app/page.tsx`.

- `HeroCarousel`
- `ContinueWatching`
- `SavedContentSection`
- ordered domain sections via `HomeContentSection`

The order of content sections is not static. It is derived from `dwizzy_interests` in `localStorage`.

```mermaid
flowchart TD
  A["/"] --> B["Home page useEffect"]
  B --> C["getInterests()"]
  C --> D["sort section order"]

  B --> E["anime.getSchedule()"]
  B --> F["manga.getPopular()"]
  B --> G["movie.getHome(popular)"]
  B --> H["donghua.getHome()"]

  E --> I["HomeContentSection: anime"]
  F --> J["HomeContentSection: manga"]
  G --> K["HomeContentSection: movie"]
  H --> L["HomeContentSection: donghua"]

  M["ContinueWatching"] --> N["getHistory()"]
  O["SavedContentSection"] --> P["getBookmarks()"]
```

### Shared Hub Layout

Hub pages reuse `src/components/organisms/MediaHubTemplate.tsx`.

- `MediaHubHeader`
- optional `GenreFilter`
- optional `extraFilters`
- conditional state:
  - loading skeletons
  - filtered results grid
  - default page children

```mermaid
flowchart TD
  A["Hub page state"] --> B["MediaHubTemplate"]
  B --> C["MediaHubHeader"]
  B --> D["GenreFilter"]
  B --> E["extraHeaderActions"]
  B --> F["extraFilters"]

  B --> G{"results ?"}
  G -->|yes| H["Filtered results section"]
  G -->|no, loading| I["SkeletonCard grid"]
  G -->|no, ready| J["Default hub sections"]

  H --> K["MediaCard grid"]
  J --> L["ContentRow / dashboard / saved / ads / schedule"]
```

### Route-Level UI Inventory

```mermaid
flowchart TD
  A["Home"] --> A1["HeroCarousel"]
  A --> A2["ContinueWatching"]
  A --> A3["SavedContentSection"]
  A --> A4["HomeContentSection x4"]

  B["Anime Hub"] --> B1["AnimeDashboard"]
  B --> B2["SavedContentSection"]
  B --> B3["ReleaseCalendar"]
  B --> B4["Infinite ongoing grid"]

  C["Manga Hub"] --> C1["Trending Manga row"]
  C --> C2["SavedContentSection"]
  C --> C3["New Releases grid"]

  D["Movie Hub"] --> D1["Most Popular row"]
  D --> D2["SavedContentSection"]
  D --> D3["Latest Releases grid"]

  E["Donghua Hub"] --> E1["Latest Updates row"]
  E --> E2["SavedContentSection"]
  E --> E3["Ongoing Cultivators grid"]
```

## Search Modal

Global search lives in `src/components/organisms/SearchModal.tsx`.

- controlled by Zustand `isSearchOpen`
- triggered by navbar button or `Cmd/Ctrl + K`
- fans out to manga, anime, donghua, and movie search in parallel
- movie poster enrichment happens after initial render
- route navigation uses `router.push`

```mermaid
flowchart TD
  A["Navbar button or Cmd/Ctrl+K"] --> B["useUIStore.isSearchOpen"]
  B --> C["SearchModal open"]
  C --> D["query input change"]
  D --> E{"length >= 3 ?"}
  E -->|no| F["clear results"]
  E -->|yes| G["Promise.all"]

  G --> H["manga.search(query)"]
  G --> I["anime.search(query)"]
  G --> J["donghua.search(query)"]
  G --> K["movie.search(query)"]

  H --> L["combine results"]
  I --> L
  J --> L
  K --> L

  L --> M["render grouped flat list"]
  L --> N["background getMovieMetadata(title)"]
  N --> O["replace movie poster in-place"]

  M --> P["select result"]
  P --> Q["close modal"]
  P --> R["router.push to detail page"]
```

## Local Storage

Persistence lives in `src/lib/store.ts`.

### Keys

- `dwizzy_history`
- `dwizzy_bookmarks`
- `dwizzy_interests`
- `dwizzy_dead_mirrors`
- `dwizzy_preferred_mirror`

### Responsibilities

- history for continue-watching / continue-reading
- bookmarks for saved sections
- interests for section ordering and lightweight personalization
- dead mirrors for stream source filtering
- preferred mirror for player source stickiness

```mermaid
flowchart TD
  A["Detail / watch / read page"] --> B["saveHistory()"]
  C["BookmarkButton"] --> D["toggleBookmark()"]
  E["Hub visit / save / watch"] --> F["incrementInterest(type)"]
  G["VideoPlayer report broken"] --> H["reportDeadMirror(url)"]
  I["VideoPlayer mirror switch"] --> J["set dwizzy_preferred_mirror"]

  B --> K["dwizzy_history"]
  D --> L["dwizzy_bookmarks"]
  F --> M["dwizzy_interests"]
  H --> N["dwizzy_dead_mirrors"]
  J --> O["dwizzy_preferred_mirror"]

  K --> P["ContinueWatching"]
  K --> Q["AnimeDashboard history"]
  L --> R["SavedContentSection"]
  M --> S["Home page section order"]
  N --> T["VideoPlayer mirror filtering"]
  O --> T
```

## Zustand

Global UI state lives in `src/store/useUIStore.ts`.

### State

- `device`
- `isSidebarOpen`
- `isSearchOpen`
- `isTheaterMode`
- `isLightsDimmed`
- `readerWidth`

### Usage

- `DeviceListener` sets `device`
- `Navbar` and `MobileNav` branch on device
- `SearchModal` uses `isSearchOpen`
- `VideoPlayer` uses theater and lights state
- manga chapter reader uses `readerWidth`

```mermaid
flowchart TD
  A["DeviceListener"] --> B["setDevice(device)"]
  B --> C["useUIStore"]

  C --> D["Navbar"]
  C --> E["MobileNav"]
  C --> F["SearchModal"]
  C --> G["VideoPlayer"]
  C --> H["Manga chapter reader"]

  F --> I["isSearchOpen"]
  G --> J["isTheaterMode"]
  G --> K["isLightsDimmed"]
  H --> L["readerWidth"]
```

## Internal API Routes

Internal routes live under `src/app/api/*`.

### Current Route Groups

- `app/api/anichin/*`
- `app/api/jikan/enrich`
- `app/api/kanata/genres`
- `app/api/kanata/movies`

### Current Role

- They act as proxy or adapter routes to upstream APIs.
- They are useful for server-side access patterns, normalization, and cacheable search responses.
- Current UI hot paths mostly flow through `src/lib/adapters/*`, not a single monolithic API helper.

```mermaid
flowchart TD
  A["src/app/api/anichin/*"] --> B["Kanata Anichin upstream"]
  C["src/app/api/jikan/enrich"] --> D["Jikan v4"]
  E["src/app/api/kanata/genres"] --> F["Kanata Animasu genres"]
  G["src/app/api/kanata/movies"] --> H["Kanata movies upstream"]

  I["Current pages"] --> J["src/lib/adapters/*"]
  J --> K["src/lib/media.ts"]
  J -. "optional metadata" .-> L["src/lib/enrichment.ts"]
  K --> B
  K --> F
  K --> H
  L --> D
```

## Anime Dataflow

```mermaid
flowchart TD
  subgraph Hub["Anime Hub"]
    A1["/anime"]
    A2["AnimePage<br/>state: schedule, ongoingList, results, filters"]
    A3["init useEffect"]
    A4["genre click"]
    A5["year/studio filter"]
    A6["MediaHubTemplate<br/>AnimeDashboard<br/>ReleaseCalendar<br/>MediaCard"]
  end

  subgraph Adapter["src/lib/adapters/anime.ts"]
    B1["getAnimeSchedule()"]
    B2["getOngoingAnime(page)"]
    B3["getKanataAnimeByGenre(genre)"]
    B4["searchAnimeCatalog(query)"]
    B5["getAnimeDetailBySlug(slug)"]
    B6["getAnimeEpisodeBySlug(slug)"]
  end

  subgraph Source["src/lib/media.ts"]
    C1["Sanka Samehadaku endpoints"]
  end

  subgraph Enrich["src/lib/enrichment.ts"]
    C2["Jikan v4 anime"]
  end

  subgraph Consume["Detail / Playback"]
    D1["/anime/[slug]"]
    D2["Anime detail page"]
    D3["/anime/episode/[slug] + provider"]
    D4["Episode page + sidebar context"]
    D5["VideoPlayer<br/>mirrors + default_embed"]
  end

  subgraph Local["Local Persistence / UI"]
    E1["incrementInterest(anime)"]
    E2["saveHistory()"]
    E3["localStorage<br/>interests, history,<br/>preferred mirror, dead mirrors"]
    E4["ContinueWatching<br/>homepage section order"]
    E5["Zustand UI<br/>device, theater, lights"]
  end

  A1 --> A2 --> A3
  A3 --> B1 --> C1
  A3 --> B2 --> B1
  A3 --> E1 --> E3
  A2 --> A4 --> B3 --> C1
  A2 --> A5 --> B4 --> C1
  B1 --> A6
  B2 --> A6
  B3 --> A6
  B4 --> A6

  D1 --> D2 --> B5 --> C1
  D2 -. "optional metadata" .-> C2
  D2 --> D3
  D3 --> D4 --> B6 --> C1
  D4 --> B5
  D4 --> D5
  D4 --> E2 --> E3 --> E4
  D5 --> E3
  D5 --> E5
```

## Manga Dataflow

```mermaid
flowchart TD
  subgraph Hub["Manga Hub"]
    A1["/manga"]
    A2["MangaPage<br/>state: popular, newest, results, activeGenre"]
    A3["init useEffect"]
    A4["genre click"]
    A5["MediaHubTemplate<br/>ContentRow<br/>MediaCard"]
  end

  subgraph Adapter["src/lib/adapters/comic.ts"]
    B1["getPopularManga()"]
    B2["getNewManga(page, limit)"]
    B3["getMangaByGenre(genre)"]
    B4["getMangaDetail(slug)"]
    B5["getMangaChapter(segment)"]
    B6["extractSlugFromUrl() + getHDThumbnail()"]
  end

  subgraph Source["src/lib/media.ts"]
    C1["Sanka /comic aggregate"]
  end

  subgraph Enrich["src/lib/enrichment.ts"]
    C2["Jikan v4 manga"]
  end

  subgraph Consume["Detail / Reading"]
    D1["/manga/[slug]"]
    D2["Manga detail page"]
    D3["/manga/[slug]/[chapter]"]
    D4["Chapter reader<br/>chapter.images[]"]
    D5["Keyboard nav<br/>prev / next chapter"]
  end

  subgraph Local["Local Persistence / UI"]
    E1["saveRecentManga()"]
    E2["saveHistory()"]
    E3["localStorage<br/>history, bookmarks, interests"]
    E4["ContinueWatching<br/>SavedContentSection"]
    E5["Zustand UI<br/>readerWidth"]
  end

  A1 --> A2 --> A3
  A3 --> B1 --> C1
  A3 --> B2 --> C1
  A3 --> B6 --> A5
  A2 --> A4 --> B3 --> C1
  B1 --> A5
  B2 --> A5
  B3 --> A5

  D1 --> D2 --> B4 --> C1
  D2 -. "optional metadata" .-> C2
  D2 --> B6
  D2 --> E1 --> E2 --> E3 --> E4

  D3 --> D4 --> B5 --> C1
  D4 --> D5
  D4 --> E2 --> E3 --> E4
  D4 --> E5
```

## Movie Dataflow

```mermaid
flowchart TD
  subgraph Hub["Movie Hub"]
    A1["/movies"]
    A2["MoviesPage<br/>state: popular, latest, results, activeGenre"]
    A3["init useEffect"]
    A4["genre click"]
    A5["MediaHubTemplate<br/>ContentRow<br/>MediaCard"]
  end

  subgraph Adapter["src/lib/adapters/movie.ts"]
    B1["getMovieHomeSection()"]
    B2["getMovieGenreItems()"]
    B3["getMovieDetailBySlug()"]
    B4["getMovieWatchBySlug()"]
    B5["getMovieHubData()"]
  end

  subgraph Source["gateway / upstream"]
    C1["Movie gateway contract"]
  end

  subgraph Enrich["src/lib/enrichment.ts"]
    C2["IMDB metadata fallback"]
  end

  subgraph Consume["Detail / Watch"]
    D1["/movies/[slug]"]
    D2["Movie detail page"]
    D3["/movies/watch/[slug]"]
    D4["Watch page"]
    D5["VideoPlayer<br/>single primary mirror"]
    D6["MediaCard fallback<br/>retry poster on image error"]
  end

  subgraph Local["Local Persistence / UI"]
    E1["incrementInterest(movie)"]
    E2["saveHistory()"]
    E3["localStorage<br/>history, bookmarks,<br/>preferred mirror, dead mirrors"]
    E4["ContinueWatching<br/>SavedContentSection"]
    E5["Zustand UI<br/>device, theater, lights"]
  end

  A1 --> A2 --> A3
  A3 --> B1 --> C1
  A3 --> E1
  A2 --> A4 --> B2 --> C1
  B1 --> A5
  B2 --> A5
  A5 --> D6 --> C2

  D1 --> D2 --> B3 --> C1
  D2 --> C2

  D3 --> D4 --> B3 --> C1
  D4 --> B4 --> C1
  D4 --> C2
  D4 --> D5
  D4 --> E2 --> E3 --> E4
  D5 --> E3
  D5 --> E5
```

## Donghua Dataflow

```mermaid
flowchart TD
  subgraph Hub["Donghua Hub"]
    A1["/donghua"]
    A2["DonghuaPage<br/>state: homeData, results, loading"]
    A3["init useEffect"]
    A4["MediaHubTemplate<br/>Latest Updates<br/>Ongoing Cultivators"]
    A5["genre UI exists,<br/>but onGenreClick is currently noop"]
  end

  subgraph Adapter["src/lib/adapters/donghua.ts"]
    B1["getDonghuaHome()"]
    B2["getDonghuaDetail(slug)"]
    B3["getDonghuaEpisode(slug)"]
  end

  subgraph Source["src/lib/media.ts"]
    C1["Sanka Donghua endpoints"]
  end

  subgraph Consume["Detail / Playback"]
    D1["/donghua/[slug]"]
    D2["Donghua detail page"]
    D3["/donghua/episode/[episodeSlug]"]
    D4["Episode page + sidebar detail"]
    D5["VideoPlayer<br/>mirrors + default_embed"]
  end

  subgraph Local["Local Persistence / UI"]
    E1["incrementInterest(donghua)"]
    E2["saveHistory()"]
    E3["localStorage<br/>history, bookmarks,<br/>preferred mirror, dead mirrors"]
    E4["ContinueWatching<br/>SavedContentSection"]
    E5["Zustand UI<br/>device, theater, lights"]
  end

  A1 --> A2 --> A3
  A3 --> B1 --> C1
  A3 --> E1
  A2 --> A4
  A2 --> A5
  B1 --> A4

  D1 --> D2 --> B2 --> C1
  D2 --> D3
  D3 --> D4 --> B3 --> C1
  D4 --> B2
  D4 --> D5
  D4 --> E2 --> E3 --> E4
  D5 --> E3
  D5 --> E5
```

## Operational Notes

- `src/hooks/useMediaHub.ts` exists as a shared hook idea, but it is not part of the active runtime path today.
- `SearchModal` fans out through selected internal search routes.
- `src/lib/api.ts` no longer exists; shared logic is split across `media.ts`, `enrichment.ts`, and `adapters/*`.
- `app/api/*` is best understood as selective server adapters, not a monolithic app API layer.
