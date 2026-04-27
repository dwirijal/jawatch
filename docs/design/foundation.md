# Jawatch Foundation

`foundation.md` adalah inventaris mentah visual Jawatch. Dokumen ini sengaja implementation-led: sumber utamanya adalah [src/app/globals.css](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:1) dan baseline kecil di [src/components/atoms/CssBaseline.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/CssBaseline.tsx:1). Repo ini tidak punya `tailwind.config.*`; Tailwind v4 hanya di-wire lewat [postcss.config.mjs](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/postcss.config.mjs:1), jadi theme runtime yang relevan hidup di `globals.css` dan `@theme inline`. Dokumen ini belum membahas prop API atau variant atom.

## Intent

**Spec**

Dokumen ini memetakan apa yang benar-benar hidup di implementasi sekarang:
- raw color sources
- raw numeric primitives
- raw layout and grid primitives
- raw effects and accessibility primitives

**Anatomy**

- source of truth utama: `src/app/globals.css`
- bridge ke utility Tailwind v4: `@theme inline` di `src/app/globals.css`
- source of truth pendukung: `src/components/atoms/CssBaseline.tsx`
- tailwind wiring only: `postcss.config.mjs`
- supporting evidence:
  - `src/components/atoms/Typography.tsx`
  - `src/components/atoms/Button.tsx`
  - `src/components/atoms/Paper.tsx`
  - `src/components/atoms/Input.tsx`
  - `src/components/atoms/Badge.tsx`
  - `src/components/molecules/HubLaneCard.tsx`
  - `src/components/organisms/SearchModal.tsx`
  - `src/components/organisms/VideoDetailHeroFrame.tsx`
  - `src/components/organisms/video-player/VideoPlayerControls.tsx`
  - `src/components/molecules/ThemeToggle.tsx`

**Source References**

- [globals.css](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:1)
- [postcss.config.mjs](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/postcss.config.mjs:1)
- [CssBaseline.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/CssBaseline.tsx:1)

**Real Use Cases**

- halaman discovery dan hub memakai raw surface, border, dan grid variables secara langsung
- utility Tailwind mewarisi warna dan font dari `@theme inline`, bukan dari file config terpisah
- player, modal, dan theme toggle memakai raw focus, blur, radius, dan control sizing
- detail hero memakai raw elevation, panel, dan poster framing primitives

## State Axes

**Spec**

Jawatch mendokumentasikan primitive di dua axis:

- `color` by `light` and `dark`
- `number-based primitives` by `mobile`, `mobile-wide`, `tablet`, `desktop`, and `wide`

**Anatomy**

- `light`: state saat `:root, html[data-color-mode="light"]` aktif
- `dark`: state saat `html[data-color-mode="dark"]` aktif
- `mobile`: perilaku efektif phone default
- `mobile-wide`: uplift mulai `430px`
- `tablet`: perilaku efektif mulai `768px`
- `desktop`: perilaku efektif mulai `1024px`
- `wide`: density uplift mulai `1440px`

**Source References**

- [globals.css light vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:3)
- [globals.css dark vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:108)
- [globals.css 430 override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:488)
- [globals.css 1440 overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:503)

**Real Use Cases**

- theme toggle menukar state `light/dark`
- shelf density, gutters, dan card counts berubah lintas `mobile/tablet/desktop`

## Raw Color Inventory

### Primitive Color Scales

**Spec**

`foundation.md` sekarang memegang raw palette yang eksplisit, bukan hasil turunan dari warna runtime lama. Semua warna UI Jawatch harus turun dari satu set primitive berikut:

- `primary` alias ke raw family `classic-crimson`
- `success` alias ke raw family `mint-leaf`
- `warning` alias ke raw family `golden-orange`
- `danger` alias ke raw family `strawberry-red`
- `info` alias ke raw family `azure-blue`
- `neutral` alias ke raw family `neutral`

