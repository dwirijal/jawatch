# Episode Layout Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static TSX layout draft for the episode page without affecting runtime.

**Architecture:** Create one standalone draft component next to the episode route. Keep everything inline and static so the file is easy to edit visually and impossible to confuse with production code.

**Tech Stack:** Next.js App Router codebase, React TSX, Tailwind CSS.

---

### Task 1: Add Draft File

**Files:**
- Create: `src/app/anime/episode/[slug]/EpisodeLayoutDraft.tsx`

- [ ] Build a static watch-page layout with left content column and right playlist rail.
- [ ] Keep the file free of app-specific reusable components.
- [ ] Use placeholder media, text, and buttons only.

### Task 2: Verify Isolation

**Files:**
- Verify: `src/app/anime/episode/[slug]/EpisodeLayoutDraft.tsx`

- [ ] Confirm the draft file is not imported by the live route.
- [ ] Keep the file compile-safe TypeScript/TSX.
