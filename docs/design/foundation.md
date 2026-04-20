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
- `number-based primitives` by `mobile`, `tablet`, and `desktop`

**Anatomy**

- `light`: state saat `:root, html[data-color-mode="light"]` aktif
- `dark`: state saat `html[data-color-mode="dark"]` aktif
- `mobile`: perilaku efektif phone, termasuk uplift lebar `390-430`
- `tablet`: perilaku efektif mulai `768px`
- `desktop`: perilaku efektif `1440px+`

**Source References**

- [globals.css light vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:3)
- [globals.css dark vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:108)
- [globals.css 430 override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:488)
- [globals.css 1440 overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:503)

**Real Use Cases**

- theme toggle menukar state `light/dark`
- shelf density, gutters, dan card counts berubah lintas `mobile/tablet/desktop`

## Raw Color Inventory

### Core Semantic Raw Colors

**Spec**

Tabel ini memetakan semantic raw values yang benar-benar dipakai CSS sekarang. Ini bukan token semantik akhir; ini inventaris material visual mentah yang nanti dipetakan di `tokens.md`.

**Anatomy**

| Raw family | Light source | Dark source | Notes | Real use case |
| --- | --- | --- | --- | --- |
| `background` | `#f5f1ea` | `#090a0d` | page canvas utama | `body`, app shell, page gradients |
| `background-alt` | `#ede4d7` | `#101216` | secondary page tint | page depth and end gradients |
| `foreground` | `#14110f` | `#f3efe8` | primary readable text | body copy, headings, buttons |
| `muted-foreground` | `#61584f` | `#b2aba1` | supportive text | subtitles, helper text, metadata |
| `border-subtle` | `rgba(20,17,15,0.11)` | `rgba(243,239,232,0.12)` | baseline stroke | cards, pills, controls, overlays |
| `border-strong` | `rgba(20,17,15,0.2)` | `rgba(243,239,232,0.22)` | emphasized stroke | hover/focus-border escalation |
| `surface-1` | `rgba(255,252,247,0.74)` | `rgba(17,20,26,0.76)` | soft panel surface | muted cards, controls, search results |
| `surface-2` | `#ece4d8` | `#141924` | solid panel base | `Paper tone=solid`, secondary fields |
| `surface-elevated` | `rgba(255,255,255,0.9)` | `rgba(22,26,34,0.88)` | brighter elevated panel | elevated cards, modal inner frame |
| `surface-overlay` | `rgba(248,243,236,0.82)` | `rgba(13,15,19,0.82)` | glass overlay base | `liquid-glass`, overlay chrome |
| `accent` | `#b68b52` | `#BDFF00` | primary emphasis hue | CTA, focus halo, kicker tint |
| `accent-soft` | `rgba(182,139,82,0.16)` | `rgba(209,168,111,0.16)` | ambient accent wash | glows, subdued emphasis panels |
| `accent-strong` | `#8a6537` | `#f1c98d` | concentrated accent edge | CTA gradients, hover emphasis |
| `accent-contrast` | `#fff8ef` | `#140f09` | text on accent | primary buttons |
| `selection` | `rgba(182,139,82,0.28)` | `rgba(209,168,111,0.24)` | text selection fill | browser-native selection |
| `page-glow-top` | `rgba(255,255,255,0.78)` | `rgba(255,255,255,0.07)` | upper canvas glow | body background mix |
| `page-glow-side` | `rgba(182,139,82,0.16)` | `rgba(209,168,111,0.16)` | side atmospheric glow | body background mix |
| `poster-missing-image` | `/poster-missing-light.png` | `/poster-missing-dark.png` | image fallback asset | poster placeholder surfaces |

**Source References**

- [globals.css root variables](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:3)
- [globals.css dark variables](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:108)
- [globals.css @theme inline](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:181)

**Real Use Cases**

- [SearchModal.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/SearchModal.tsx:128) memakai `surface-elevated`, `surface-1`, dan `border-subtle` untuk overlay search
- [ThemeToggle.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/ThemeToggle.tsx:25) memakai `surface-1`, `surface-elevated`, `border-subtle`, `foreground`, dan `background`
- [Paper.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Paper.tsx:14) merutekan `surface-1`, `surface-2`, dan `border-subtle` ke paper tones