Primitive ini hidup dua lapis:
- raw source: `--color-*`
- primitive alias: `--primitive-color-*`

**Anatomy**

| Raw family | Alias family | Format | Notes | Real use case |
| --- | --- | --- | --- | --- |
| `classic-crimson` | `primary` | `oklch(50-950)` | satu-satunya brand/primary family | CTA, active state, all legacy theme tint |
| `mint-leaf` | `success` | `oklch(50-950)` | semantic positive family | future success banner, healthy state, positive signal |
| `golden-orange` | `warning` | `oklch(50-950)` | semantic caution family | warning pill, editorial caution, pending state |
| `strawberry-red` | `danger` | `oklch(50-950)` | semantic critical family | destructive action, critical badge, error emphasis |
| `azure-blue` | `info` | `oklch(50-950)` | semantic informational family | info banner, helper accent, neutral action |
| `neutral` | `neutral` | `hex(50-950)` | canvas/content/surface family | page shell, body text, border, panel hierarchy |

**Primitive Scale Values**

#### Classic Crimson / Primary

`50 oklch(94.89% 0.020 9.78)`  
`100 oklch(90.01% 0.039 12.05)`  
`200 oklch(80.32% 0.083 12.48)`  
`300 oklch(71.18% 0.130 14.87)`  
`400 oklch(63.19% 0.174 17.78)`  
`500 oklch(57.14% 0.208 22.63)`  
`600 oklch(48.57% 0.174 22.14)`  
`700 oklch(39.59% 0.139 21.86)`  
`800 oklch(30.14% 0.101 20.61)`  
`900 oklch(19.95% 0.058 19.04)`  
`950 oklch(16.71% 0.043 17.02)`

#### Mint Leaf / Success

`50 oklch(97.68% 0.024 173.86)`  
`100 oklch(95.41% 0.048 173.51)`  
`200 oklch(91.33% 0.093 170.89)`  
`300 oklch(87.93% 0.131 168.77)`  
`400 oklch(85.22% 0.160 165.91)`  
`500 oklch(83.19% 0.180 161.92)`  
`600 oklch(70.42% 0.151 162.43)`  
`700 oklch(57.02% 0.121 162.71)`  
`800 oklch(42.78% 0.089 163.23)`  
`900 oklch(27.23% 0.053 166.15)`  
`950 oklch(22.18% 0.041 167.33)`

#### Golden Orange / Warning

`50 oklch(97.34% 0.021 79.10)`  
`100 oklch(94.89% 0.043 81.89)`  
`200 oklch(90.01% 0.085 81.41)`  
`300 oklch(85.20% 0.122 79.36)`  
`400 oklch(80.93% 0.150 76.55)`  
`500 oklch(77.04% 0.165 70.66)`  
`600 oklch(65.28% 0.139 71.04)`  
`700 oklch(52.96% 0.112 71.64)`  
`800 oklch(40.09% 0.083 74.05)`  
`900 oklch(25.84% 0.051 78.08)`  
`950 oklch(21.04% 0.041 81.04)`

#### Strawberry Red / Danger

`50 oklch(94.78% 0.023 17.56)`  
`100 oklch(89.44% 0.049 18.10)`  
`200 oklch(79.43% 0.103 19.60)`  
`300 oklch(70.52% 0.159 21.99)`  
`400 oklch(63.58% 0.209 25.41)`  
`500 oklch(59.55% 0.237 28.57)`  
`600 oklch(50.47% 0.200 28.44)`  
`700 oklch(40.98% 0.160 28.19)`  
`800 oklch(30.93% 0.117 27.66)`  
`900 oklch(19.98% 0.071 26.45)`  
`950 oklch(16.47% 0.055 25.63)`

#### Azure Blue / Info

