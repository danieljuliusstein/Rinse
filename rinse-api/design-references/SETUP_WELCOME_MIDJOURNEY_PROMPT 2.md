# Midjourney prompt — Welcome page hero (`/welcome`)

Hero-only image for the top band (~42vh). **No UI, no text, no logos** — the app renders logo, copy, and green CTA below on a light panel with a curved wave transition.

**Save as:** `public/setup/setup-hero-welcome.webp` (or `.png`)  
**Wire in:** `src/lib/setup-hero-assets.ts` → `SETUP_HERO_WELCOME = '/setup/setup-hero-welcome.webp'`

---

## Primary prompt (copy-paste)

```
Cinematic lifestyle photograph, mobile auto detailing entrepreneur finishing a paint correction on a glossy black SUV in a sunny suburban driveway, white detailing van with open rear doors and organized polishers in soft background blur, warm golden morning light, shallow depth of field, aspirational small-business energy, premium fintech app marketing aesthetic, photorealistic, shot on Sony A7IV 35mm f/1.8, natural colors, no text, no logos, no phone screens, no UI overlays --ar 16:9 --style raw --v 6.1
```

---

## Alternate scenes (pick one direction)

### A — Van + pro (brand trust)

```
Professional mobile detailer in clean navy polo standing beside a white detailing van and freshly polished sedan on a residential driveway, confident relaxed posture, early morning soft sunlight, cinematic lifestyle commercial photography, shallow depth of field, aspirational solo business owner, photorealistic, no text no logos no watermarks --ar 16:9 --style raw --v 6.1
```

### B — Hands-on craft (premium quality)

```
Close cinematic shot of detailer hands applying ceramic coating to mirror-black car hood, microfiber towel and foam bottle, bokeh driveway and green lawn background, warm natural light, premium auto care craftsmanship, photorealistic commercial still, no text no logos --ar 16:9 --style raw --v 6.1
```

### C — Between jobs / phone moment (matches copy “from your phone”)

```
Mobile detailer leaning against white work van checking smartphone between jobs, polished SUV in foreground, suburban driveway, golden hour warmth, candid documentary lifestyle photo, shallow depth of field, small business freedom mood, photorealistic, no readable phone screen content, no text no logos --ar 16:9 --style raw --v 6.1
```

---

## Negative prompt (append or use `--no`)

```
--no text, typography, logo, watermark, stock photo border, cartoon, illustration, 3d render, oversaturated, blue color grade, office desk, bookkeeping, invoice paperwork, car dealership showroom, crowd, night scene, rain, snow, damaged car, dirty car, license plate readable, brand names on van, Invoice Fly, blue button, UI mockup, split screen, phone frame
```

---

## Recommended parameters

| Param | Value | Why |
|-------|-------|-----|
| `--ar 16:9` | landscape | Welcome hero is a **wide short band** (full width × ~320px tall), not full portrait |
| `--style raw` | less stylized | Closer to real photography / IF welcome still |
| `--v 6.1` | current | Adjust to your MJ version |
| `--s 100–250` | optional | Lower = more literal; try `150` if too artistic |
| `--c 5–15` | optional | Slight variety without drifting off-brand |

Portrait `--ar 3:4` also works if you crop the **top third** in post — the app uses `object-fit: cover`.

---

## Composition / safe zones

```
┌──────────────────────────────┐
│                              │
│   Main subject here          │  ← faces, van, hero car
│   (upper-middle third)       │
│                              │
│   ─── wave curve cuts here ─ │  ← bottom ~15% obscured by SVG wave + light panel
└──────────────────────────────┘
```

- Keep the **subject above the bottom 20%** — a white wave curves into the body below.
- Avoid heavy darkness at the bottom (intro uses dark panel; welcome uses **light** `#f2f2f7` body).
- Prefer **warm, bright** exposure — reads well under a subtle gradient overlay.
- **No green branding** required in the photo; app accent is `#22c55e` on the button only.

---

## Post-export

1. Crop to **at least 1560×900** (or 1920×1080) for retina
2. Optimize: WebP ≤ **120KB** (`cwebp -q 82`)
3. Drop in `public/setup/setup-hero-welcome.webp`
4. Set `SETUP_HERO_WELCOME` in `setup-hero-assets.ts`
5. Check `/welcome` and `/demo/setup` → Welcome chip

---

## Mood board keywords

`mobile detailing` · `solo entrepreneur` · `white work van` · `driveway` · `paint correction` · `golden hour` · `premium SaaS onboarding` · `Invoice Fly welcome energy` · `trustworthy` · `clean` · `not corporate`
