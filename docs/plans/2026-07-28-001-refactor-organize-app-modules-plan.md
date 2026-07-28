---
title: Organize App Modules - Plan
date: 2026-07-28
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
type: refactor
---

# Organize App Modules - Plan

## Goal Capsule

**Objective.** Split the monolithic landing-page component into separate modules so editing one section (or shared chrome) does not require loading the entire site into context, while establishing a lasting folder convention for future marketing pages.

**Product authority.** Developer maintainability of the Rinse marketing site; visual and behavioral parity with the current site is non-negotiable.

**Open blockers.** None.

## Product Contract

### Summary

Reorganize the Replit-generated single-file landing page into page sections plus shared chrome (nav, footer, demo modal, motion helpers), with mockups nested under their parent sections, so new marketing pages can follow the same composition pattern and AI/human edits stay scoped to one module.

### Problem Frame

`src/app/App.tsx` holds ~6,300 lines of sections, mockups, and chrome. Every feature change forces scanning the whole file, burning context/credits. Docs already describe page sections under `components/`, but they were never extracted.

### Primary Actor

The developer (and coding agents) editing marketing content and adding pages.

### Requirements

- R1. Every major home-page section is editable in its own module without opening unrelated sections.
- R2. Shared chrome (nav, footer, demo modal) and shared motion helpers live in a clear shared place reusable by new marketing pages.
- R3. Interactive mockups/graphics stay nested with their parent section for this pass — not a separate top-level mockup tree.
- R4. Existing routes and user-visible behavior remain unchanged (home, features, CTAs, demo modal, scroll nav).
- R5. Folder conventions support adding further marketing pages that compose the same shared chrome + section pattern.

### Key Decisions

- KD1. Structure-first over fastest rough split. (session-settled: user-directed — chosen over editability-first: lasting layout for future marketing pages)
- KD2. Scope depth is sections + shared chrome, not full decomposition of every graphic into its own file. (session-settled: user-directed — chosen over page-sections-only and full decomposition)
- KD3. Growth target is more marketing pages with similar section composition, not product/app surfaces. (session-settled: user-directed — chosen over product/app surfaces and “not sure yet”)

### Scope Boundaries

**In scope**
- Extract page sections and shared chrome/helpers from the monolith
- Slim root app to routing and page composition
- Preserve visual/behavioral parity

**Out of scope / deferred**
- Rewriting UI onto unused shadcn primitives
- Full decomposition of every mockup/graphic into standalone files
- New marketing pages (About, Blog, Legal) — convention only; content later
- Product/app authenticated surfaces

### Success Criteria

- Changing one section typically requires opening that section module (+ shared deps), not the full former monolith
- Site builds and matches prior routes/behavior
- A new marketing page can import shared chrome and compose sections without reinventing layout

### Assumptions

- A1. Unused-looking in-file components still move with their natural parent rather than being deleted in this pass
- A2. Exact folder names are a planning/implementation detail as long as R1–R5 hold