`50 oklch(95.25% 0.021 259.19)`  
`100 oklch(90.24% 0.044 259.95)`  
`200 oklch(80.61% 0.090 260.01)`  
`300 oklch(71.25% 0.139 259.68)`  
`400 oklch(62.55% 0.187 259.69)`  
`500 oklch(55.12% 0.229 260.92)`  
`600 oklch(46.93% 0.191 260.78)`  
`700 oklch(38.38% 0.151 260.54)`  
`800 oklch(29.34% 0.109 260.05)`  
`900 oklch(19.62% 0.064 257.65)`  
`950 oklch(16.50% 0.047 256.29)`

#### Neutral

`50 #F7F7F7`  
`100 #EFEFEF`  
`200 #D9D9D9`  
`300 #BFBFBF`  
`400 #A6A6A6`  
`500 #8C8C8C`  
`600 #737373`  
`700 #595959`  
`800 #404040`  
`900 #2A2A2A`  
`950 #212121`

**Source References**

- [globals.css primitive palette](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:3)
- [globals.css primitive aliases](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:76)
- [globals.css @theme inline](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:321)

**Real Use Cases**

- semua utility Tailwind masa depan bisa memakai `primary-*`, `success-*`, `warning-*`, `danger-*`, `info-*`, dan `neutral-*`
- `classic-crimson` menjadi satu-satunya family brand, jadi chip dan CTA tidak lagi berubah per domain
- neutral scale sekarang memegang seluruh canvas, text, border, dan panel hierarchy

### Semantic Runtime Color Aliases

**Spec**

Setelah primitive dikunci, runtime CSS hanya boleh memetakan semantic vars ke primitive aliases. Artinya `--background`, `--surface-*`, `--accent*`, `--selection`, `--signal-*`, dan `--theme-*` tidak lagi menyimpan warna mentah.

**Anatomy**

| Semantic runtime token | Light source | Dark source | Primitive source | Real use case |
| --- | --- | --- | --- | --- |
| `background` | `neutral-50` | `neutral-950` | `primitive-color-neutral-*` | page shell |
| `background-alt` | `neutral-100` | `neutral-900` | `primitive-color-neutral-*` | background depth |
| `foreground` | `neutral-950` | `neutral-50` | `primitive-color-neutral-*` | body and heading text |
| `muted-foreground` | `neutral-700` | `neutral-300` | `primitive-color-neutral-*` | metadata and helper text |
| `border-subtle` | `neutral-200` | `neutral-800` | `primitive-color-neutral-*` | default strokes |
| `border-strong` | `neutral-300` | `neutral-700` | `primitive-color-neutral-*` | higher-emphasis strokes |
| `surface-1` | `neutral-50` | `neutral-900` | `primitive-color-neutral-*` | base cards and controls |
| `surface-2` | `neutral-100` | `neutral-800` | `primitive-color-neutral-*` | stronger panels |
| `surface-elevated` | `neutral-50` | `neutral-900` | `primitive-color-neutral-*` | elevated cards and overlays |
| `surface-overlay` | `neutral-100` | `neutral-900` | `primitive-color-neutral-*` | liquid-glass shells |
| `accent` | `primary-500` | `primary-500` | `primitive-color-primary-*` | primary CTA |
| `accent-soft` | `primary-50` | `primary-950` | `primitive-color-primary-*` | ring spread and glow bed |
| `accent-strong` | `primary-600` | `primary-600` | `primitive-color-primary-*` | kicker and focus edge |
| `accent-contrast` | `neutral-50` | `neutral-50` | `primitive-color-neutral-*` | text on accent |
| `selection` | `primary-200` | `primary-800` | `primitive-color-primary-*` | browser selection fill |
| `signal-success` | `success-600` | `success-500` | `primitive-color-success-*` | positive signal |
| `signal-warning` | `warning-600` | `warning-500` | `primitive-color-warning-*` | caution signal |
| `signal-danger` | `danger-600` | `danger-500` | `primitive-color-danger-*` | destructive/error signal |
| `signal-info` | `info-600` | `info-500` | `primitive-color-info-*` | informational signal |

**Source References**

- [globals.css light runtime aliases](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:131)
- [globals.css dark runtime aliases](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:256)

