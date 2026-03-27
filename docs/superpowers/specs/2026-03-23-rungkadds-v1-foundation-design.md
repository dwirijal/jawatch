# rungkadDS V1 Foundation Design

## Summary

`rungkadDS` is the new canonical design system for the `dwizzyOS` ecosystem. V1 is intentionally narrow: establish a framework-agnostic foundation that can be consumed by multiple languages and runtimes later, without coupling the system to React, Tailwind, or any single app.

This first version focuses on:

- W3C design tokens as the source of truth
- generated artifacts: JSON, CSS variables, and TypeScript types
- framework-agnostic core contracts for layout and generic cards
- docs as the authoritative human-facing reference

V1 explicitly does **not** include runtime UI adapters yet.

## Goals

- create one portable design foundation for all `dwizzyOS` web products first, with a clear expansion path to non-web stacks
- stop app-specific layout and card behavior from becoming the de facto design system
- replace ad hoc token usage with a single W3C token source
- establish a reusable layout recipe for media surfaces such as `2 mobile / 4 tablet / 6 desktop`
- define a generic card contract that can later power opinionated wrappers like anime, movie, manga, and dashboard cards

## Non-goals

- no React adapter in v1
- no Tailwind dependency in the design system
- no app-specific media card implementation in the design system
- no theming presets beyond `base`
- no attempt to migrate every existing component in one pass

## Repository Model

`rungkadDS` will be a monorepo with package-first boundaries.

### Packages

#### `packages/tokens`

Canonical token source.

Responsibilities:

- store W3C design tokens JSON
- define the `base` theme
- generate portable build artifacts

Expected outputs:

- `dist/tokens.json`
- `dist/variables.css`
- `dist/index.d.ts`

#### `packages/core`

Framework-agnostic contracts and system rules.

Responsibilities:

- define semantic layout rules
- define breakpoint and container recipes
- define generic card anatomy and variants
- define usage rules for media grids and responsive behavior
- consume generated token artifacts without redefining token values

This package is specification-oriented first. It should not become a React runtime package in disguise.

#### `apps/docs`

Human-facing reference app.

Responsibilities:

- render token browser/reference
- render CSS variable documentation
- render layout recipes and examples
- render generic card anatomy/spec documentation
- host migration guidance from existing `dwizzyOS` apps and from the legacy `Dwizzy-Design-Systems` repo

## Source Of Truth

The only source of visual truth in v1 is `packages/tokens`.

Rules:

- token values are authored once in W3C token JSON
- `packages/core` may define contracts and recipes, but may not invent visual values outside the token system
- docs must read generated artifacts or core specs, not duplicated hand-written values

## Artifact Pipeline

### Authoring

Tokens live in `packages/tokens/src/base/*.json`.

Initial token domains:

- color
- spacing
- radius
- shadow
- blur
- typography
- motion
- breakpoint
- layout

### Build

The token build produces:

1. `tokens.json`
   Portable machine-readable artifact for any language or toolchain.

2. `variables.css`
   Web-ready CSS custom properties for future adapters or app consumption.

3. `index.d.ts`
   TypeScript types and token key exports for tooling and typed consumers.

### Consumption

- `packages/core` consumes token artifacts to define rules and contracts
- `apps/docs` consumes `tokens` and `core` artifacts to render docs
- future adapters like `packages/react`, `packages/css`, or non-web targets consume the same artifacts later

## Foundation Scope

V1 foundation covers:

- semantic colors
- spacing scale
- radius scale
- elevation/shadow scale
- blur tokens
- typography scale
- motion timing/easing tokens
- breakpoint tokens
- container and layout tokens

Only `base` theme ships in v1.

## Layout Model

Responsive behavior is owned by layout recipes, not by app-specific cards.

### Core Layout Primitives

V1 should define contracts for:

- `Container`
- `Grid`
- `Stack`
- `Inline`
- `Cluster`
- `AspectRatio`

These are contracts and documentation artifacts in v1, not framework runtime components.

### Media Grid Recipe

The first locked recipe is `media-grid`.

Behavior:

- mobile: `2` columns
- tablet: `4` columns
- desktop: `6` columns

Rules:

- parent layout determines number of columns
- cards occupy `width: 100%` of the slot they receive
- aspect ratio is handled by a media slot contract, not by content hacks
- fixed widths like `w-48` or `w-64` are forbidden in grid card surfaces governed by this recipe

## Generic Card System

V1 defines a generic card contract, not an opinionated anime/movie card.

### Anatomy

- `CardRoot`
- `CardMedia`
- `CardBody`
- `CardEyebrow`
- `CardTitle`
- `CardDescription`
- `CardMeta`
- `CardFooter`
- `CardBadge`
- `CardAction`

### Variants

#### Orientation

- `vertical`
- `horizontal`

#### Density

- `compact`
- `default`
- `comfortable`

#### Emphasis

- `neutral`
- `elevated`
- `outlined`
- `filled`

#### Media Ratio

- `1:1`
- `4:3`
- `3:4`
- `2:3`
- `16:9`

### Card Rules

- card contract must work with or without media
- card contract must work with or without footer or badge
- cards must be content-slot driven, not viewport-hack driven
- typography and spacing inside cards must follow token density rules
- app-specific cards later become wrappers around this contract

## Migration Strategy

Migration must be staged.

### Stage 1: Create `rungkadDS`

- scaffold monorepo
- establish `tokens`, `core`, and `docs`
- no runtime adapter yet

### Stage 2: Audit Existing Systems

Audit:

- `/home/dwizzy/workspace/projects/dwizzyOS/designsystems.md`
- `/home/dwizzy/workspace/projects/dwizzyOS/Dwizzy-Design-Systems`
- `dwizzyWEEB` current components and layout patterns

Classify existing code into:

- token value candidates
- core contract candidates
- app-specific components that should stay outside the system

### Stage 3: Future Adapters

After v1 is stable:

- add `packages/css` if a dedicated CSS runtime is needed
- add `packages/react` as the first adapter
- only then begin cutting `dwizzyWEEB` over from local UI primitives to `rungkadDS`

## Why This Architecture

This structure is the strongest fit for the stated goal that `rungkadDS` should be usable from multiple languages and stacks:

- W3C token JSON is platform-neutral
- CSS variables are useful for web without forcing Tailwind
- TS types help JS/TS tooling without becoming the system boundary
- core contracts stay portable
- runtime adapters can be added later without redesigning the foundation

## Decisions Locked

- monorepo package-first
- framework-agnostic target
- W3C design tokens JSON as canonical source
- v1 theme scope: `base` only
- v1 packages: `tokens`, `core`, `docs`
- v1 outputs: JSON, CSS variables, TypeScript types
- v1 runtime adapters: none
- generic card system, not media-specific cards
- responsive media surfaces governed by layout recipes, with `2/4/6` columns as the first locked recipe
