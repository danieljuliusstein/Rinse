# Setup intro carousel — visual handoff for Cursor

Use this doc when implementing or polishing the intro slideshow (`SetupIntroCarousel`). **Cursor will not have access to Invoice Fly reference frames** — everything needed is below.

**Mockup:** `design-references/rinse-setup-intro-slide1-mockup.png` (slide 1 target state)

---

## What Invoice Fly actually does (clarification)

**Important:** ScreenDesigns replay frames are **static WebP screenshots**. IF’s hero region plays **looping muted video** — it reads as a still (or occasionally dark) in frame exports. **Do not infer “static photo” from the reference frames alone.**

People often mix up two different IF screens:

| Screen | IF frames | What it is | Hero media |
|--------|-----------|------------|------------|
| **Welcome** | `274878`–`274879` | Light split: hero ~42vh + white body + one “Get started” CTA | **Looping video** (looks like lifestyle still in captures) |
| **Intro value prop** | `274880`–`274883` | **3-slide carousel**: unique hero per slide + **dark bottom panel** + Continue | **Looping video per slide** (or one reel — either way, motion in hero, not a slideshow of screenshots) |

The **feel** is: cinematic hero motion on top, copy + CTA on a dark (carousel) or light (welcome) panel below — **not** a traditional image slideshow.

**Rinse today:** Wave 3 shipped a 3-slide **copy** carousel at `/intro` with `SetupHeroBand` (image-only). Without Wave 15 assets, the hero is hidden → **full dark panel** → “black screen.”

---

## Recommended product direction (Rinse has no video yet)

You can match IF’s **layout and energy** without blocking on footage.

### Option A — Ship now (recommended)

1. **Poster stills** — one WebP per slide (or one for welcome) that looks like a paused video frame (warm, shallow depth, detailer-at-work).
2. **Interim placeholders** — per-slide gradient + silhouette in the hero zone (~52vh) so layout isn’t all black.
3. **Later:** drop in `.mp4` / `.webm` loops; keep WebP as `poster` + fallback when `prefers-reduced-motion` or slow network.

### Option B — True IF parity (when you have clips)

Extend `SetupHeroBand` → `SetupHeroMedia` (or add `variant="video"`):

```html
<video autoPlay muted loop playsInline poster="/setup/setup-carousel-1.webp">
  <source src="/setup/setup-carousel-1.mp4" type="video/mp4" />
</video>
```

- Muted, `playsInline`, no controls, `object-fit: cover`, same `dark-footer` gradient overlay.
- `prefers-reduced-motion: reduce` → show poster only (no autoplay).
- Target: 3–8s loop, ≤2MB per clip, 720p portrait crop.

### Option C — Simplify funnel

If 3 slides feel redundant without video: merge to **welcome only** (one hero + one CTA, IF `274879`) and skip `/intro`. Product call — code supports both today.

**Without video, static poster + correct layout beats an empty black hero.**

---

## Layout spec (all 3 slides)

Match the mockup PNG and this structure:

```
┌─────────────────────────────┐
│                             │
│   HERO (~52vh, max 380px)   │  ← video loop OR poster still per slide
│   full-bleed cover media    │
│   dark gradient at bottom   │  ← fades into panel (tone="dark-footer")
│                             │
├─────────────────────────────┤
│  DARK PANEL (flex: 1)       │  bg #101612 → #080a09
│                             │
│  ← Back (slides 2–3 only)   │
│                             │
│  Headline (Syne, ~30px)     │  white, left-aligned
│  Lead (16px)                │  rgba(255,255,255,0.72)
│                             │
│  ● ━ ●  (dots)              │  active dot wider (18px)
│                             │
│  [ Continue / Get started ] │  .setup-btn-primary green
│  Skip · Already have account│
└─────────────────────────────┘
```

| Token / class | Value |
|---------------|-------|
| Panel background | `linear-gradient(180deg, #101612 0%, #080a09 100%)` |
| Headline | Syne, bold, white, left, 28–34px clamp |
| Lead | DM Sans, 16px, muted white |
| CTA | `#22c55e` green — **never** IF blue |
| Hero height | `min(52vh, 380px)` — `.setup-intro__hero` |
| Horizontal pad | 24px |

---

## Slide copy (already in code — do not change without product sign-off)

| # | Headline | Lead | Hero clip / poster (detailing B-roll) |
|---|----------|------|----------------------------------------|
| 1 | Book from your phone | Share your link — clients pick a service, date, and time | Slow pan: phone with booking UI, or client tapping link in driveway |
| 2 | Get paid faster | Send invoices and collect payment on the go | Send invoice tap → payment confirm; hands + phone at car |
| 3 | Track every job | Jobs, clients, and revenue in one place | Van pull-up, kit unload, or quick dashboard scroll on phone |

Posters: export **frame 0** of each loop as WebP for LCP and reduced-motion.

Final slide CTA label: **Get started** → `/auth?mode=signup`. Slides 1–2: **Continue**.

---

## Files to touch

