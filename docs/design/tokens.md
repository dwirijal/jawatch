# Jawatch Design Tokens

`tokens.md` menerjemahkan bahan mentah dari `foundation.md` menjadi sistem semantik Jawatch. Dokumen ini design-led, tetapi tetap bisa diaudit balik ke [src/app/globals.css](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:1) dan consumers nyata di UI. Repo ini tidak menyimpan theme map di `tailwind.config.*`; Tailwind v4 hanya diaktifkan lewat [postcss.config.mjs](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/postcss.config.mjs:1), sehingga token utilitas juga harus dibaca sebagai turunan dari `globals.css` dan `@theme inline`.

## Intent

**Spec**

Dokumen ini mendefinisikan bahasa desain Jawatch untuk:
- color scheme
- typography scale
- spacing and sizing
- radius and shape
- shadow and elevation
- layout grid
- breakpoint behavior
- motion, focus, and accessibility

**Anatomy**

- raw source tetap hidup di `foundation.md`
- token di sini adalah semantic grouping, bukan dump raw variable
- token harus bisa dipakai sebagai acuan untuk dokumentasi atom berikutnya
- ketika token muncul di utility Tailwind, provenance-nya tetap `globals.css` via `@theme inline`

**Source References**

- [foundation.md](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md)
- [globals.css](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:1)
- [postcss.config.mjs](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/postcss.config.mjs:1)

**Real Use Cases**

- menjaga konsistensi antara discovery, detail, watch, read, dan overlay surfaces
- menjadi jembatan sebelum dokumentasi atom
- mencegah pembaca mencari token di `tailwind.config.*` yang memang tidak ada di repo ini

## State Axes

**Spec**

Semua token mengikuti axis yang sama dengan foundation:

- warna: `light` dan `dark`
- angka: `mobile`, `mobile-wide`, `tablet`, `desktop`, dan `wide`

**Anatomy**

- `mobile` = default phone
- `mobile-wide` = uplift mulai `430px`
- `tablet` = mulai `768px`
- `desktop` = mulai `1024px`
- `wide` = mulai `1440px`

**Source References**