**Real Use Cases**

- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:128) mengambil seluruh surface stack dari neutral aliases ini
- [Button.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Button.tsx:31) memakai `accent`, `accent-strong`, dan `accent-contrast` sebagai CTA baseline
- state sukses, warning, danger, dan info sekarang punya family yang eksplisit untuk atom nanti, tanpa harus bikin palette baru

### Theme Compatibility Shim

**Spec**

Jawatch tidak lagi memakai domain theme visual. Namun `THEME_CONFIG` dan `--theme-*` compatibility layer tetap dipertahankan karena banyak consumer lama masih memanggil variant `anime`, `manga`, `movie`, `drama`, `donghua`, `novel`, dan `default`.

**Anatomy**

- canonical runtime theme family sekarang hanya `theme-primary`
- semua `theme-default-*`, `theme-anime-*`, `theme-manga-*`, `theme-donghua-*`, `theme-movie-*`, `theme-drama-*`, dan `theme-novel-*` mengarah ke `theme-primary-*`
- artinya UI lama tidak pecah, tetapi seluruh tint domain sekarang tampil dengan primary family yang sama

**Source References**

- [globals.css theme-primary aliases](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:149)
- [utils.ts THEME_CONFIG compatibility shim](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/lib/utils.ts:74)

**Real Use Cases**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:27) masih menerima `theme` prop lama, tetapi tint visualnya sekarang konsisten
- [Badge.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Badge.tsx:18) tidak lagi membedakan domain via warna, hanya via label/content
- [VideoPlayerControls.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/video-player/VideoPlayerControls.tsx:44) tetap bekerja tanpa rewrite prop API

## Raw Numeric Inventory

### Typography Primitives

**Spec**

Bagian ini memetakan angka tipografi mentah dari utility CSS global dan public atom scale yang benar-benar ada sekarang.

**Anatomy**

| Primitive | Mobile | Tablet | Desktop | Notes | Live use case |
| --- | --- | --- | --- | --- | --- |
| body base | `16px / 1.6` | `16px / 1.6` | `16px / 1.6` | `body` default in base layer | page body copy |
| heading base tracking | `-0.03em` | `-0.03em` | `-0.03em` | set on `h1-h6` | title rhythm |
| `type-kicker` | `11.2px / 1 / 0.24em / 800` | same | same | uppercase signal text | hub eyebrow, section signal |
| `type-body-large` | `17px / 1.72 / 500` | same | same | `--type-size-body-large` | lead text |
| `type-section-title` | `32px / 1 / 0 / 700` | `40px / 1 / 0 / 700` | `48px / 1 / 0 / 700` | `--type-size-section-title`, stepped by breakpoint | section headers |
| `type-display` | `48px / 0.92 / 0 / 700` | `64px / 0.92 / 0 / 700` | `80px / 0.92 / 0 / 700` | `--type-size-display`, stepped by breakpoint | premium hero statements |
| Typography `xs` | `11px / 1 / 0.2em / 700` | same | same | atom scale | labels, overlines |
| Typography `sm` | `12px / relaxed` | same | same | atom scale | compact support copy |
| Typography `base` | `15px / relaxed` | same | same | atom scale | body paragraphs |
| Typography `lg` | `18px / relaxed / tight` | same | same | atom scale | deck copy |
| Typography `xl` | `20px / snug / medium` | same | same | atom scale | compact titles |
| Typography `2xl` | `24px / snug / medium` | same | same | atom scale | card or modal title |
| Typography `3xl` | `30px / tight / heading` | same | same | atom scale | headline-sm |
| Typography `4xl` | `36px / 1.1 / -0.04em` | `48px / 1.1 / -0.04em` | `48px / 1.1 / -0.04em` | atom scale | headline |
| Typography `5xl` | `48px / 1.02 / -0.055em` | `72px / 1.02 / -0.055em` | `72px / 1.02 / -0.055em` | implementation scale, not canonical token target | legacy large hero |
| Typography `6xl` | `60px / 0.95 / -0.065em` | `96px / 0.95 / -0.065em` | `96px / 0.95 / -0.065em` | implementation scale, not canonical token target | oversized hero/local art |

