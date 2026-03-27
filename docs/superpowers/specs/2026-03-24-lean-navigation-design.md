# dwizzyWEEB Lean Navigation Design

Date: 2026-03-24

## Goal

Simplify `dwizzyWEEB` navigation so it scales cleanly across desktop, tablet, and mobile without exposing every content leaf as a top-level item.

## Approved Structure

### Desktop

Top-level navigation:
- `Home`
- `Video`
- `Komik`
- `Novel`
- `Bookmark`
- `Account` remains on the right through the existing auth-aware entry

Dropdown groups:
- `Video`: `Film`, `Anime`, `Donghua`
- `Komik`: `Manga`, `Manhwa`, `Comic US`
- `Novel`: `Light Novel`, `Long Novel`

Unavailable destinations are shown as `Coming soon` and are not clickable.

### Mobile

Bottom navigation is capped at four items:
- `Home`
- `Search`
- `Bookmark`
- `Menu`

`Menu` opens a side panel containing:
- `Video` group
- `Komik` group
- `Novel` group
- auth/account section

## Interaction Rules

- Leaf categories do not appear as top-level navigation anymore.
- Search remains a global action.
- `Bookmark` replaces the old `Library` concept.
- Auth stays soft-gated and auth-aware.
- Mobile side panel is the only place where the full category tree is shown.

## Route Mapping

- `Home` -> `/`
- `Bookmark` -> `/collection`
- `Film` -> `/movies`
- `Anime` -> `/anime`
- `Donghua` -> `/donghua`
- `Manga` -> `/manga`
- `Manhwa` -> unavailable in v1
- `Comic US` -> unavailable in v1
- `Light Novel` -> unavailable in v1
- `Long Novel` -> unavailable in v1

## Supporting Changes

- Add a lightweight `/collection` page so bookmark navigation lands on a valid route.
- Centralize navigation config in a shared file to keep desktop and mobile in sync.
- Preserve existing search modal and auth session bridge.