### Domain Theme Raw Values

**Spec**

Jawatch punya family tema per domain yang diroute lewat `THEME_CONFIG` di `src/lib/utils.ts`. Family ini dipakai sebagai tint domain pada card, badge, glow, border, dan icon chips.

**Anatomy**

| Theme family | Light fill | Dark fill | Light text | Dark text | Light border | Dark border | Light surface | Dark surface | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `default` | `#1f1b17` | `#f0e8dc` | `#665b4f` | `#dad0c1` | `rgba(31,27,23,0.18)` | `rgba(240,232,220,0.18)` | `rgba(31,27,23,0.08)` | `rgba(240,232,220,0.08)` | neutral editorial fallback |
| `anime` | `#9e637f` | `#c889aa` | `#8b546f` | `#f3cad8` | `rgba(158,99,127,0.22)` | `rgba(200,137,170,0.26)` | `rgba(158,99,127,0.10)` | `rgba(200,137,170,0.14)` | rose-magenta family |
| `manga` | `#aa7842` | `#c79a63` | `#90663b` | `#f2d7ba` | `rgba(170,120,66,0.23)` | `rgba(199,154,99,0.26)` | `rgba(170,120,66,0.10)` | `rgba(199,154,99,0.14)` | amber paper tone |
| `donghua` | `#a85f4b` | `#cd8b73` | `#934f3d` | `#f4d4c8` | `rgba(168,95,75,0.23)` | `rgba(205,139,115,0.26)` | `rgba(168,95,75,0.10)` | `rgba(205,139,115,0.14)` | coral terracotta tone |
| `movie` | `#b68b52` | `#d1a86f` | `#8f6937` | `#efd5b0` | `rgba(182,139,82,0.24)` | `rgba(209,168,111,0.28)` | `rgba(182,139,82,0.10)` | `rgba(209,168,111,0.14)` | gold cinema tone |
| `drama` | `#8c5f7c` | `#b88aa8` | `#78506a` | `#e8cade` | `rgba(140,95,124,0.22)` | `rgba(184,138,168,0.26)` | `rgba(140,95,124,0.10)` | `rgba(184,138,168,0.14)` | plum-lilac tone |
| `novel` | `#83684d` | `#b29a79` | `#70573f` | `#dfd0bc` | `rgba(131,104,77,0.22)` | `rgba(178,154,121,0.26)` | `rgba(131,104,77,0.10)` | `rgba(178,154,121,0.14)` | sepia editorial tone |

**Source References**

- [globals.css theme vars](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:23)
- [utils.ts THEME_CONFIG](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/lib/utils.ts:57)

**Real Use Cases**

- [HubLaneCard.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/molecules/HubLaneCard.tsx:23) memakai `config.primary`, `config.border`, `config.bg`, `config.text`, `config.contrast`
- [Badge.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/atoms/Badge.tsx:16) merutekan variant domain langsung ke theme families
- [VideoPlayerControls.tsx](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/components/organisms/video-player/VideoPlayerControls.tsx:44) memakai theme variant untuk tombol `next`

### Generated OKLCH Hue Ladders

**Spec**

Bagian ini menyediakan ladder `50-950` dalam format `oklch(...)` untuk family warna inti. Ladder ini adalah output dokumentasi berbasis warna sumber saat ini, bukan CSS variables yang sudah dikirim ke runtime.

**Anatomy**

#### Warm Neutral Light

Base source: `background #f5f1ea`

`50 oklch(0.985 0.011 81.8)`  
`100 oklch(0.955 0.011 81.8)`  
`200 oklch(0.905 0.011 81.8)`  
`300 oklch(0.835 0.011 81.8)`  
`400 oklch(0.740 0.011 81.8)`  
`500 oklch(0.959 0.009 81.8)`  
`600 oklch(0.859 0.009 81.8)`  
`700 oklch(0.779 0.009 81.8)`  
`800 oklch(0.679 0.009 81.8)`  
`900 oklch(0.579 0.009 81.8)`  
`950 oklch(0.499 0.009 81.8)`

#### Obsidian Neutral Dark