| File | Role |
|------|------|
| `src/components/setup/SetupIntroCarousel.tsx` | Slides, motion, hero wiring |
| `src/components/setup/SetupHeroBand.tsx` | Hero image today — extend for video + poster |
| `src/lib/setup-hero-assets.ts` | Paths when assets exist |
| `src/app/onboarding/onboarding.css` | `.setup-intro*` styles |
| `public/setup/setup-carousel-{1,2,3}.webp` | Poster stills (required for LCP) |
| `public/setup/setup-carousel-{1,2,3}.mp4` | Optional loops when footage exists |

**Current bug:** `SETUP_HERO_INTRO` is a single path but IF uses **different photo per slide**. Implementation options:

- **A)** Add `SETUP_CAROUSEL_HEROES: [string, string, string]` and pass `src={heroes[index]}` to `SetupHeroBand`.
- **B)** One shared intro hero for all slides (weaker IF parity, faster).

Prefer **A** for IF rhythm.

---

## Interim fix for “black screen” (implement before photos)

When no WebP exists, **still render the hero zone** (~52vh) with a per-slide placeholder so layout matches IF:

1. In `SetupIntroCarousel`, always render `.setup-intro__hero` (remove `hasHero` gating that hides the whole hero).
2. If `heroes[index]` missing, use a `setup-intro__hero-placeholder` div with:
   - `background: linear-gradient(...)` unique per slide index (subtle green/teal shifts)
   - Optional: low-opacity SVG or CSS shape suggesting phone / van / chart
   - Same `setup-hero-band--dark-footer` gradient overlay as real photos
3. Remove or narrow `.setup-intro--no-hero` — that class makes the entire viewport dark with no visual anchor.

Do **not** leave a full-viewport dark gradient with only text; IF always has a **lit, moving hero region** on top (video or poster that looks like one).

---

## Wave 15 asset checklist

| File | Dimensions (suggested) | Max size | Subject |
|------|------------------------|----------|---------|
| `setup-carousel-1.webp` | 1170×1400 (3:4 crop) | ≤150KB | Poster — slide 1 B-roll |
| `setup-carousel-2.webp` | same | ≤150KB | Poster — slide 2 |
| `setup-carousel-3.webp` | same | ≤150KB | Poster — slide 3 |
| `setup-carousel-{1,2,3}.mp4` | 720×1280 portrait | ≤2MB each | Optional muted loops |

- `object-fit: cover`, `object-position: center` (or `center 30%` for faces)
- Use `priority` on slide 1 poster only
- Original detailing footage or stills — do not rip IF assets
- **Reduced motion:** poster WebP only, no `<video autoplay>`

Wire in `setup-hero-assets.ts`:

```ts
export const SETUP_CAROUSEL_HEROES = [
  '/setup/setup-carousel-1.webp',
  '/setup/setup-carousel-2.webp',
  '/setup/setup-carousel-3.webp',
] as const
```

---

## Motion (already coded)

- Slide change: horizontal slide + fade (`springStandard`), swipe on copy block
- Dots: width spring (`springSoft`)
- `prefers-reduced-motion`: crossfade only
- Archetype: document as `setup-step-in` variant in `MOTION_SPEC.md` if adding new keyframes

---

## Relationship to `/welcome`

| Route | Purpose |
|-------|---------|
| `/welcome` | Light split hero + logo + single “Get started” (IF `274879`) |
| `/intro` | Dark carousel, first launch only (`localStorage`), then → auth |

Both can coexist. Welcome = brand hello; intro = three value props. If product later decides intro is redundant, delete `/intro` redirect — do not merge video into welcome unless explicitly requested.

---

## Cursor prompt (copy-paste)

```
Implement Wave 15 + interim hero placeholders for the setup intro carousel.

Read: detailing-app/design-references/SETUP_INTRO_CURSOR_HANDOFF.md
Mockup: detailing-app/design-references/rinse-setup-intro-slide1-mockup.png

Goal: Fix the black full-screen intro. Match Invoice Fly layout (~60% hero media top, ~40% dark content panel bottom) with Rinse green CTA.

IF reference: hero is looping muted video — ScreenDesigns frames won't show motion; use poster stills until clips exist.

Tasks:
1. Per-slide heroes: SETUP_CAROUSEL_POSTERS (+ optional SETUP_CAROUSEL_VIDEOS) in setup-hero-assets.ts.
2. Always show .setup-intro__hero at ~52vh — poster or gradient placeholder + dark-footer overlay (never full-viewport black).
3. Extend SetupHeroBand (or SetupHeroMedia): poster WebP required; optional muted looped mp4; reduced-motion → poster only.
4. Keep existing copy, dots, swipe, Skip, escape links.
5. Update demo at /demo/setup intro panel if needed.

Do not use Invoice Fly blue. Accent #22c55e only.
```

---

## Acceptance

- [ ] Top ~60% has visual hero (video loop, poster, or intentional placeholder) — not empty black
- [ ] Three slides feel distinct (different poster/clip per slide)
- [ ] `prefers-reduced-motion`: poster only, no autoplay video
- [ ] Dark panel: white headline, muted lead, green CTA, dots
- [ ] Back chevron on slides 2–3
- [ ] `/demo/setup` intro chip matches production layout
- [ ] Reduced motion: layout identical, animation simplified only
