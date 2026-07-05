# Claude design prompt — Rinse setup funnel (Waves 2–12)

Copy everything below the line into Claude (with attachments noted). Use this to produce **visual mockups** and a **handoff spec** an engineer can implement — not code.

---

## PROMPT START

You are a senior mobile product designer. Design the **Rinse** app setup funnel (welcome → auth → onboarding → first invoice) as high-fidelity **iPhone 15 Pro frames** (390×844 logical). Match the **layout rhythm and emotional arc** of Invoice Fly (reference app), but adapt for **mobile auto detailing** — not invoicing/bookkeeping.

### Product context

**Rinse** is a mobile-first SaaS for solo mobile detailers: booking link, jobs, clients, invoices, payments. The setup funnel must feel as premium as Invoice Fly: lifestyle hero photography, split layouts, one clear CTA per screen, celebration moments — without copying Invoice Fly’s blue brand or literal copy.

**Audience:** Solo detailer, often on phone between jobs. Setup must feel fast, trustworthy, and “this is MY business” — not enterprise software.

### What already exists (do NOT redesign from scratch)

Engineering shipped **Wave 1 foundation only** — CSS primitives, no visual refresh on live screens yet:

- Layout shell: `.setup-split` (hero band + overlapped body + sticky footer)
- Hero component: `SetupHeroBand` — gradient placeholder until photos exist
- Tokens on `.setup-flow`: bg `#f2f2f7`, accent **`#22c55e` green** (not blue), text `#1c1c1e`, Syne display + DM Sans body
- Motion already coded (stagger, step-enter, success-pop) — design for static states; note animation intent separately

**Your job:** Visual design for Waves 2–12 that an engineer maps onto existing BEM classes and tokens.

### North star references (MUST study)

Attach or view these Invoice Fly ScreenDesigns frames from `design-references/invoice-fly/`:

| Priority | Frames | What to borrow |
|----------|--------|----------------|
| P0 | `274896` | Account created — invoice preview on top, confetti + check, headline, single CTA |
| P1 | `274879` | Welcome — split hero photo + white content + one “Get started” |
| P1 | `274890` | Logo complete — cream identity card, centered COMPLETE pill |
| P1 | `274886`–`274885` | Business/logo step — hero strip, thin progress, upload area |
| P2 | `274883` | Business info — hero + one field first |
| P2 | `274903` | Invoice preview polish (document presence) |
| P3 | `274899`, `274901` | Trial splash + paywall card layout |
| Skip | `274884` industry, `274893` App Store rating, `274909` IAP | Not for web PWA |

Scrub 3–5 consecutive frames per flow to understand hierarchy, not just one still.

### Brand & design system (non-negotiable)

| Rule | Value |
|------|--------|
| Accent | `#22c55e` green only — never Invoice Fly blue, never `#16a34a` / `#4caf50` |
| Lane | Client-light setup — warm iOS gray bg, white cards, subtle borders |
| Display font | **Syne** — headlines, app name |
| UI font | **DM Sans** — body, buttons, labels |
| Primary button | Full width, 52px height, 14px radius, green fill, white label |
| Secondary | Outline/ghost only when necessary — prefer **one** filled CTA per screen |
| Photography | Original **mobile detailing** scenes (van, paint correction, booking on phone) — do not crop IF frames |
| Platform | Mobile web / PWA — no iOS system dialogs (ATT, App Store, Photos permission chrome) |

### Current Rinse screens (what’s wrong today)

Describe improvements in your mocks:

1. **Welcome** — Centered huge logo, feature checklist card, two filled buttons + redundant sign-in link. **Target:** IF `274879` split hero, one primary CTA, text link only for sign-in.

2. **Auth** — Functional but cluttered on signup (value-prop checklist duplicates welcome). **Target:** Cleaner; OAuth + form; slug preview on signup.

3. **Onboarding business** — Plain form table, small logo square, no hero. **Target:** Hero strip, logo identity card, image picker sheet, COMPLETE pill below card (`274890`).

4. **Your invoice** — Inline success banner + package picker + preview on same screen. **Target:** **Two beats:** (A) celebration screen `274896` then (B) customize picker + preview.

5. **Booking link** — Rinse-only differentiator; no IF analog. Make sharing the link feel like a win.

6. **Plans / trial** — Inline trial banner; **Target:** optional trial splash energy from `274899` without App Store tropes.

### Screens to deliver (minimum 8 iPhone frames)

Design each at **@2x** or Figma 390×844. Label frame ID + Rinse route.

| # | Screen | Rinse route | IF ref | Notes |
|---|--------|-------------|--------|-------|
| 1 | Welcome | `/welcome` | `274879` | Hero ~42vh; overlap body optional |
| 2 | Sign up | `/auth?mode=signup` | — | Google/Apple + business name row |
| 3 | Business setup | `/onboarding?step=business` | `274883`–`274885` | Hero + fields + logo block |
| 4 | Logo — empty | same | `274886` | “Choose image” + bottom sheet |
| 5 | Logo — complete | same | `274890` | Cream identity card + COMPLETE |
| 6 | Account ready | `/onboarding?step=your-invoice` beat 1 | `274896` | Preview top, confetti, check, CTA |
| 7 | Your invoice | beat 2 | `274903` light | Package pick + live preview |
| 8 | Booking link | `/onboarding?step=booking` | — | Link card + copy/share |
| 9 | Plans | `/onboarding?step=plans` | `274899` tone | Trial card + primary CTA |