Base source: `backgroundDark #090a0d`

`50 oklch(0.985 0.009 270.5)`  
`100 oklch(0.955 0.009 270.5)`  
`200 oklch(0.905 0.009 270.5)`  
`300 oklch(0.835 0.009 270.5)`  
`400 oklch(0.740 0.009 270.5)`  
`500 oklch(0.145 0.007 270.5)`  
`600 oklch(0.220 0.007 270.5)`  
`700 oklch(0.180 0.007 270.5)`  
`800 oklch(0.140 0.007 270.5)`  
`900 oklch(0.110 0.007 270.5)`  
`950 oklch(0.080 0.007 270.5)`

#### Gold Accent

Light base: `accent #b68b52`  
Dark base: `movieDark #d1a86f`

Light ladder:

`50 oklch(0.985 0.026 73.0)`  
`100 oklch(0.955 0.034 73.0)`  
`200 oklch(0.905 0.049 73.0)`  
`300 oklch(0.835 0.065 73.0)`  
`400 oklch(0.740 0.080 73.0)`  
`500 oklch(0.666 0.091 73.0)`  
`600 oklch(0.566 0.081 73.0)`  
`700 oklch(0.486 0.071 73.0)`  
`800 oklch(0.386 0.061 73.0)`  
`900 oklch(0.286 0.051 73.0)`  
`950 oklch(0.206 0.046 73.0)`

Dark ladder:

`50 oklch(0.985 0.025 74.9)`  
`100 oklch(0.955 0.033 74.9)`  
`200 oklch(0.905 0.048 74.9)`  
`300 oklch(0.835 0.063 74.9)`  
`400 oklch(0.740 0.078 74.9)`  
`500 oklch(0.756 0.088 74.9)`  
`600 oklch(0.656 0.079 74.9)`  
`700 oklch(0.576 0.069 74.9)`  
`800 oklch(0.476 0.059 74.9)`  
`900 oklch(0.376 0.049 74.9)`  
`950 oklch(0.296 0.045 74.9)`

#### Electric Lime Accent

Base source: `accentDark #BDFF00`

`50 oklch(0.985 0.067 126.3)`  
`100 oklch(0.955 0.087 126.3)`  
`200 oklch(0.905 0.127 126.3)`  
`300 oklch(0.835 0.167 126.3)`  
`400 oklch(0.740 0.190 126.3)`  
`500 oklch(0.921 0.190 126.3)`  
`600 oklch(0.821 0.190 126.3)`  
`700 oklch(0.741 0.184 126.3)`  
`800 oklch(0.641 0.158 126.3)`  
`900 oklch(0.541 0.132 126.3)`  
`950 oklch(0.461 0.119 126.3)`

#### Default Editorial Ink

Light base: `default #1f1b17`  
Dark base: `defaultDark #f0e8dc`

Light ladder:

`50 oklch(0.985 0.011 67.3)`  
`100 oklch(0.955 0.011 67.3)`  
`200 oklch(0.905 0.011 67.3)`  
`300 oklch(0.835 0.011 67.3)`  
`400 oklch(0.740 0.011 67.3)`  
`500 oklch(0.225 0.009 67.3)`  
`600 oklch(0.220 0.009 67.3)`  
`700 oklch(0.180 0.009 67.3)`  
`800 oklch(0.140 0.009 67.3)`  
`900 oklch(0.110 0.009 67.3)`  
`950 oklch(0.080 0.009 67.3)`

Dark ladder:

`50 oklch(0.985 0.017 78.2)`  
`100 oklch(0.955 0.017 78.2)`  
`200 oklch(0.905 0.017 78.2)`  
`300 oklch(0.835 0.017 78.2)`  
`400 oklch(0.740 0.017 78.2)`  
`500 oklch(0.934 0.013 78.2)`  
`600 oklch(0.834 0.013 78.2)`  
`700 oklch(0.754 0.013 78.2)`  
`800 oklch(0.654 0.013 78.2)`  
`900 oklch(0.554 0.013 78.2)`  
`950 oklch(0.474 0.013 78.2)`

#### Anime Rose

Light base: `anime #9e637f`  
Dark base: `animeDark #c889aa`

Light ladder:

