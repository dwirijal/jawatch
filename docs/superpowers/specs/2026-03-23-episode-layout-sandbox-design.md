# Episode Layout Sandbox Design

## Goal

Create a non-runtime TSX sandbox for the anime episode page so layout exploration can happen without touching the live route.

## Scope

Included:

- one standalone TSX draft file near the episode route
- static layout only
- no shared app components
- no wiring into the active route

Excluded:

- replacing the live episode page
- real data loading
- player implementation
- reusable component extraction

## Approach

Add a draft component beside the active episode route. The file will use plain JSX and Tailwind classes only:

- `div`
- `section`
- `button`
- `img`
- text placeholders

The layout will resemble a YouTube-style watch page:

- primary player stage on the left
- metadata and actions directly under the player
- description and discussion placeholders below
- playlist rail on the right

This gives a safe place for visual iteration before any production refactor.
