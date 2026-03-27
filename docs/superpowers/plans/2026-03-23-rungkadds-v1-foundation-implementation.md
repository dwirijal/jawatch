# rungkadDS V1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `rungkadDS` as a monorepo that ships framework-agnostic design tokens, core layout/card contracts, and docs for the base foundation.

**Architecture:** `packages/tokens` is the canonical W3C token source and generates JSON, CSS variables, and TypeScript types. `packages/core` consumes generated artifacts to define layout and generic card contracts. `apps/docs` renders those artifacts and contracts as the authoritative system reference.

**Tech Stack:** pnpm workspace, Turborepo, TypeScript, plain CSS/custom properties, docs app, W3C design tokens JSON.

---

### Task 1: Create The `rungkadDS` Monorepo Skeleton

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/package.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/pnpm-workspace.yaml`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/turbo.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/tsconfig.base.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/.gitignore`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/README.md`

- [ ] **Step 1: Create the repo directory and base folders**

Run:

```bash
mkdir -p /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
mkdir -p /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages
mkdir -p /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps
```

- [ ] **Step 2: Add workspace manifest and root scripts**

Define:

- workspace packages for `packages/*` and `apps/*`
- root scripts for `build`, `lint`, `typecheck`, and `dev`

- [ ] **Step 3: Add Turborepo pipeline**

Define tasks:

- `build`
- `lint`
- `typecheck`
- `dev`

- [ ] **Step 4: Add shared TypeScript base config**

Include strict settings and path assumptions suitable for package-based builds.

- [ ] **Step 5: Add `.gitignore` and root README**

Include:

- `node_modules`
- build outputs
- docs app cache
- generated token outputs if they should be rebuilt rather than hand-edited

- [ ] **Step 6: Verify workspace boots**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
pnpm install
pnpm -r lint
```

Expected:

- install completes
- empty or placeholder lint/typecheck commands run without breaking

### Task 2: Create `packages/tokens`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/package.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/tsconfig.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/colors.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/spacing.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/radius.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/shadow.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/typography.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/motion.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/breakpoints.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/base/layout.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/src/index.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/scripts/build-tokens.mjs`

- [ ] **Step 1: Create package manifest and TS config**

Add scripts:

- `build`
- `typecheck`
- `lint`

- [ ] **Step 2: Author initial W3C token files**

Include base token domains:

- colors
- spacing
- radius
- shadow
- typography
- motion
- breakpoints
- layout

- [ ] **Step 3: Add token entrypoint**

Expose source token references and generated artifact types cleanly.

- [ ] **Step 4: Implement token build script**

Script responsibilities:

- read all token JSON files
- merge into one canonical token object
- emit `dist/tokens.json`
- emit `dist/variables.css`
- emit `dist/index.d.ts`

- [ ] **Step 5: Encode layout recipe tokens**

Include recipe-friendly values for:

- container widths
- media grid breakpoints
- spacing relationships
- aspect-ratio presets

- [ ] **Step 6: Run token build**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
pnpm --filter @rungkadds/tokens build
```

Expected:

- `packages/tokens/dist/tokens.json`
- `packages/tokens/dist/variables.css`
- `packages/tokens/dist/index.d.ts`

### Task 3: Define `packages/core`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/package.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/tsconfig.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/index.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/layout/recipes.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/layout/contracts.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/card/anatomy.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/card/variants.ts`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/card/rules.ts`

- [ ] **Step 1: Create package manifest and wiring**

Set dependency on `@rungkadds/tokens`.

- [ ] **Step 2: Implement layout contracts**

Define contracts for:

- `Container`
- `Grid`
- `Stack`
- `Inline`
- `Cluster`
- `AspectRatio`

- [ ] **Step 3: Implement layout recipes**

Lock the first recipe:

- `media-grid`
  - mobile `2`
  - tablet `4`
  - desktop `6`

- [ ] **Step 4: Implement generic card anatomy**

Define exported constants and typed structures for:

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

- [ ] **Step 5: Implement card variants and usage rules**

Define:

- orientation
- density
- emphasis
- media ratio

Rules must explicitly prohibit fixed-width card wrappers for grid-governed media surfaces.

- [ ] **Step 6: Typecheck the core package**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
pnpm --filter @rungkadds/core typecheck
```

Expected:

- typecheck passes

### Task 4: Create `apps/docs`

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/package.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/tsconfig.json`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/next.config.mjs`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/src/app/layout.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/src/app/page.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/src/app/tokens/page.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/src/app/layout-recipes/page.tsx`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/apps/docs/src/app/cards/page.tsx`

- [ ] **Step 1: Scaffold docs app**

Set package dependencies on `@rungkadds/tokens` and `@rungkadds/core`.

- [ ] **Step 2: Add docs homepage**

Explain:

- what `rungkadDS` is
- package boundaries
- v1 scope

- [ ] **Step 3: Add token reference pages**

Render:

- token tables
- variable names
- grouped categories

- [ ] **Step 4: Add layout recipe docs**

Document:

- `media-grid`
- `Container`
- `Grid`
- `AspectRatio`
- responsive `2/4/6` rationale

- [ ] **Step 5: Add generic card contract docs**

Document:

- anatomy
- variants
- density
- emphasis
- slot descriptions
- responsive rules

- [ ] **Step 6: Run docs app locally**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
pnpm --filter @rungkadds/docs dev
```

Expected:

- docs app boots
- token and contract pages render

### Task 5: Audit Existing Systems For Migration Inputs

**Files:**
- Read: `/home/dwizzy/workspace/projects/dwizzyOS/designsystems.md`
- Read: `/home/dwizzy/workspace/projects/dwizzyOS/Dwizzy-Design-Systems/**`
- Read: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/src/components/**`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/docs/migration-audit.md`

- [ ] **Step 1: Audit legacy design system package contents**

Capture:

- useful token candidates
- useful package structure ideas
- components that are too app-specific to migrate directly

- [ ] **Step 2: Audit current `dwizzyWEEB` layout/card patterns**

Capture:

- spacing/radius/typography patterns in active use
- fixed-width anti-patterns
- app-specific wrappers that should stay out of `core`

- [ ] **Step 3: Write migration audit**

Split findings into:

- promote to `tokens`
- promote to `core`
- defer to future adapter
- keep app-specific

- [ ] **Step 4: Verify audit is actionable**

Review the audit and ensure every migrated item has a clear target package.

### Task 6: Add Build And Validation Coverage

**Files:**
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/eslint.config.mjs`
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/tokens/scripts/build-tokens.test.mjs` or equivalent
- Create: `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS/packages/core/src/**/*.test.ts` if test runner is introduced
- Modify: root scripts as needed

- [ ] **Step 1: Add lint configuration**

Ensure the monorepo can lint all packages consistently.

- [ ] **Step 2: Add token build smoke test**

Verify:

- merged token output exists
- CSS variable output exists
- TypeScript definition output exists

- [ ] **Step 3: Add core contract sanity tests or validation script**

Verify:

- `media-grid` recipe resolves to `2/4/6`
- card anatomy exports expected slots
- variant enums remain stable

- [ ] **Step 4: Run full verification**

Run:

```bash
cd /home/dwizzy/workspace/projects/dwizzyOS/rungkadDS
pnpm lint
pnpm build
pnpm typecheck
```

Expected:

- all packages and docs app pass

### Task 7: Prepare Execution Handoff

**Files:**
- Review: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/specs/2026-03-23-rungkadds-v1-foundation-design.md`
- Review: `/home/dwizzy/workspace/projects/dwizzyOS/dwizzyWEEB/docs/superpowers/plans/2026-03-23-rungkadds-v1-foundation-implementation.md`

- [ ] **Step 1: Confirm spec and plan agree**

Check:

- package boundaries
- v1 scope
- no runtime adapter leakage

- [ ] **Step 2: Confirm repo target exists or will be created**

Current target:

- `/home/dwizzy/workspace/projects/dwizzyOS/rungkadDS`

- [ ] **Step 3: Choose execution mode**

Options:

- subagent-driven execution
- inline execution

- [ ] **Step 4: Begin repo scaffolding only after explicit go-ahead**

No implementation should start before the human confirms execution.