**Source References**

- [globals.css base typography](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:215)
- [globals.css type utilities](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:369)
- [Typography.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Typography.tsx:14)

**Real Use Cases**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:30) memakai `type-kicker` dan heading clamp route-local
- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:145) memakai input text `text-lg` sampai `md:text-2xl`
- [VideoDetailHeroFrame.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/VideoDetailHeroFrame.tsx:79) bergantung pada `TitleBlock` plus badge/meta hierarchy

### Spacing, Sizing, and Radius Primitives

**Spec**

Bagian ini menangkap angka mentah untuk rhythm, control sizing, panel padding, dan corner treatment.

**Anatomy**

| Primitive | Mobile | Tablet | Desktop | Notes | Live use case |
| --- | --- | --- | --- | --- | --- |
| `--space-2xs` | `4px` | `4px` | `4px` | tight inline gaps | micro gaps |
| `--space-xs` | `8px` | `8px` | `8px` | inline/action spacing | chip rows |
| `--space-sm` | `12px` | `12px` | `12px` | compact component spacing | stacked control interiors |
| `--space-md` | `16px` | `16px` | `16px` | standard component spacing | panel/control padding |
| `--space-lg` | `20px` | `20px` | `20px` | panel band | large card padding |
| `--space-xl` | `28px` | `28px` | `28px` | roomy component gap | hero/control separation |
| `--space-2xl` | `40px` | `40px` | `40px` | section margin seed | big stack separation |
| `--space-3xl` | `64px` | `64px` | `64px` | hero band | large editorial break |
| `--size-control-sm` | `36px` | `36px` | `36px` | compact control token | compact pills |
| `--size-control-md` | `44px` | `44px` | `44px` | standard control token | primary action, input height |
| `--size-control-lg` | `48px` | `48px` | `48px` | large control token | hero CTA |
| `--size-touch` | `44px` | `44px` | `44px` | minimum hit target | player/search close |
| Paper padding | `16px` | `20px` | `20px` | `p-4 md:p-5` | cards and panels |
| radius-sm | `0.9rem` | `0.9rem` | `0.9rem` | compact control radius | badges, metadata pills |
| radius-md | `1.15rem` | `1.15rem` | `1.15rem` | control default radius | buttons, inputs |
| radius-lg | `1.5rem` | `1.5rem` | `1.5rem` | chunky action radius | back button, poster frame detail |
| radius-xl | `1.85rem` | `1.85rem` | `1.85rem` | standard premium panel | `surface-panel` |
| radius-2xl | `2.2rem` | `2.2rem` | `2.2rem` | feature panel radius | `surface-panel-elevated`, hero shells |

**Source References**

- [globals.css spacing vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:75)
- [globals.css radius vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:88)
- [Button.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Button.tsx:17)
- [Input.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Input.tsx:16)
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:31)

**Real Use Cases**

- [VideoPlayerControls.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/video-player/VideoPlayerControls.tsx:18) memakai control hit target `44px`
- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:176) memakai rounded poster cards dengan `radius-sm`
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:24) memakai pill shell dan segmented controls

### Shadow, Blur, and Interaction Primitives

**Spec**

Primitive ini menangkap depth, glass treatment, focus visibility, dan motion guardrails.

**Anatomy**