**Optional:** Paywall sheet (`274901` adapted to bottom sheet), auth sign-in variant.

### Layout patterns to use consistently

```
┌─────────────────────┐
│   HERO BAND (photo  │  min(42vh, 320px) or gradient
│   or green grad)    │
├─────────────────────┤
│ ▬▬▬▬ progress 3px   │  under hero on onboarding
╭─────────────────────╮
│  overlapped body    │  border-radius 20px top
│  headline + content │
│                     │
╰─────────────────────╯
│ [ Continue ]        │  sticky footer, blur bar
└─────────────────────┘
```

- **Welcome:** sharp or soft hero-to-content transition (IF uses sharp cut to white)
- **Onboarding:** nav back + centered step title OR body headline — pick one hierarchy and stick to it
- **Success (`274896`):** invoice mock fades at bottom; check circle overlaps fade; confetti dots blue→green + amber

### Copy (use or tighten — do not use “Invoice Fly”)

| Screen | Headline | Subcopy | Primary CTA |
|--------|----------|---------|-------------|
| Welcome | Run your business from your phone | Book clients, send invoices, and track jobs. | Get started |
| Sign up | Create account | Start your solo mobile detailing workspace | Create account |
| Business | Your business | Quick setup — then you'll see your first invoice. | Continue |
| Logo | Upload logo | Optional, can be edited any time | Continue |
| Success | You're ready! | Your first invoice is set up — nothing sent yet. | See my invoice |
| Your invoice | Your invoice | Preview only — nothing is sent. | Continue |
| Booking | Your booking link is live | Share anywhere clients find you. | Continue |
| Plans | Your plan | 14-day trial · no card required | Get started |

### Identity card spec (logo complete)

- Background: warm cream `#f7f5f0`
- Layout: logo left (rounded square ~64–96px), business name bold right, subline “Mobile detailing” or city
- **COMPLETE** pill: centered **below** card (green bg, uppercase, not corner badge)
- Sample: “Summit Detail” / user’s typed business name

### Invoice preview on success screen

- Use realistic detailing line item: “Full detail” · Sedan · mobile · **$185**
- Business: Summit Detail, green accent on template
- Card width ~90%, shadow lg, bottom **mask fade** into page bg
- Client: “Sample Client”

### Deliverables required from you

1. **Figma-style frame set** (or numbered PNG exports) for all 8–9 screens — light mode only
2. **One-page design handoff** per screen:
   - Spacing (px), type sizes/weights, colors (hex), corner radii
   - Hero image **art direction** brief (subjects, mood, crop) for photographer/stock
   - Component mapping to: `setup-split`, `SetupHeroBand`, `setup-body-headline`, `setup-btn-primary`, `onboarding-identity-card` (new), `onboarding-success-screen` (new)
3. **Annotated diff** vs current Rinse (what to remove: feature card, dual CTAs, corner COMPLETE badge, inline success banner)
4. **Motion notes** (1 line each): stagger order, success confetti, sheet enter — engineer already has archetypes; don’t redesign motion, just call out triggers
5. **Do not deliver:** React code, Tailwind, App Store UI, blue color system

### Quality bar

- Feels like Invoice Fly’s **confidence and photography** with Rinse’s **green** and **detailing** vertical
- Every screen has **one obvious next action**
- Readable on iPhone SE (375px wide) — show one frame at 375 if possible
- Accessible contrast on green buttons and COMPLETE pill (WCAG AA)

### Attachments to include with this prompt

1. Invoice Fly frames: `274879`, `274886`, `274890`, `274896` (PNG or webp)
2. Screenshot of current Rinse `/welcome` and `/onboarding` if available
3. `SETUP_UX_PLAN.md` Wave 0 appendices A + F (gap matrix + token map)

### Output format

Start with a **2-paragraph creative direction**, then **screen-by-screen mocks** (describe visually in detail if you cannot generate images), then **handoff tables**. If you can generate images, output one image per screen labeled `rinse-setup-01-welcome.png`, etc.

## PROMPT END

---

## How to use

1. Open Claude (or design-focused model with image output).
2. Paste from **PROMPT START** through **PROMPT END**.
3. Attach IF frames from `detailing-app/design-references/invoice-fly/` (at minimum `274879`, `274890`, `274896`).
4. Optionally attach screenshots of current `localhost:3000/welcome` and `/onboarding?step=business`.
5. Save Claude’s PNGs to `detailing-app/public/setup/` when approved (Wave 15).
6. Give engineer output + `SETUP_UX_PLAN.md` wave number to implement.

**Implementation order after design:** Wave 2 welcome → Wave 8 success → Wave 7 logo → Wave 5–6 business shell → Wave 9 invoice.
