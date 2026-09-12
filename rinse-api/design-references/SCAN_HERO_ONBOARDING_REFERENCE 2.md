# Scan Hero onboarding reference (user-provided)

**Source:** `Onboarding_6_screens.zip` → `design-references/scan-hero/`  
**Product:** [scanhero.app](https://scanhero.app) — document scanner, not detailing.  
**Use:** Visual direction the user prefers over pure Invoice Fly photo B-roll.

---

## The 6 frames (in order)

| # | File | What it is |
|---|------|------------|
| 1 | `scan-hero-pdf-scanner_227.webp` | **Welcome** — dark full screen, logo top-left, centered headline with green accent word, subtext, green pill CTA, **phone mockup at bottom** on subtle curved dark shape |
| 2 | `scan-hero-pdf-scanner_228.webp` | **Hero beat** — floating phone showing live scan UI, “Instantly **Scan & Share**” (green accent) |
| 3 | `scan-hero-pdf-scanner_229.webp` | **Feature list** — green line icons + labels (contracts, bills, cards…), papers flying into tablet/phone |
| 4 | `scan-hero-pdf-scanner_230.webp` | **Device showcase** — tablet + phone, export PDF/JPG, “Manage Your Documents **Easily**” |
| 5 | `scan-hero-pdf-scanner_231.webp` | **Stacked phones** — vertical step labels (Scan, Sign, Convert, Share), perspective phone stack |
| 6 | `scan-hero-pdf-scanner_232.webp` | **Share beat** — signature UI, curved arc with floating app icons, long question headline |

---

## What makes it feel good (vs Rinse today)

| Scan Hero pattern | Rinse today |
|-------------------|-------------|
| **Full dark** canvas (`#12141D` area) | Welcome = **light** iOS gray; intro = dark bottom panel only |
| **Product mockup** (phone showing app UI) | **Lifestyle photo** posters in hero band |
| **Centered** headline; **green accent** on 1–2 words | Welcome = left-aligned; intro = centered (recent) |
| **Decorative curve** behind device / arc with icons | SVG **wave** between hero and panel (recent) |
| **Logo + wordmark** top-left on welcome | Logo in **body** below hero |
| Marketing **landing** energy (6 beats) | Funnel: intro carousel → welcome → auth |

---

## Map to Rinse routes (if adopting)

| Scan Hero frame | Rinse screen | Adaptation |
|-----------------|--------------|------------|
| 227 Welcome | `/welcome` | Dark welcome: “Run your **business** from your phone”, mockup showing booking or jobs UI at bottom |
| 228–229 | `/intro` slides 1–2 | Phone demo + icon feature list (booking, invoices, clients) |
| 230–231 | `/intro` slide 3 or onboarding bridge | Van/jobs dashboard mockup or stacked feature phones |
| 232 | Optional 4th beat or share screen | “Share your **booking link**” + arc icons (SMS, copy, QR) |

**Brand:** Keep Rinse green `#22c55e` — Scan Hero uses a similar lime; don’t copy their exact hue or “Scan Hero” layout verbatim.

---

## Welcome page — target spec (frame 227 style)

```
┌─────────────────────────────┐
│ [logo] Rinse                │  top-left wordmark
│                             │
│     Run your business       │  centered, white
│     from your phone         │  “business” or “phone” in green
│                             │
│  Book clients, send invoices│  centered muted subtext
│                             │
│      [ Get started ]        │  full-width green pill
│                             │
│    ╭── curved plate ──╮     │  subtle darker curve
│    │  📱 app mockup   │     │  3D tilt, shows Rinse UI
│    ╰───────────────────╯     │
└─────────────────────────────┘
```

- **No top photo band** — mockup *is* the hero visual
- Background: `#0f1117` → `#12141d` (dark lane — exception to client-light welcome)
- Curve: soft ellipse/plate behind phone (CSS or SVG), not IF wave into white body

---

## Intro carousel — hybrid option

Keep 3 slides but shift from **photo B-roll** to **Scan Hero beats**:

1. Phone with **booking link** UI — “Book from your **phone**”
2. Icon list: booking, invoices, payments (frame 229 pattern)
3. Van + dashboard mockup or stacked phones (230/231)

Posters in `public/setup/` become **optional**; primary art = PNG/WebP **device mockups** (can be static exports from Figma).

---

## Midjourney — welcome mockup (Scan Hero style)

```
Mobile app welcome screen mockup, dark charcoal background #12141d, small green logo top left text Rinse, centered bold white headline with one word in bright green #22c55e, gray subtext, full width green pill button Get started, bottom half 3D iPhone tilted showing auto detailing booking app interface on screen, subtle curved darker ellipse shape behind phone, premium SaaS onboarding, no Scan Hero branding --ar 9:16 --style raw --v 6.1
```

---

## Engineering touchpoints (if implementing)

| File | Change |
|------|--------|
| `welcome/page.tsx` | Dark layout variant; mockup image; centered type |
| `onboarding.css` | `.welcome-screen--dark`, `.welcome-screen__mockup`, accent headline spans |
| `setup-hero-assets.ts` | `SETUP_WELCOME_MOCKUP` path (device render, not lifestyle photo) |
| `SetupIntroCarousel.tsx` | Optional icon-list slide layout |
| `design-systems` rule | Document welcome dark exception |

---

## Decision needed

**A)** Welcome only → Scan Hero frame 227 (dark + mockup)  
**B)** Full funnel → remap intro + welcome to frames 227–232  
**C)** Cherry-pick → keep light welcome but steal centered accent headline + bottom mockup  
**D)** Reference only → keep current photo + curve intro; use these frames for mockup art direction

---

## Files

```
design-references/scan-hero/scan-hero-pdf-scanner_227.webp  … 232.webp
```