| Primitive | Mobile | Tablet | Desktop | Notes | Live use case |
| --- | --- | --- | --- | --- | --- |
| `--shadow-sm` | `0 1px 2px rgba(34,24,16,0.06)` | same | same | subtle lift | minor control lift |
| `--shadow-md` | `0 18px 42px -34px var(--shadow-color)` | same | same | panel depth | `surface-panel` |
| `--shadow-lg` | `0 32px 84px -56px var(--shadow-color-strong)` | same | same | elevated panel | `surface-panel-elevated` |
| `--shadow-xl` | `0 42px 110px -60px var(--shadow-color-strong)` | same | same | cinematic emphasis | large hero or modal emphasis |
| `liquid-glass` blur | `18px` | `18px` | `18px` | overlay blur | overlay chrome |
| `surface-panel` blur | `18px` | `18px` | `18px` | glass panel body | premium muted panels |
| `surface-panel-elevated` blur | `22px` | `22px` | `22px` | stronger elevation blur | hero/discovery cards |
| `glass-noise` opacity | `0.02` | `0.02` | `0.02` | texture overlay | refractive surfaces |
| focus ring inner | `1px` | `1px` | `1px` | focus halo layer 1 | all `focus-tv` controls |
| focus ring outer | `4px` | `4px` | `4px` | focus halo layer 2 | all `focus-tv` controls |
| reduced motion duration | `0.01ms` | `0.01ms` | `0.01ms` | motion kill switch | reduced-motion mode |

**Source References**

- [globals.css shadow vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:83)
- [globals.css utility effects](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:284)
- [globals.css reduced motion](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:267)

**Real Use Cases**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:22) memakai `surface-panel-elevated`
- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:132) memakai large overlay shadow
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:27) memakai blur dan shadow pill shell

## Layout Grid Foundation

### Containers and Page Rhythm

**Spec**

Jawatch memakai adaptive container system, bukan 12-column editorial grid formal.

**Anatomy**

| Primitive | Mobile | Tablet | Desktop | Notes |
| --- | --- | --- | --- | --- |
| `grid-content-max` / `layout-max` | `76rem` | `76rem` | `76rem` | default content max width |
| `grid-content-wide` / `layout-max-wide` | `88rem` | `88rem` | `88rem` | wide discovery/detail shell |
| `grid-content-immersive` / `layout-max-immersive` | `96rem` | `96rem` | `96rem` | immersive watch-ready cap |
| `grid-margin` / `layout-pad` | `1rem -> 1.25rem` | `1.5rem` | `2rem -> 2.5rem wide` | shell gutters |
| `grid-section-gap` / `section-gap` | `1.5rem` | `1.75rem` | `2rem` | default vertical stack gap |
| `grid-section-gap-wide` / `section-gap-wide` | `2.5rem` | `2.75rem` | `3rem` | larger stack gap |
| `app-shell` bottom inset | `calc(4.9rem + safe-area + overlay-offset)` | `3.5rem` | `3.5rem` | mobile nav + safe area aware |

**Source References**

- [globals.css layout vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:94)
- [globals.css app-shell](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:401)
- [globals.css 430 override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:488)
- [globals.css 1440 overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:503)

**Real Use Cases**

- `/watch`, `/read`, dan `/search` mengikuti container-led shell
- mobile shell menambah bottom safe area untuk navigasi bawah

### Catalog Grid

**Spec**

Catalog content memakai grid kartu responsif dengan density variants.

**Anatomy**

| Grid family | Mobile | Tablet | Desktop | Notes |
| --- | --- | --- | --- | --- |
| planning columns | `4` | `8` | `12` | `--grid-columns` |
| default | `2` | `3` | `4 -> 5 wide` | `--grid-card-columns` |
| dense | `2` | `4` | `5 -> 6 wide` | `--grid-card-columns-dense` |
| comfortable | `1 -> 2` | `2` | `3 -> 4 wide` | wide phone uplift folded into mobile |
| card gap | `0.875rem -> 1rem` | `1.125rem` | `1.125rem -> 1.25rem wide` | gap scales with density |

**Source References**

- [globals.css media-grid](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:428)
- [globals.css 430 override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:488)
- [globals.css 1440 layered overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:503)

**Real Use Cases**

- `/watch/movies` dan `/watch/series` mengandalkan default/dense card grids
- `/read/comics` memakai comfortable dan dense behavior untuk discovery stacks