`50 oklch(0.985 0.024 350.2)`  
`100 oklch(0.955 0.031 350.2)`  
`200 oklch(0.905 0.046 350.2)`  
`300 oklch(0.835 0.060 350.2)`  
`400 oklch(0.740 0.074 350.2)`  
`500 oklch(0.573 0.085 350.2)`  
`600 oklch(0.473 0.075 350.2)`  
`700 oklch(0.393 0.066 350.2)`  
`800 oklch(0.293 0.057 350.2)`  
`900 oklch(0.193 0.047 350.2)`  
`950 oklch(0.113 0.043 350.2)`

Dark ladder:

`50 oklch(0.985 0.025 346.9)`  
`100 oklch(0.955 0.032 346.9)`  
`200 oklch(0.905 0.047 346.9)`  
`300 oklch(0.835 0.062 346.9)`  
`400 oklch(0.740 0.077 346.9)`  
`500 oklch(0.703 0.088 346.9)`  
`600 oklch(0.603 0.078 346.9)`  
`700 oklch(0.523 0.068 346.9)`  
`800 oklch(0.423 0.059 346.9)`  
`900 oklch(0.323 0.049 346.9)`  
`950 oklch(0.243 0.044 346.9)`

#### Manga Amber

Light base: `manga #aa7842`  
Dark base: `mangaDark #c79a63`

Light ladder:

`50 oklch(0.985 0.027 66.6)`  
`100 oklch(0.955 0.035 66.6)`  
`200 oklch(0.905 0.051 66.6)`  
`300 oklch(0.835 0.067 66.6)`  
`400 oklch(0.740 0.083 66.6)`  
`500 oklch(0.612 0.094 66.6)`  
`600 oklch(0.512 0.084 66.6)`  
`700 oklch(0.432 0.074 66.6)`  
`800 oklch(0.332 0.063 66.6)`  
`900 oklch(0.232 0.053 66.6)`  
`950 oklch(0.152 0.048 66.6)`

Dark ladder:

`50 oklch(0.985 0.026 71.2)`  
`100 oklch(0.955 0.033 71.2)`  
`200 oklch(0.905 0.049 71.2)`  
`300 oklch(0.835 0.064 71.2)`  
`400 oklch(0.740 0.079 71.2)`  
`500 oklch(0.716 0.090 71.2)`  
`600 oklch(0.616 0.080 71.2)`  
`700 oklch(0.536 0.070 71.2)`  
`800 oklch(0.436 0.060 71.2)`  
`900 oklch(0.336 0.050 71.2)`  
`950 oklch(0.256 0.045 71.2)`

#### Donghua Coral

Light base: `donghua #a85f4b`  
Dark base: `donghuaDark #cd8b73`

Light ladder:

`50 oklch(0.985 0.029 36.2)`  
`100 oklch(0.955 0.037 36.2)`  
`200 oklch(0.905 0.054 36.2)`  
`300 oklch(0.835 0.071 36.2)`  
`400 oklch(0.740 0.088 36.2)`  
`500 oklch(0.565 0.100 36.2)`  
`600 oklch(0.465 0.089 36.2)`  
`700 oklch(0.385 0.078 36.2)`  
`800 oklch(0.285 0.067 36.2)`  
`900 oklch(0.185 0.056 36.2)`  
`950 oklch(0.105 0.051 36.2)`

Dark ladder:

`50 oklch(0.985 0.025 40.8)`  
`100 oklch(0.955 0.033 40.8)`  
`200 oklch(0.905 0.048 40.8)`  
`300 oklch(0.835 0.063 40.8)`  
`400 oklch(0.740 0.078 40.8)`  
`500 oklch(0.697 0.088 40.8)`  
`600 oklch(0.597 0.079 40.8)`  
`700 oklch(0.517 0.069 40.8)`  
`800 oklch(0.417 0.059 40.8)`  
`900 oklch(0.317 0.049 40.8)`  
`950 oklch(0.237 0.045 40.8)`

#### Drama Plum

Light base: `drama #8c5f7c`  
Dark base: `dramaDark #b88aa8`

Light ladder:

