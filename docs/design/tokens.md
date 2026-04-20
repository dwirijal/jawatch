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
- angka: `mobile`, `tablet`, dan `desktop`

**Anatomy**

- `mobile` = perilaku efektif phone, termasuk uplift `390-430`
- `tablet` = perilaku efektif mulai `768px`
- `desktop` = perilaku efektif `1440px+`

**Source References**

- [foundation state axes](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#state-axes)

**Real Use Cases**

- token layout, type, dan spacing berubah by viewport
- token warna tetap by mode, bukan by viewport

## Color Scheme

**Spec**

Color scheme Jawatch dibangun dari warm editorial light mode dan obsidian cinematic dark mode, dengan domain tint sebagai metadata accent daripada sebagai background utama.

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

### Domain Theme Tokens

| Token family | Semantic role | Light | Dark | Real use case |
| --- | --- | --- | --- | --- |
| `theme.default` | editorial neutral tint | warm ink + pale contrast | pale paper + dark contrast | fallback media UI |
| `theme.anime` | rose-magenta tint | berry rose | dusty rose | anime badge/chip/glow |
| `theme.manga` | amber paper tint | roasted amber | warm amber | comic shelves and chips |
| `theme.donghua` | coral terracotta tint | terracotta | soft coral | donghua accents |
| `theme.movie` | cinematic gold tint | gold | warm gold-sand | movie CTA/chips |
| `theme.drama` | plum tint | plum | pastel plum | drama and shorts |
| `theme.novel` | sepia tint | sepia brown | soft sepia | novel framing |

**Source References**

- [foundation semantic colors](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#core-semantic-raw-colors)
- [foundation domain theme values](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#domain-theme-raw-values)
- [utils.ts THEME_CONFIG](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/lib/utils.ts:57)

**Real Use Cases**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:23) untuk discovery tinting
- [Badge.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Badge.tsx:16) untuk domain-coded chips
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:25) untuk proof of light/dark axis

## Typography Scale

**Spec**

Typography Jawatch didokumentasikan berdasarkan skala, bukan berdasarkan role. Editorial alias dipakai sebagai layer kedua untuk membantu pembacaan desain.

**Anatomy**

| Scale token | Editorial alias | Family | Mobile | Tablet | Desktop | Notes | Real use case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `type-2xs` | `eyebrow` | sans | `10px / 1 / 800 / +0.18-0.24em` | same | same | compact uppercase utility band | badge, chip, kicker |
| `type-xs` | `meta` | sans | `11px / 1 / 700 / +0.18-0.20em` | same | same | utility-label tier | back button labels, tiny metadata |
| `type-sm` | `meta-body` | sans | `12px / relaxed` | same | same | compact support copy | secondary helper copy |
| `type-md` | `body` | sans | `15px / relaxed` | `15px / relaxed` | `15px / relaxed` | baseline readable body | default paragraphs |
| `type-lg` | `deck` | sans | `18px / relaxed / tight` | same | same | lead/supportive editorial paragraph | discovery intro copy |
| `type-xl` | `title-compact` | sans | `20px / snug / medium` | same | same | compact title tier | modal title, compact feature title |
| `type-2xl` | `title` | sans | `24px / snug / medium` | same | same | title tier | block title |
| `type-3xl` | `headline-sm` | heading | `30px / tight / medium` | same | same | bridge between title and headline | section or hero compact title |
| `type-4xl` | `headline` | heading | `36px / 1.1 / -0.04em` | `48px / 1.1 / -0.04em` | `48px / 1.1 / -0.04em` | canonical headline tier | major titles |
| `type-display` | `display` | heading | `44.8px / 0.92 / -0.055em` | `61.44px / 0.92 / -0.055em` | `92.8px / 0.92 / -0.055em` | premium hero scale | home or major hero statements |

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
| `spacing.inline-tight` | `4px` | `4px` | `4px` | `--space-xs` | icon/text micro gap |
| `spacing.inline` | `8px` | `8px` | `8px` | `--space-sm` | chip rows, button internal gap |
| `spacing.component` | `14px` | `14px` | `14px` | `--space-md` | compact panel/control padding |
| `spacing.panel` | `20px` | `20px` | `20px` | `--space-lg` | card/panel body |
| `spacing.roomy` | `28px` | `28px` | `28px` | `--space-xl` | generous separation inside feature block |
| `spacing.section` | `1.5rem` | `1.5rem` | `2rem` effective | `--section-gap` | section stack rhythm |
| `spacing.section-wide` | `2.5rem` | `2.5rem` | `3rem` effective | `--section-gap-wide` | wider section transitions |
| `spacing.safe-shell-bottom` | `calc(4.9rem + safe-area + overlay)` | `3.5rem` | `3.5rem` | `.app-shell` | shell bottom breathing room |
| `size.control-sm` | `36px` | `36px` | `36px` | `Button size=sm` | compact pills |
| `size.control-md` | `44px` | `44px` | `44px` | `Button/Input default` | standard clickable controls |
| `size.control-lg` | `48px` | `56px` | `56px` | `Button size=lg` | hero CTA |
| `size.icon-control` | `44px` | `44px` | `44px` | `Button size=icon` | player/search controls |
| `size.panel-padding` | `16px` | `20px` | `20px` | `Paper padded` | cards and panels |

**Source References**

- [foundation spacing, sizing, and radius primitives](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/docs/design/foundation.md#spacing-sizing-and-radius-primitives)
- [Button.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Button.tsx:17)
- [Input.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Input.tsx:16)
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:31)

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
| `layout.gutter` | `1rem -> 1.25rem` | `1.25rem` | `2rem` effective | shell side padding |

### Rhythm and Grid Tokens

| Token | Mobile | Tablet | Desktop | Real use case |
| --- | --- | --- | --- | --- |
| `layout.section.gap` | `1.5rem` | `1.5rem` | `2rem` effective | route vertical stack |
| `layout.section.gap-wide` | `2.5rem` | `2.5rem` | `3rem` effective | wider section transitions |
| `layout.grid.catalog.default` | `2` | `2` | `5` effective | standard grid |
| `layout.grid.catalog.dense` | `2` | `2` | `6` effective | dense browse grid |
| `layout.grid.catalog.comfortable` | `1 -> 2` | `2` | `4` effective | comfortable browse grid |
| `layout.grid.rail.compact` | `2` | `2` | `5` effective | compact rails |
| `layout.grid.rail.comfortable` | `1 -> 2` | `2` | `4` effective | comfortable rails |
| `layout.grid.rail.shelf` | `1.08 -> 1.28` | `1.28` | `2.85` effective | editorial shelves |

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
| `mobile` | default, including wide phone `390-430` | gutters widen slightly, comfortable grid can climb from `1` to `2`, shelf rail becomes less cramped |
| `tablet` | effective from `768px` | shell bottom padding drops, most grid values still inherit mobile-wide effective values |
| `desktop` | effective from `1440px+` | gutters, section gaps, grid counts, rail density all escalate to cinematic discovery layout |

### Desktop Override Rule

Saat token desktop didokumentasikan, gunakan nilai efektif akhir:
- gutters `2rem`
- section gap `2rem`
- section gap wide `3rem`
- grid default/dense/comfortable `5 / 6 / 4`
- card gap `1.25rem`
- shelf `2.85`

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
- domain-coded accents
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

Read hubs memakai grid dan tint yang sama, tetapi cenderung lean ke manga amber family dan continuation-first rhythm.

**Anatomy**

- comfortable/dense grid
- manga theme tints
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

- `/series/[slug]/episodes/[episodeSlug]`
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