### Rail Grid

**Spec**

Discovery shelves memakai horizontal rail grid yang menghitung lebar kolom berdasarkan `--rail-columns`.

**Anatomy**

| Rail family | Mobile | Tablet | Desktop | Notes |
| --- | --- | --- | --- | --- |
| compact | `2` | `3` | `4 -> 5 wide` | mengikuti default card columns |
| comfortable | `1 -> 2` | `2` | `3 -> 4 wide` | mengikuti comfortable columns |
| shelf | `1.08 -> 1.28` | `1.8` | `2.35 -> 2.85 wide` | cinematic shelf rail |
| scroll behavior | `x proximity` | `x proximity` | still horizontal, often enough width to feel static | rail remains same primitive |

**Source References**

- [globals.css media-rail](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:442)
- [globals.css 430 shelf override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:498)
- [globals.css 1440 shelf overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:516)

**Real Use Cases**

- home shelves and continue rows
- horizontal discovery modules
- watch/read discovery rails that prioritize swipe/trackpad movement first

## Effective Value Notes

**Spec**

Breakpoint grid sekarang eksplisit: mobile default, mobile-wide `430px`, tablet `768px`, desktop `1024px`, dan wide `1440px`. Nilai lama yang bertumpuk di `1440px` sudah diratakan supaya implementasi bisa dibaca langsung.

**Anatomy**

| State | Trigger | Effective layout intent |
| --- | --- | --- |
| mobile | default | 4 planning columns, 2-up default catalog |
| mobile-wide | `430px` | wider gutters and 2-up comfortable grid |
| tablet | `768px` | 8 planning columns, 3-up default catalog |
| desktop | `1024px` | 12 planning columns, 4-up default catalog |
| wide | `1440px` | 5-up default catalog, 6-up dense catalog |

**Source References**

- [globals.css breakpoint overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css)

**Real Use Cases**

- memahami effective values ini penting sebelum migrasi komponen ke token layout
- contract test menjaga agar breakpoint wide tidak lagi terduplikasi

## Real Use Cases

### Discovery Surfaces

**Spec**

Discovery surfaces memperlihatkan foundation Jawatch paling lengkap: surface, primary emphasis, type hierarchy, density grid, dan cinematic elevation.

**Anatomy**

- elevated glass-like panel
- primary-tinted chip and icon
- adaptive grid or rail
- editorial heading with negative tracking

**Source References**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:22)

**Real Use Cases**

- home lanes
- hub discovery rows
- route-level discovery callouts

### Search Overlay

**Spec**

Search overlay menunjukkan bagaimana raw surfaces, overlay blur, compact poster sizing, and micro type combine di modal-heavy context.

**Anatomy**

- `surface-elevated`
- `surface-1`
- large modal shadow
- border-subtle hierarchy
- compact media card image slots

**Source References**

- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:128)

**Real Use Cases**

- command search
- quick result preview cards
- empty state panel

### Detail Hero

**Spec**

Detail hero adalah contoh surface premium dengan large radius, hard shadow, darkened backdrop, poster framing, and metadata rail.

**Anatomy**

- `radius-2xl`
- `hard-shadow-md`
- poster frame with `Paper tone=muted`
- badge and title stack
- horizontally scrolling metadata chips

**Source References**

- [VideoDetailHeroFrame.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/VideoDetailHeroFrame.tsx:35)

**Real Use Cases**

- movie detail pages
- series detail pages

### Player Controls

**Spec**

Player controls menunjukkan control hit target, overlay blur, compact radii, and focus ring behavior yang harus konsisten.

**Anatomy**

- `44px` icon controls
- `radius-sm`
- blurred overlay surfaces
- accent or domain-colored next action

**Source References**

- [VideoPlayerControls.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/video-player/VideoPlayerControls.tsx:18)

**Real Use Cases**

- episode playback controls
- theater/lights/report controls