`50 oklch(0.985 0.020 340.8)`  
`100 oklch(0.955 0.026 340.8)`  
`200 oklch(0.905 0.038 340.8)`  
`300 oklch(0.835 0.050 340.8)`  
`400 oklch(0.740 0.063 340.8)`  
`500 oklch(0.543 0.071 340.8)`  
`600 oklch(0.443 0.063 340.8)`  
`700 oklch(0.363 0.055 340.8)`  
`800 oklch(0.263 0.048 340.8)`  
`900 oklch(0.163 0.040 340.8)`  
`950 oklch(0.083 0.036 340.8)`

Dark ladder:

`50 oklch(0.985 0.020 339.9)`  
`100 oklch(0.955 0.026 339.9)`  
`200 oklch(0.905 0.037 339.9)`  
`300 oklch(0.835 0.049 339.9)`  
`400 oklch(0.740 0.061 339.9)`  
`500 oklch(0.687 0.069 339.9)`  
`600 oklch(0.587 0.061 339.9)`  
`700 oklch(0.507 0.054 339.9)`  
`800 oklch(0.407 0.046 339.9)`  
`900 oklch(0.307 0.039 339.9)`  
`950 oklch(0.227 0.035 339.9)`

#### Novel Sepia

Light base: `novel #83684d`  
Dark base: `novelDark #b29a79`

Light ladder:

`50 oklch(0.985 0.015 66.3)`  
`100 oklch(0.955 0.019 66.3)`  
`200 oklch(0.905 0.028 66.3)`  
`300 oklch(0.835 0.037 66.3)`  
`400 oklch(0.740 0.046 66.3)`  
`500 oklch(0.537 0.053 66.3)`  
`600 oklch(0.437 0.047 66.3)`  
`700 oklch(0.357 0.041 66.3)`  
`800 oklch(0.257 0.035 66.3)`  
`900 oklch(0.157 0.029 66.3)`  
`950 oklch(0.080 0.027 66.3)`

Dark ladder:

`50 oklch(0.985 0.015 75.5)`  
`100 oklch(0.955 0.020 75.5)`  
`200 oklch(0.905 0.029 75.5)`  
`300 oklch(0.835 0.038 75.5)`  
`400 oklch(0.740 0.047 75.5)`  
`500 oklch(0.699 0.054 75.5)`  
`600 oklch(0.599 0.048 75.5)`  
`700 oklch(0.519 0.042 75.5)`  
`800 oklch(0.419 0.036 75.5)`  
`900 oklch(0.319 0.030 75.5)`  
`950 oklch(0.239 0.027 75.5)`

**Source References**

- [globals.css core colors](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:5)
- [globals.css domain colors](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:23)

**Real Use Cases**