- [foundation state axes](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#state-axes)

**Real Use Cases**

- token layout, type, dan spacing berubah by viewport
- token warna tetap by mode, bukan by viewport

## Color Scheme

**Spec**

Color scheme Jawatch sekarang dibangun dari satu brand family `primary`, satu neutral system untuk canvas dan content, dan empat semantic status families. Domain tint bukan lagi token canonical; yang canonical adalah primitive aliases dan semantic runtime tokens.

**Anatomy**

| Token group | Light | Dark | Foundation source | Real use case |
| --- | --- | --- | --- | --- |
| `canvas.page` | `background` | `background` | `--background` | body, page shell |
| `canvas.page-alt` | `background-alt` | `background-alt` | `--background-alt` | page depth, gradient fade |
| `content.primary` | `foreground` | `foreground` | `--foreground` | headline, core copy |
| `content.secondary` | `muted-foreground` | `muted-foreground` | `--muted-foreground` | metadata, subtitle |
| `surface.base` | `surface-1` | `surface-1` | `--surface-1` | muted cards, controls |
| `surface.strong` | `surface-2` | `surface-2` | `--surface-2` | solid panels |
| `surface.elevated` | `surface-elevated` | `surface-elevated` | `--surface-elevated` | modal and premium cards |
| `surface.overlay` | `surface-overlay` | `surface-overlay` | `--surface-overlay` | glass-like layers |
| `border.subtle` | `border-subtle` | `border-subtle` | `--border-subtle` | default strokes |
| `border.strong` | `border-strong` | `border-strong` | `--border-strong` | hover/focus emphasis |
| `accent.primary` | `accent` | `accent` | `--accent` | CTA/focus/kicker |
| `accent.soft` | `accent-soft` | `accent-soft` | `--accent-soft` | glow wash, muted highlight |
| `accent.strong` | `accent-strong` | `accent-strong` | `--accent-strong` | CTA edge and emphasis |
| `accent.on-accent` | `accent-contrast` | `accent-contrast` | `--accent-contrast` | text on accent |
| `selection.default` | `selection` | `selection` | `--selection` | native selection fill |
| `signal.success` | `signal-success` | `signal-success` | `--signal-success` | positive status |
| `signal.warning` | `signal-warning` | `signal-warning` | `--signal-warning` | caution status |
| `signal.danger` | `signal-danger` | `signal-danger` | `--signal-danger` | destructive/error status |
| `signal.info` | `signal-info` | `signal-info` | `--signal-info` | helper/info status |

### Primitive Alias Families

| Family | Raw source | Semantic meaning | Real use case |
| --- | --- | --- | --- |
| `primary` | `classic-crimson` | brand, CTA, active state | primary button and emphasis |
| `success` | `mint-leaf` | positive state | success banner or badge |
| `warning` | `golden-orange` | caution state | warning chip or notice |
| `danger` | `strawberry-red` | destructive or error state | error CTA and destructive action |
| `info` | `azure-blue` | informational state | helper callout and neutral action |
| `neutral` | `neutral` | shell, surface, border, text | canvas and content hierarchy |

### Compatibility Theme Tokens

| Token family | Canonical source | Role now | Real use case |
| --- | --- | --- | --- |
| `theme.default` | `theme-primary` | compatibility shim | old variant props still render |
| `theme.anime` | `theme-primary` | compatibility shim | legacy anime prop path |
| `theme.manga` | `theme-primary` | compatibility shim | legacy manga prop path |
| `theme.donghua` | `theme-primary` | compatibility shim | legacy donghua prop path |
| `theme.movie` | `theme-primary` | compatibility shim | legacy movie prop path |
| `theme.drama` | `theme-primary` | compatibility shim | legacy drama prop path |
| `theme.novel` | `theme-primary` | compatibility shim | legacy novel prop path |

**Source References**

- [foundation primitive scales](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#primitive-color-scales)
- [foundation semantic runtime color aliases](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#semantic-runtime-color-aliases)
- [foundation theme compatibility shim](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#theme-compatibility-shim)
- [utils.ts THEME_CONFIG](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/lib/utils.ts:74)

**Real Use Cases**

- [Button.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Button.tsx:31) untuk primary CTA token stack
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:14) untuk neutral surface hierarchy
- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:27) masih menerima theme lama, tetapi tint visualnya sudah satu family
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:25) tetap membuktikan axis `light/dark` tanpa domain tint

## Typography Scale

**Spec**

Typography Jawatch didokumentasikan berdasarkan skala, bukan berdasarkan role. Editorial alias dipakai sebagai layer kedua untuk membantu pembacaan desain.

**Anatomy**

| Scale token | Editorial alias | Family | Mobile | Tablet | Desktop | Notes | Real use case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `type-xs` | `meta` | sans | `0.75rem / 1 / 0.24em` | same | same | utility-label tier | badge, chip, kicker |
| `type-sm` | `meta-body` | sans | `0.875rem / 1.6 / 0` | same | same | compact support copy | secondary helper copy |
| `type-base` | `body` | sans | `1rem / 1.6 / 0` | same | same | baseline readable body | default paragraphs |
| `type-lg` | `deck` | sans | `1.125rem / 1.72 / 0` | same | same | lead/supportive editorial paragraph | discovery intro copy |
| `type-xl` | `title-compact` | sans | `1.25rem / 1.1 / 0` | same | same | compact title tier | modal title, compact feature title |
| `type-2xl` | `title` | sans | `1.5rem / 1.1 / 0` | same | same | title tier | block title |
| `type-3xl` | `headline-sm` | heading | `1.875rem / 1.1 / 0` | same | same | bridge between title and headline | section or hero compact title |
| `type-4xl` | `headline` | heading | `2.25rem / 1.1 / 0` | same | same | canonical headline tier | major titles |
| `type-section-title` | `section-title` | heading | `2rem` | `2.5rem` | `3rem` | breakpoint-stepped, not viewport-scaled | section display headings |
| `type-display` | `display` | heading | `3rem / 0.92 / 0` | `4rem / 0.92 / 0` | `5rem / 0.92 / 0` | breakpoint-stepped premium scale | home or major hero statements |

### Implementation Compatibility Note

The current [Typography.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Typography.tsx:14) still exposes `5xl` and `6xl`. In the current token system they should be read as implementation compatibility sizes that exceed the canonical documented scale and sit under the same editorial umbrella as `type-display`.

**Source References**

- [foundation typography primitives](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#typography-primitives)
- [Typography.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Typography.tsx:14)
- [globals.css type utilities](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:369)

**Real Use Cases**

- `eyebrow`: [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:30)
- `body` dan `deck`: [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:41)
- `headline`: [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:183)
- `display`: `.type-display` utility di hero/editorial statements

## Spacing and Sizing

**Spec**

Jawatch memakai scale spacing yang relatif ringkas, lalu memetakannya ke band semantik: inline, control, panel, section, dan shell.

**Anatomy**

| Token | Mobile | Tablet | Desktop | Foundation source | Real use case |
| --- | --- | --- | --- | --- | --- |
| `spacing.inline-tight` | `0.25rem` | same | same | `--space-2xs` | icon/text micro gap |
| `spacing.inline` | `0.5rem` | same | same | `--space-xs` | chip rows, small inline gap |
| `spacing.component` | `1rem` | same | same | `--space-md` | compact panel/control padding |
| `spacing.panel` | `1.25rem` | same | same | `--space-lg` | card/panel body |
| `spacing.roomy` | `1.75rem` | same | same | `--space-xl` | generous separation inside feature block |
| `spacing.section` | `1.5rem` | `1.75rem` | `2rem` | `--grid-section-gap` / `--section-gap` | section stack rhythm |
| `spacing.section-wide` | `2.5rem` | `2.75rem` | `3rem` | `--grid-section-gap-wide` / `--section-gap-wide` | wider section transitions |
| `spacing.safe-shell-bottom` | `calc(4.9rem + safe-area + overlay)` | `3.5rem` | `3.5rem` | `.app-shell` | shell bottom breathing room |
| `size.control-sm` | `2.25rem` | same | same | `--size-control-sm` | compact pills |
| `size.control-md` | `2.75rem` | same | same | `--size-control-md` | standard clickable controls |
| `size.control-lg` | `3rem` | same | same | `--size-control-lg` | hero CTA |
| `size.touch` | `2.75rem` | same | same | `--size-touch` | minimum touch target |
| `size.icon-sm/md/lg` | `1rem / 1.25rem / 1.5rem` | same | same | `--size-icon-*` | icon-only buttons |
| `size.avatar-sm/md/lg` | `1.25rem / 2.25rem / 3rem` | same | same | `--size-avatar-*` | account and identity avatars |
| `size.switch-track/thumb` | `2rem / 0.75rem` | same | same | `--size-switch-*` | compact binary toggles |

**Source References**

- [foundation spacing, sizing, and radius primitives](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#spacing-sizing-and-radius-primitives)
- [Button.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Button.tsx:17)
- [Input.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Input.tsx:16)
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:31)
- [design token contract test](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/tests/unit/design-token-palette-contract.test.mjs:344) guards shared components from raw UI primitives

**Real Use Cases**

- CTA rows in detail hero
- search close button and result controls
- player utility buttons
- padded cards and panels across hubs

## Radius and Shape

**Spec**

Shape Jawatch cenderung soft, premium, dan glass-friendly. Radius dipakai bertingkat, bukan satu angka untuk semua permukaan.

**Anatomy**

| Token | Mobile | Tablet | Desktop | Foundation source | Real use case |
| --- | --- | --- | --- | --- | --- |
| `shape.control-compact` | `0.9rem` | `0.9rem` | `0.9rem` | `radius-sm` | badges, metadata pills |
| `shape.control-default` | `1.15rem` | `1.15rem` | `1.15rem` | `radius-md` | buttons, inputs |
| `shape.action-large` | `1.5rem` | `1.5rem` | `1.5rem` | `radius-lg` | hero back button, framed controls |
| `shape.panel-default` | `1.85rem` | `1.85rem` | `1.85rem` | `radius-xl` | standard premium panel |
| `shape.panel-feature` | `2.2rem` | `2.2rem` | `2.2rem` | `radius-2xl` | elevated discovery panel, hero shell |
| `shape.pill` | `9999px` pattern | `9999px` pattern | `9999px` pattern | component class convention | chips, theme toggle, segmented controls |

**Source References**

- [foundation spacing, sizing, and radius primitives](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#spacing-sizing-and-radius-primitives)
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:31)
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:25)

**Real Use Cases**

- segmented theme toggle
- discovery cards
- search preview cards
- detail hero shell

## Shadow and Elevation

**Spec**

Jawatch menggunakan elevation sebagai kombinasi shadow, blur, and occasionally refractive treatment. Elevation tidak hanya berarti `box-shadow`.

**Anatomy**

| Token | Mobile | Tablet | Desktop | Foundation source | Real use case |
| --- | --- | --- | --- | --- | --- |
| `elevation.subtle` | `shadow-sm` | same | same | `--shadow-sm` | low-lift small controls |
| `elevation.panel` | `shadow-md` | same | same | `--shadow-md` | `surface-panel`, small premium surfaces |
| `elevation.elevated` | `shadow-lg` | same | same | `--shadow-lg` | `surface-panel-elevated`, elevated cards |
| `elevation.cinematic` | `shadow-xl` | same | same | `--shadow-xl` | large hero/modal emphasis |
| `effect.glass` | `surface-overlay + 18px blur` | same | same | `.liquid-glass` | overlay chrome |
| `effect.refractive` | `noise + gradient border` | same | same | `.glass-noise`, `.refractive-border` | premium media panels |
| `focus.primary` | `1px + 4px accent halo` | same | same | `.focus-tv` | all focusable premium controls |

**Source References**

- [foundation shadow, blur, and interaction primitives](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#shadow-blur-and-interaction-primitives)
- [globals.css effects](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:284)

**Real Use Cases**

- HubLaneCard elevated shell
- search overlay
- theme toggle shell
- player overlay controls

## Layout Grid

**Spec**

Layout Jawatch bukan 12-column editorial grid. Sistem yang dipakai saat ini adalah:
- container-led layouts
- card grid layouts
- rail-based discovery layouts

### Container Tokens

| Token | Mobile | Tablet | Desktop | Real use case |
| --- | --- | --- | --- | --- |
| `layout.container.default` | `min(76rem, width - gutters)` | same | same | standard route shell |
| `layout.container.wide` | `min(88rem, width - gutters)` | same | same | wide discovery/detail shell |
| `layout.container.immersive` | `96rem cap available, but route use remains selective` | same | same | immersive watch-ready cap |
| `layout.gutter` | `1rem` | `1.5rem` | `2rem` | shell side padding |
| `layout.gutter-wide` | n/a | n/a | `2.5rem` from `1440px` | wide desktop breathing room |

### Rhythm and Grid Tokens

| Token | Mobile | Tablet | Desktop | Real use case |
| --- | --- | --- | --- | --- |
| `layout.section.gap` | `1.5rem` | `1.75rem` | `2rem` | route vertical stack |
| `layout.section.gap-wide` | `2.5rem` | `2.75rem` | `3rem` | wider section transitions |
| `layout.grid.columns` | `4` | `8` | `12` | page layout planning |
| `layout.grid.catalog.default` | `2` | `3` | `4` | standard grid |
| `layout.grid.catalog.dense` | `2` | `4` | `5` | dense browse grid |
| `layout.grid.catalog.comfortable` | `1 -> 2` | `2` | `3` | comfortable browse grid |
| `layout.grid.rail.compact` | `2` | `3` | `4` | compact rails |
| `layout.grid.rail.comfortable` | `1 -> 2` | `2` | `3` | comfortable rails |
| `layout.grid.rail.shelf` | `1.08 -> 1.28` | `1.8` | `2.35` | editorial shelves |

At `1440px+`, catalog density steps up again to `5 / 6 / 4` and shelf rail to `2.85`.

**Source References**

- [foundation layout grid foundation](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#layout-grid-foundation)
- [globals.css media-grid](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:428)
- [globals.css media-rail](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:442)

**Real Use Cases**

- `/watch/movies`, `/watch/series`, `/read/comics`
- home shelves and continue rows
- wide detail and hero sections

## Breakpoints and Responsive Behavior

**Spec**

Responsive behavior Jawatch didokumentasikan sebagai state efektif, bukan sebagai daftar media query mentah semata.

**Anatomy**

| State | Trigger | What changes |
| --- | --- | --- |
| `mobile` | default | 4-column planning grid, 2-up catalog cards, safe bottom shell |
| `mobile-wide` | `430px` | gutter/card gap widen, comfortable catalog can become 2-up, shelf rail less cramped |
| `tablet` | `768px` | 8-column planning grid, 3-up catalog default, shell bottom padding drops |
| `desktop` | `1024px` | 12-column planning grid, 4-up catalog default, wider section rhythm |
| `wide` | `1440px` | catalog density reaches `5 / 6 / 4`, card gap `1.25rem`, shelf rail `2.85` |

**Source References**

- [foundation effective value notes](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#effective-value-notes)

**Real Use Cases**

- discovery shelves terbaca sangat berbeda antara mobile dan desktop
- tablet tetap dekat ke mobile untuk banyak rule layout

## Motion, Focus, and Accessibility Tokens

**Spec**

Token ini mengikat behavior interaktif dasar agar tetap konsisten antar surface.

**Anatomy**

| Token | Mobile | Tablet | Desktop | Real use case |
| --- | --- | --- | --- | --- |
| `motion.reduced` | force near-zero animation and transition | same | same | respects reduced motion |
| `motion.surface` | `200-300ms` interaction band by component convention | same | same | cards, buttons, toggle |
| `focus.primary` | accent halo with `1px + 4px` ring recipe | same | same | all `focus-tv` controls |
| `accessibility.color-scheme` | `light dark` root declaration | same | same | browser-native control theme |
| `layout.safe-bottom` | shell aware of `safe-area-inset-bottom` | same rule, different effective values | same rule, different effective values | mobile nav and overlays |
| `text.balance` | headings preserve balanced wrap | same | same | premium editorial headings |

**Source References**

- [CssBaseline.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/CssBaseline.tsx:1)
- [globals.css reduced motion](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:267)
- [globals.css focus-tv](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:359)

**Real Use Cases**

- keyboard focus in search and player controls
- motion-reduced browsing
- mobile safe-area aware shell

## Real Use Case Maps

### Home and Discovery

**Spec**

Discovery surfaces adalah kombinasi terpadat dari color, type, elevation, dan rail/grid tokens.

**Anatomy**

- elevated surfaces
- primary-coded accents
- shelf rail density
- headline and kicker hierarchy

**Source References**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:23)

**Real Use Cases**

- home lanes
- curated discovery cards
- cross-domain navigation shelves

### Watch Hubs

**Spec**

Watch hubs mengutamakan dense catalog grid, container-led layout, dan section rhythm yang stabil.

**Anatomy**

- container default/wide
- default/dense catalog grid
- muted and elevated surfaces
- compact supporting typography

**Real Use Cases**

- `/watch/movies`
- `/watch/series`
- `/watch`

### Read Hubs

**Spec**

Read hubs memakai grid dan tint yang sama, tetapi cenderung lean ke primary family dan continuation-first rhythm.

**Anatomy**

- comfortable/dense grid
- primary theme compatibility tint
- supportive body and metadata copy

**Real Use Cases**

- `/read`
- `/read/comics`

### Detail Surfaces

**Spec**

Detail surfaces memakai strongest surface depth, radius hierarchy, and type emphasis.

**Anatomy**

- cinematic elevation
- large feature radius
- title stack
- badge and metadata chip system

**Real Use Cases**

- `/movies/[slug]`
- `/series/[slug]`
- `/comics/[slug]`

### Player Surfaces

**Spec**

Player surfaces memakai compact control sizes, blur-backed controls, and strong focus behavior.

**Anatomy**

- control-md and icon-control
- surface overlays
- focus primary
- domain-colored next action

**Real Use Cases**

- `/series/[slug]/ep/[number]`
- `/series/[slug]/special/[episodeSlug]`
- `/shorts/[slug]/episodes/[episodeSlug]`

### Search and Overlay Surfaces

**Spec**

Overlay surfaces menggabungkan glass, elevated surfaces, compact cards, and compact metadata scales.

**Anatomy**

- overlay surface
- elevated paper
- compact poster card
- micro typographic tiers

**Real Use Cases**

- search modal
- poppers and dialogs

### Auth and Support Surfaces

**Spec**

Auth and support surfaces harus tetap memakai token yang sama tanpa berubah jadi visual subsystem baru.

**Anatomy**

- default content and surface tokens
- readable body scale
- moderate panel depth
- stable control sizing

**Real Use Cases**

- login
- signup
- onboarding
- support/contact pages
