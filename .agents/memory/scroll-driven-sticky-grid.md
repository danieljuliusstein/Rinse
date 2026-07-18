---
name: Scroll-driven sticky two-column sections (non-pinning)
description: How to build an Attio-style sticky left-nav + sticky right-canvas section whose active tab is driven by scroll fraction, without any scroll-jacking/pinning.
---

Pattern: a `grid grid-cols-2` container with **no** explicit row content height on
either side needs an explicit `minHeight` (e.g. `230vh`) set on the grid container
itself. CSS Grid's default `align-content: normal` behaves like `stretch` for a
single implicit row, so that minHeight becomes the row track height, giving both
`sticky top-*` children real scroll distance to stick across. Without this, sticky
children with only short, fixed-height content (cards, canvases) collapse the row
to content height and never appear to "stick" — they just sit still because
there's no extra scroll distance in their containing block.

To drive an active-step index purely off scroll position (no locking): use
`useScroll({ target: containerRef, offset: ["start end", "end start"] })` +
`useMotionValueEvent(scrollYProgress, "change", ...)`, clamp to [0,1], and divide
into N equal brackets via `Math.floor(progress * N)`. The page always scrolls
natively; this only *reads* scroll position to swap content (e.g. remount a
canvas via `key={activeStep}` to replay draw-in animations).

**Why:** building an "Interactive Node Canvas" / scroll-linked tab section for a
landing page; sticky panes appeared statically stacked (not sticking) until the
container was given an explicit tall minHeight.

**How to apply:** any future scroll-linked sticky-columns section (tab reveals,
step-by-step feature showcases) — check the grid container has a tall minHeight,
not just the children being `sticky`.