- gold accent family menggerakkan CTA dan movie tint
- anime rose, manga amber, donghua coral, drama plum, dan novel sepia dipakai sebagai domain-coded tint
- warm neutral dan obsidian neutral mengunci mode terang/gelap tanpa mengganti struktur layout

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
| `type-body-large` | `16px / 1.72 / 500` | `18.43px / 1.72 / 500` | `18.88px / 1.72 / 500` | `clamp(1rem, 2.4vw, 1.18rem)` | lead text |
| `type-section-title` | `27.2px / 1 / -0.042em / 700` | `38.4px / 1 / -0.042em / 700` | `48px / 1 / -0.042em / 700` | section headline utility | section headers |
| `type-display` | `44.8px / 0.92 / -0.055em / 700` | `61.44px / 0.92 / -0.055em / 700` | `92.8px / 0.92 / -0.055em / 700` | hero display utility | premium hero statements |
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
| `--space-xs` | `4px` | `4px` | `4px` | tight inline gaps | micro gaps |
| `--space-sm` | `8px` | `8px` | `8px` | inline/action spacing | chip rows |
| `--space-md` | `14px` | `14px` | `14px` | compact control/panel spacing | control interiors |
| `--space-lg` | `20px` | `20px` | `20px` | panel band | large card padding |
| `--space-xl` | `28px` | `28px` | `28px` | roomy component gap | hero/control separation |
| `--space-2xl` | `40px` | `40px` | `40px` | section margin seed | big stack separation |
| `--space-3xl` | `64px` | `64px` | `64px` | hero band | large editorial break |
| Button default height | `44px` | `44px` | `44px` | `h-11` | primary action |
| Button small height | `36px` | `36px` | `36px` | `h-9` | compact pills |
| Button large height | `48px` | `56px` | `56px` | `h-12 md:h-14` | hero CTA |
| Button icon height | `44px` | `44px` | `44px` | `h-11 w-11` | player/search close |
| Input height | `44px` | `44px` | `44px` | `h-11` | search/auth/filter |
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
| `layout-max` | `76rem` | `76rem` | `76rem` | default content max width |
| `layout-max-wide` | `88rem` | `88rem` | `88rem` | wide discovery/detail shell |
| `layout-max-immersive` | `96rem` | `96rem` | `96rem` | immersive watch-ready cap |
| `layout-pad` | `1rem -> 1.25rem` | `1.25rem` | `2rem` effective | wide phone uplift folded into mobile |
| `section-gap` | `1.5rem` | `1.5rem` | `2rem` effective | default vertical stack gap |
| `section-gap-wide` | `2.5rem` | `2.5rem` | `3rem` effective | larger stack gap |
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
| default | `2` | `2` | `5` effective | `--card-columns` |
| dense | `2` | `2` | `6` effective | `--card-columns-dense` |
| comfortable | `1 -> 2` | `2` | `4` effective | wide phone uplift folded into mobile |
| card gap | `0.875rem -> 1rem` | `1rem` | `1.25rem` effective | gap scales with density |

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
| compact | `2` | `2` | `5` effective | mengikuti default card columns |
| comfortable | `1 -> 2` | `2` | `4` effective | mengikuti comfortable columns |
| shelf | `1.08 -> 1.28` | `1.28` | `2.85` effective | cinematic shelf rail |
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

Nilai desktop di `globals.css` tidak bisa dibaca naif dari satu blok media query saja. Dokumen ini selalu memisahkan `raw specified values` dan `effective desktop values`.

**Anatomy**

### Layered desktop overrides at `1440px`

Raw specified order:

1. first desktop pass
   - `layout-pad: 1.5rem`
   - `section-gap: 1.75rem`
   - `section-gap-wide: 2.75rem`
   - `card-columns: 3`
   - `card-columns-dense: 4`
   - `card-columns-comfortable: 2`
   - `card-gap: 1.125rem`
   - shelf `1.8`
2. second desktop pass
   - `layout-pad: 2rem`
   - `section-gap: 2rem`
   - `section-gap-wide: 3rem`
   - `card-columns: 4`
   - `card-columns-dense: 5`
   - `card-columns-comfortable: 3`
   - shelf `2.35`
3. third desktop pass
   - `card-columns: 5`
   - `card-columns-dense: 6`
   - `card-columns-comfortable: 4`
   - `card-gap: 1.25rem`
   - shelf `2.85`

Effective desktop end state:

- `layout-pad: 2rem`
- `section-gap: 2rem`
- `section-gap-wide: 3rem`
- `card-columns: 5`
- `card-columns-dense: 6`
- `card-columns-comfortable: 4`
- `card-gap: 1.25rem`
- shelf `2.85`

### Tablet caveat

Tidak ada blok `768px` khusus untuk grid density. Akibatnya:
- tablet mewarisi hasil efektif dari mobile-wide `430px` untuk banyak primitive layout
- satu-satunya perubahan `768px` yang eksplisit di shell dasar saat ini adalah pengurangan bottom padding `app-shell`

**Source References**

- [globals.css tablet shell override](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:406)
- [globals.css layered desktop overrides](/home/dwizzy/workspace/projects/dwizzyOS/jawatch/src/app/globals.css:503)

**Real Use Cases**

- memahami effective values ini penting sebelum menulis token layout dan breakpoint behavior
- tanpa catatan ini, dokumentasi akan salah membaca grid desktop Jawatch

## Real Use Cases

### Discovery Surfaces

**Spec**

Discovery surfaces memperlihatkan foundation Jawatch paling lengkap: surface, tint domain, type hierarchy, density grid, dan cinematic elevation.

**Anatomy**

- elevated glass-like panel
- domain tint chip and icon
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
