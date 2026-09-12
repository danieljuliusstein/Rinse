# Claude design prompt — Intro carousel poster stills

Copy everything below the line into Claude. Attach the three full-screen mockups from `design-references/` as visual targets.

**Attachments to include:**
- `rinse-setup-intro-slide1-mockup.png`
- `rinse-setup-intro-slide2-mockup.png`
- `rinse-setup-intro-slide3-mockup.png`

---

## PROMPT START

You are a senior mobile product designer and photo art director. Produce **production-ready hero poster stills** for the **Rinse** app intro carousel (`/intro`). These replace looping video in Invoice Fly’s onboarding — same cinematic energy, **static images only**.

### Product context

**Rinse** is mobile-first SaaS for solo **mobile auto detailers**: booking link, jobs, clients, invoices, payments. The intro is a **3-slide carousel**:

| Slide | Headline | Lead |
|-------|----------|------|
| 1 | Book from your phone | Share your link — clients pick a service, date, and time |
| 2 | Get paid faster | Send invoices and collect payment on the go |
| 3 | Track every job | Jobs, clients, and revenue in one place |

Layout (already built in code): **top ~52vh hero poster** (full-bleed, `object-fit: cover`) + **dark bottom panel** with white headline, gray lead, green CTA. Your deliverable is **only the hero image** for each slide — not the UI chrome.

### What Invoice Fly does (important)

IF plays **muted looping video** in the hero. ScreenDesigns frame exports look like stills. We are using **poster stills** that look like a paused B-roll frame — warm, shallow depth, lifestyle not stock clipart.

### Brand rules

| Rule | Value |
|------|--------|
| Accent in any UI shown on phones | `#22c55e` green — never blue |
| Audience | Solo detailer, between jobs, trustworthy and premium |
| Photography | Original **mobile detailing** — vans, driveways, paint, phones. No generic office/invoice bookkeeping vibes |
| Do not | Copy Invoice Fly frames, use watermarked stock, show competitor logos |

### Deliverables (3 images)

Export each as **PNG or WebP**, portrait **3:4** crop safe for 1170×1400 (hero band crops top portion on phone).

| File | Scene direction | Mood |
|------|-----------------|------|
| `setup-carousel-1.png` | Detailer or POV hands holding phone with **booking/scheduling** UI; SUV/van in soft blur background | Approachable, “clients book themselves” |
| `setup-carousel-2.png` | Close hands + phone showing **invoice sent / payment success**; car paint bokeh | Confident, money moment |
| `setup-carousel-3.png` | **Van with open doors**, organized kit, polished car in driveway — or phone showing jobs list over vehicle | Organized pro, “runs the business” |

### Technical spec (engineering handoff)

```
Path:     public/setup/setup-carousel-{1,2,3}.png (or .webp)
Crop:     3:4 portrait, subject center or upper-third (faces/hands)
Max size: ≤150KB WebP preferred (optimize from PNG masters)
Usage:    SetupHeroBand, dark-footer gradient overlays bottom of image
Safe zone: Bottom 25% of image will be darkened — keep critical detail above
```

### Full-screen mockups (layout reference)

The attached PNGs show **target end state** — hero + dark panel + copy + green button. Match the **hero photography style** in those mocks; you may improve composition and realism.

### Optional extras

1. **Welcome hero** (`setup-hero-welcome.webp`) — lighter split layout, single “Get started” screen — van + detailer wave, 16:9-ish crop
2. Short **alt crops** for Android tablets — same art, wider safe zone

### Output format

1. **Creative direction** — 1 paragraph on visual thread across all 3 slides
2. **Per-slide shot list** — lens, lighting, talent, props, phone screen content
3. **Images** — `setup-carousel-1`, `setup-carousel-2`, `setup-carousel-3` at production resolution
4. **Handoff table** — filename, dimensions, file size, alt text for a11y

If you cannot generate images, write **extremely detailed art-direction briefs** per slide so a photographer or Midjourney run can execute in one pass.

## PROMPT END

---

## After Claude delivers

1. Drop files in `detailing-app/public/setup/`
2. Update paths in `src/lib/setup-hero-assets.ts` if using `.webp`
3. Verify at `/intro` and `/demo/setup` (Intro chip)
4. Optimize with `cwebp` or Squoosh if files exceed 150KB

## Current placeholders (shipped)

Engineering wired poster paths and AI-generated interim PNGs (~2MB each — **replace with optimized finals**). Gradient CSS placeholders show if images fail to load.
