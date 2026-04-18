# Design Doc: Jawatch Watch Stack Performance Refactor

## 1. Objective
Refactor the shared watch stack so the player and watch surfaces are simpler, faster, and harder to break without changing public behavior, route structure, or user-visible IA.

This pass is explicitly:
- performance-first
- behavior-preserving
- shared across watch surfaces, not series-only

## 2. Constraints
- No public IA changes.
- No route changes.
- No copy changes unless a fallback is already part of the approved UX fix.
- No intentional visual redesign.
- Existing behavior for:
  - compact watch order
  - touch-visible player controls
  - deferred ad mounting
  - mirror labeling
  - theater mode
  must remain intact.

## 3. Current Problems

### 3.1 VideoPlayer is overgrown
`src/components/organisms/VideoPlayer.tsx` currently owns:
- native vs iframe rendering
- HLS setup/teardown
- mirror preference persistence
- dead-mirror reporting
- keyboard shortcuts
- control overlay rendering
- mirror panel rendering
- layout class composition

This creates a large client island with too many responsibilities and too many reasons to rerender.

### 3.2 WatchModeSurface mixes policy and rendering
`src/components/organisms/WatchModeSurface.tsx` currently combines:
- watch-mode policy
- navbar/footer visibility side effects
- compact layout ordering
- large conditional render branches

The component is readable today, but it is doing orchestration and view rendering at the same time.

### 3.3 Page-level watch composition is repetitive
Series and movie watch pages repeat the same pattern:
- resolve page data
- derive theme/badges/labels
- compose watch header, stage, body, rail

The shared contract exists, but the composition boundary is still loose, which makes refactors noisy.

### 3.4 Hardening logic is not centralized enough
Some important behavior is already extracted, but not enough:
- mirror labels are shared
- watch-surface layout is shared

Player runtime behavior, media fallback behavior, and control definitions still live too close to JSX.

## 4. Design Principles
- Keep static composition on the server when possible.
- Keep browser-only logic in the smallest possible client boundary.
- Move policy into helpers before moving view code.
- Prefer deterministic helper tests over fragile route-level tests tied to live sources.
- Avoid hidden coupling between player UI state and page composition.

## 5. Proposed Architecture

### 5.1 Shared player modules
Split player responsibilities into focused units:

- `VideoPlayer`
  - thin orchestrator
  - receives props and composes subparts
- `video-player-ui.ts`
  - mirror labels
  - player control descriptors
  - any UI-only normalization
- `video-player-media.ts` or equivalent helper
  - native/HLS/embed capability checks
  - media-mode resolution
- `useVideoPlayerState` or equivalent internal hook
  - internal URL/key/autoplay/dead-mirror/session-reported state
- `useVideoPlayerShortcuts` or equivalent internal hook
  - keyboard bindings only
- `VideoPlayerControls`
  - overlay controls rendering only
- `VideoPlayerMirrorPanel`
  - mirror picker and autoplay toggle rendering only

This keeps the public `VideoPlayer` API stable while reducing the amount of inline stateful logic in the main component.

### 5.2 Shared watch surface policy
`watch-surface.ts` becomes the source of truth for:
- effective mode
- rail visibility
- rail role
- compact section order

`WatchModeSurface.tsx` should only:
- read the shared policy
- apply navbar/footer visibility effects
- render sections in order

No additional layout policy should remain embedded in JSX branches unless it is purely presentational.

### 5.3 Page composition remains server-led
Series/movie watch pages continue to assemble:
- header
- stage
- body
- rail

But the page should avoid absorbing client-only logic. Derived watch data should be prepared before the client boundary whenever possible.

### 5.4 Deferred and non-critical work stays deferred
Keep non-critical work off the critical path:
- ad section remains deferred
- optional player chrome remains lightweight
- avoid new client-side fetches or effects that duplicate server work

## 6. Behavioral Contract
The refactor must preserve the following externally visible behavior:

### 6.1 Player controls
- On touch layouts, player utility controls remain visible and actionable.
- On large layouts, controls may still use hover/focus reveal when not in theater mode.
- Theater toggle remains available on the watch player.

### 6.2 Compact watch flow
- Compact order stays:
  1. player/stage
  2. body/context
  3. rail

### 6.3 Mirror labeling
- Prefer explicit quality labels.
- Else prefer source-derived labels.
- Else fall back to `Mirror N`.

### 6.4 Ad behavior
- Watch extras must not reserve a large empty gap while ad inventory is unresolved.

### 6.5 Route/page behavior
- No canonical route changes.
- No new redirects.
- No new hydration-dependent UX requirements.

## 7. Hardening Requirements

### 7.1 Media fallback
Media mode resolution must be explicit:
- direct media
- HLS media
- iframe/embed
- empty/loading state

Cleanup must be safe when switching URLs or unmounting.

### 7.2 Mirror handling
- preferred mirror persistence must not break controlled mode
- dead mirror reporting must not duplicate active session state incorrectly
- next available mirror fallback must remain deterministic

### 7.3 Layout safety
- watch surface ordering must come from tested helpers
- theater side effects must always reset on unmount

## 8. Verification Strategy

### 8.1 Deterministic tests
Add or extend unit tests for:
- mirror/source label helpers
- watch surface layout policy
- compact section ordering
- media-mode resolution helpers

### 8.2 Required repo verification
- `npm run test:unit`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### 8.3 Optional manual follow-up
Manual browser spot checks remain useful for:
- series episode watch page
- movie watch page
- theatrical mode transitions

But they are not the primary correctness gate for this refactor.

## 9. Non-Goals
- redesigning the watch UI
- changing home IA or vault behavior
- changing shorts behavior
- replacing current data/source adapters
- introducing new analytics or personalization behavior

## 10. Implementation Outline
The implementation should proceed in this order:

1. Extract and test shared player helpers.
2. Split player subviews/hooks while keeping the external API stable.
3. Simplify watch surface rendering around shared ordering helpers.
4. Apply the shared cleanup to series and movie watch compositions.
5. Run full repo verification.

## 11. Success Criteria
The refactor is successful when:
- public behavior is unchanged
- shared watch files are smaller and more focused
- player runtime logic is easier to test without a live source
- no verification regressions appear in unit, typecheck, lint, or build
- future watch-surface work can target helpers/subcomponents instead of a single monolith
