# Setup UX polish plan — Invoice Fly layout pass

Planning doc only — **no implementation until a wave is explicitly started**.

This plan is **separate from Style Waves 40–56** (`STYLE_PLAN.md`), which shipped **motion** on the setup funnel. These waves ship **layout, hierarchy, photography, and information architecture** to match Invoice Fly reference frames — while keeping Rinse’s green accent lane (`--setup-*` / `--cl-*`) and detailing-specific copy.

**Related:** `invoice-fly/README.md` · `MOTION_SPEC.md` · `STYLE_PLAN.md` (Wave 48 motion ✅) · `docs/ui-css-audit.md` · `.cursor/rules/design-systems.mdc`

**Demo lab (update each wave):** `/demo/setup-motion` · live routes `/welcome`, `/auth`, `/onboarding`

---

## Goal

Close the gap between **Wave 48 motion** (animations work) and **Invoice Fly visual UX** (hero photography, split layouts, celebration beats, identity previews). A user scrubbing `274878` → `274896` in `invoice-fly/` should recognize the same emotional arc in Rinse — adapted for mobile detailing, not invoice bookkeeping.

## Current baseline (post–Wave 48)

| Layer | Status | Owner |
|-------|--------|-------|
| Motion (stagger, step-enter, success-pop) | ✅ Wave 48 | `onboarding.css`, `auth-flow.css` |
| Client-light setup tokens (`--setup-*`) | ✅ | `onboarding.css` |
| Welcome | Split hero band + overlapped body + primary CTA | `welcome/page.tsx` |
| Auth | Logo top, left-aligned title, OAuth + form | `AccountAuth.tsx`, `auth-flow.css` |
| Onboarding shell | Nav title + 4-seg progress + sticky footer | `OnboardingShell.tsx` |
| Business step | iOS `SetupRowField` table + small logo picker | `OnboardingBusinessStep.tsx` |
| Your invoice | Inline hero banner + phase pills + picker + preview | `OnboardingYourInvoiceStep.tsx` |
| Booking / plans | Link row + share; plans card | `OnboardingBookingStep.tsx`, `OnboardingPlansStep.tsx` |
| Paywall | Sheet stagger (motion only) | `PaywallSheet.tsx`, `paywall-sheet.css` |
| Hero photography | ❌ Not used | — |
| Split hero + content layout | ❌ Not used | — |
| Dedicated success beat | ❌ Inline on invoice step | — |
| Business identity preview card | ❌ Logo square only | — |
| Image source picker sheet | ❌ Native `<input type="file">` | — |
| Intro value carousel | ❌ Skipped | — |

**Gap:** Motion matches IF archetypes; **layout and visual hierarchy** still read as “generic iOS form” vs IF’s “lifestyle hero + celebration.”

---

## Wave map (overview)

| Wave | Name | IF frames | Status |
|------|------|-----------|--------|
| 0 | Photo audit & gap matrix | all setup flows | ☑ |
| 1 | Setup UX foundation — tokens, hero system, split shell | — | ☑ |
| 2 | Welcome — hero band & CTA hierarchy | `274878`–`274879` | ☑ |
| 3 | Intro value carousel (3 slides) | `274880`–`274883` | ☑ |
| 4 | Auth — layout, copy, signup value strip | — | ☑ |
| 5 | Onboarding shell — hero strip + IF progress | `274886` | ☑ |
| 6 | Business step — section hierarchy & fields | — | ☑ |
| 7 | Logo — identity card, picker sheet, COMPLETE | `274886`–`274890` | ☑ |
| 8 | Account created — dedicated success beat | `274896`–`274901` ⭐ | ☑ |
| 9 | Your invoice — preview hierarchy & picker | `274896`, `274937` | ☑ |
| 10 | Booking link — share moment & link card | — | ☑ |
| 11 | Plans & trial — card layout & CTA stack | `274899` | ☑ |
| 12 | Paywall & post-setup prompts | `274893`–`274895` | ☑ |
| 13 | Edge states — loading, errors, empty, offline | — | ☑ |
| 14 | Copy & microcopy pass | all setup | ☑ |
| 15 | Assets — hero photos, confetti, identity mock | — | ☐ |
| 16 | A11y, safe areas, reduced-motion layout | — | ☐ |
| 17 | Demo lab + QA checklist | `/demo/setup-motion` | ☐ |

**Fast path (highest impact):** 0 → 1 → 8 → 7 → 2 → 9 → 17

**Defer without product decision:** Wave 3 (carousel) if welcome hero (Wave 2) is enough.

---

## Principles (every wave)

1. **Extend `onboarding.css`** — no new per-route CSS files (`ui-css-audit.md`).
2. **Stay in client-light lane** — `--setup-*` tokens; never operator `--green` on `/welcome` / `/auth` / `/onboarding`.
3. **Motion already shipped** — reuse Wave 48 archetypes; this pass changes **DOM order and surfaces**, not new keyframes unless a new element needs enter (e.g. confetti).
4. **Rinse copy wins** — IF says “Invoice Fly”; we say detailing, booking link, jobs. Match **structure**, not literal strings.
5. **Photography is optional per step** — hero strip can be static WebP; no video required.
6. **Reduced motion** — layout changes must not depend on animation to communicate state (COMPLETE badge visible without pop).
7. **Components first** — `BottomSheet` / `VaulSheet` for pickers; `FloatingField` / `SetupRowField` for forms.

---

## Wave 0 — Photo audit & gap matrix ✅

**Completed** 2026-07-03 · **Second pass** 2026-07-03 (frame-by-frame scrub `274877`–`274909`, full Rinse inventory).

Layout specs: `MOTION_SPEC.md` → **Setup UX layout specs** (17 flows + frame index).

### Tasks

1. Scrub **every** setup-related frame `274877`–`274909` (missing ID `274898` in export — noted)
2. Log layout specs in `MOTION_SPEC.md` (layout model, type, CTAs, cards, gaps)
3. Full gap matrix — every Rinse route, component, and CSS owner
4. Pick 3 hero layout moments (Waves 8, 7, 2)
5. Asset strategy + IF → Rinse visual token translation
6. Funnel mapping IF steps ↔ Rinse steps
7. Motion vs layout checklist per screen

### Acceptance

- [x] Every setup route has an IF frame range cited (or explicit “no analog”)
- [x] Every IF frame `274877`–`274909` indexed (Appendix B)
- [x] Rinse component + CSS inventory (Appendix E)
- [x] Gap matrix with P0–P4 priorities (Appendix A)
- [x] Cross-cutting measurements (Appendix F)
- [x] No app code changes

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Layout specs (17 flows) | `MOTION_SPEC.md` → Setup UX layout specs |
| Frame-by-frame index (27 frames) | Appendix B |
| Full gap matrix (22 rows) | Appendix A |
| Funnel mapping IF ↔ Rinse | Appendix G |
| Rinse inventory (routes, components, CSS) | Appendix E |
| IF visual tokens → Rinse `--setup-*` | Appendix F |
| Hero layout moments (3) | Appendix C |
| Asset strategy | Appendix D |
| Motion vs layout per screen | Appendix I |
| Out-of-scope register | Appendix H |
| Wave 0 decisions | Open decisions |

---

### IF setup funnel order (replay truth)

Sequential frames in `invoice-fly/` (IDs step +2; **`274898` missing** from export):

```
274877  splash (logo only)
274878  welcome + ATT dialog overlay
274879  welcome clean
274880  carousel slide 1 — Invoice in seconds
274881  carousel slide 2 — Get paid faster
274882  carousel slide 3 — Scan receipts
274883  business info — single field
274884  industry picker — search + radio list
274885  upload logo — empty state
274886  select image sheet
274887  Photos permission (iOS)
274888  photo gallery grid
274889  logo crop (iOS editor)
274890  logo complete — identity card + COMPLETE
274891  AI estimate — loading (out of scope)
274892  AI estimate — result + confetti (out of scope)
274893  rating — modal overlay
274894  rating — thanks modal
274895  rating — full page social proof
274896  account created — hero (preview + confetti + check) ⭐
274897  account created + notification permission overlay
274899  trial promo — “Try 3 days For Free!”
274901  PRO paywall — plan cards
274903  preview & customize invoice (post-onboarding product)
274905  device mockup promo (marketing)
274907  FAQ / support (settings-adjacent)
274909  App Store subscribe sheet (iOS)
```

**Rinse funnel today:**

```
/welcome → /auth (?mode=signup) → /auth/oauth/callback
→ /onboarding?step=business → your-invoice → booking → plans → /
```

Side paths: `/auth/reset`, `AuthProvider` guest redirect, `PaywallSheet` (operator), `/demo/setup-motion`.

---

### Appendix A — Gap matrix (final, 22 rows)

| # | Rinse surface | File(s) | IF frame(s) | IF layout | Gap (priority) | Motion W48 | UX wave |
|---|---------------|---------|-------------|-----------|----------------|------------|---------|
| 1 | Splash | — | `274877` | Centered logo | Out of scope | — | — |
| 2 | `/welcome` | `welcome/page.tsx` | `274878`–`274879` | Split hero + 1 CTA | **P1** photo; feature card; dual CTAs | ✅ stagger | 2 |
| 3 | Intro carousel | — | `274880`–`274883` | Full-bleed ×3 + dark footer | **P3** missing | — | 3 defer |
| 4 | `/auth` login | `AccountAuth.tsx` | — | Post-welcome minimal | **P4** OK shell | ✅ step-enter | 4 |
| 5 | `/auth?mode=signup` | `AccountAuth.tsx` | — | — | **P4** duplicate value props | ✅ | 4 |
| 6 | `/auth` forgot | `AccountAuth.tsx` | — | — | **P4** low traffic | ✅ | 13 |
| 7 | `/auth/reset` | `auth/reset/page.tsx` | — | — | **P4** missing `setup-flow` wrapper | — | 13 |
| 8 | `/auth/oauth/callback` | `oauth/callback/page.tsx` | — | — | Loading only; no layout | — | 13 |
| 9 | Business fields | `OnboardingBusinessStep.tsx` | `274883` | Split + 1 field first | **P2** form-heavy; no hero | ✅ step-in | 5–6 |
| 10 | Industry picker | — | `274884` | Search + radio list | **P4** no Rinse analog (detailers only) | — | — skip |
| 11 | Logo empty + picker | `OnboardingBusinessStep.tsx` | `274885`–`274888` | Split + sheet | **P1** no hero/sheet | ✅ progress | 7 |
| 12 | Logo crop | — | `274889` | iOS crop UI | **P3** optional client crop | — | 7 optional |
| 13 | Logo complete | `OnboardingBusinessStep.tsx` | `274890` | Identity card + COMPLETE | **P1** corner badge | ✅ success-pop | 7 |
| 14 | Rating | — | `274893`–`274895` | Social proof + modal | Skip App Store web | — | 12 defer |
| 15 | Account success | `OnboardingYourInvoiceStep.tsx` | `274896`–`274897` | Celebration + preview top | **P0** biggest gap | ✅ partial | 8 |
| 16 | Phase pills | `OnboardingYourInvoiceStep.tsx` | — | — | **P2** Rinse-only noise | ✅ stagger | 9 remove? |
| 17 | Package picker | `OnboardingYourInvoiceStep.tsx` | — | — | **P2** OK; IF uses customize later | ✅ pick stagger | 9 |
| 18 | Invoice preview | `InvoiceTemplateMock` | `274896`, `274903`, `274937` | Doc hero + customize tabs | **P2** size + depth | ✅ hero-in | 9 |
| 19 | Template/color picker | `InvoiceAppearancePicker.tsx` | `274903` | Bottom tab bar customize | **P3** not in onboarding | — | 9 defer |
| 20 | `/onboarding?step=booking` | `OnboardingBookingStep.tsx` | — | Rinse-only | **P2** polish link card | ✅ copy pop | 10 |
| 21 | `/onboarding?step=plans` | `OnboardingPlansStep.tsx` | `274899` | Trial splash | **P3** inline vs full-screen | ✅ card-in | 11 |
| 22 | `PaywallSheet` | `PaywallSheet.tsx` | `274901`, `274909` | PRO cards / iOS IAP | **P3** sheet vs full page | ✅ stagger | 12 |
| — | `auth-loading-screen` | `AuthProvider`, steps | — | — | **P2** plain text | — | 13 |
| — | `/demo/setup-motion` | `demo/setup-motion/page.tsx` | all | Lab panels | Update per wave | partial | 17 |

**Priority:** P0 first · P1 high · P2 medium · P3 polish/defer · P4 low/skip

---

### Appendix B — Frame-by-frame index (`274877`–`274909`)

| Frame | Screen / state | In Rinse funnel? | Setup UX wave | Notes |
|-------|----------------|------------------|---------------|-------|
| `274877` | Splash — centered logo | No | — | White bg; auto-advance |
| `274878` | Welcome + ATT dialog | No (web) | 2 | Overlay blocks UI |
| `274879` | Welcome clean | **Yes** `/welcome` | 2 | **Hero layout #3** |
| `274880` | Carousel 1 | No | 3 | Tablet in car; dark footer |
| `274881` | Carousel 2 | No | 3 | Lock screen notification mock |
| `274882` | Carousel 3 | No | 3 | Receipt scan photo |
| `274883` | Business info — 1 field | **Yes** business | 5–6 | Building hero ~35vh |
| `274884` | Industry picker | No | — skip | Search + 8+ radio rows |
| `274885` | Upload logo empty | **Yes** business | 7 | Light blue upload rect |
| `274886` | Select image sheet | **Yes** business | 7 | 2 options + cancel |
| `274887` | Photos permission | Partial web | 7 | Browser permission API |
| `274888` | Gallery grid | No MVP | 7 | Use native picker |
| `274889` | Logo crop editor | Optional | 7 | `canvas` crop defer |
| `274890` | Logo complete | **Yes** business | 7 | **Hero layout #2**; cream card |
| `274891` | AI estimate loading | No | — | Bathroom photo |
| `274892` | AI estimate table | No | — | Confetti petals |
| `274893` | Rating modal | No web | 12 | 5 blue stars |
| `274894` | Rating thanks | No web | 12 | Write review |
| `274895` | Rating full page | No web | 12 | Testimonial carousel |
| `274896` | Account created | **Yes** your-invoice | 8 | **Hero layout #1** |
| `274897` | Account + notifications | Partial | 8 | Skip notification overlay |
| `274898` | — | — | — | **Missing from export** |
| `274899` | Trial promo splash | Partial plans | 11 | Radial blue + sparkles |
| `274901` | PRO paywall | Partial PaywallSheet | 12 | Orbit icons + 3 plans |
| `274903` | Preview & customize | Partial preview | 9 | Template carousel + 6 tabs |
| `274905` | Device mockup promo | No | — | Marketing asset |
| `274907` | FAQ / restore purchases | No | — | Settings-adjacent |
| `274909` | App Store subscribe | No web | 12 | Stripe checkout instead |

---

### Appendix C — Hero layout moments (picked)

| Priority | Wave | Frame | Moment | Why |
|----------|------|-------|--------|-----|
| 1 | **8** | `274896` | Account created — preview top + confetti + check | Highest emotional peak; P0 gap |
| 2 | **7** | `274890` | Logo complete — cream identity card + COMPLETE pill | Brand moment; clear IF parity |
| 3 | **2** | `274879` | Welcome — split hero + single CTA | First impression; removes checklist |

---

### Appendix D — Asset strategy

| Question | Decision |
|----------|----------|
| Host heroes | `public/setup/*.webp` bundled |
| Placeholders Waves 1–14 | CSS gradient in `SetupHeroBand` |
| Real photos | Wave 15; licensed detailing shots only |
| Git LFS | If `public/setup/` > ~800KB total |
| `next/image` | Local `src` + `sizes="100vw"` for hero |
| Confetti | CSS-only dots (Wave 8) |
| Do not use | IF frame crops as Rinse heroes |

---

### Appendix E — Rinse setup inventory

#### Routes & entry points

| Route | Public? | `setup-flow`? | Notes |
|-------|---------|---------------|-------|
| `/welcome` | Yes | ✅ | First launch |
| `/auth` | Yes | ✅ | `?mode=signup` |
| `/auth/reset` | Yes | ⚠️ partial | Missing `client-light-root` |
| `/auth/oauth/callback` | Yes | ❌ | Redirect loader |
| `/onboarding` | Auth gate | ✅ | 4 steps via query `step` |
| `/demo/setup-motion` | Yes | ✅ | Motion/layout lab |

#### Components

| Component | Step / use |
|-----------|------------|
| `welcome/page.tsx` | Welcome |
| `AccountAuth.tsx` | Auth all modes |
| `SocialAuthButtons.tsx` | OAuth |
| `OnboardingShell.tsx` | Shared chrome |
| `OnboardingBusinessStep.tsx` | business |
| `OnboardingYourInvoiceStep.tsx` | your-invoice |
| `OnboardingBookingStep.tsx` | booking |
| `OnboardingPlansStep.tsx` | plans |
| `PaywallSheet.tsx` | Operator nudge/lapsed |
| `InvoiceTemplateMock.tsx` | Preview render |
| `InvoiceAppearancePicker.tsx` | **Not wired** in onboarding |
| `WebsiteBookingGuide.tsx` | Booking step embed |
| `SetupRowField` | Business + auth fields |

#### CSS owners (do not duplicate)

| File | Owns |
|------|------|
| `onboarding.css` | `.setup-flow`, `.welcome-*`, `.onboarding-*`, `.ob-*`, `.setup-btn-*`, motion Wave 48 |
| `auth-flow.css` | `.auth-screen` base + dark fallback; light overrides under `.client-light-root` |
| `paywall-sheet.css` | `.paywall-sheet*` |
| `globals.css` | `.auth-loading-screen` |
| `demo` CSS | `.demo-motion*` |

#### Key classes to extend (Waves 1+)

`welcome-screen`, `auth-screen`, `onboarding-flow`, `setup-split` (new), `onboarding-identity-card` (new), `onboarding-success-screen` (new), `setup-btn-primary`, `ob-pick-card`, `onboarding-invoice-preview--hero`, `onboarding-account-hero`, `onboarding-logo-picker`, `onboarding-plans-card`, `paywall-sheet`

---

### Appendix F — IF visual patterns → Rinse tokens

Match **structure and measure**, not IF blue (#007AFF-style). Map to `--setup-accent` green.

| Pattern | IF (observed) | Rinse target |
|---------|---------------|--------------|
| Primary CTA height | ~52–54px | `.setup-btn-primary` min-height 54px ✅ |
| Primary CTA radius | ~14px | `--setup-radius` 14px ✅ |
| Primary CTA fill | Blue gradient | Flat `--setup-accent` + green shadow ✅ (keep green lane) |
| Hero height | 35–45vh | `--setup-hero-height: min(42vh, 320px)` (Wave 1) |
| Progress under hero | 3px, 2–4 segments | `.onboarding-flow__progress--hero` (Wave 5) |
| Page horizontal pad | 20px | `--setup-content-pad: 20px` |
| Section title | ~28px bold left | `onboarding-flow__nav-title` 17px center — **gap** |
| Step title on body | ~28px bold left | Use body headline class (Wave 5–6) |
| Identity card bg | `#EBE4D3` cream | `--setup-identity-bg: #f7f5f0` |
| Upload placeholder bg | Light blue-gray | `--setup-raised` or new token |
| Invoice preview fade | `mask-image` linear bottom | Wave 8–9 |
| Confetti dots | Blue + orange, 8–16px | `--setup-accent` + amber accent |
| Sticky footer | Blur bar + Continue | `onboarding-flow__footer` ✅ |
| Sheet header | Solid blue bar | Use `--setup-surface` + border (not IF blue bar) |

---

### Appendix G — Funnel mapping (IF step → Rinse)

| IF order | IF screen | Rinse equivalent | Match? |
|----------|-----------|------------------|--------|
| 1 | Splash | App load | Skip |
| 2 | Welcome | `/welcome` | Partial |
| 3 | Carousel ×3 | — | Missing |
| 4 | Auth / signup | `/auth` | Rinse has explicit auth |
| 5 | Business info | `business` step | Partial |
| 6 | Industry | — | Skip (vertical-specific) |
| 7 | Logo upload | `business` logo block | Partial |
| 8 | Rating | — | Skip web |
| 9 | Account created | `your-invoice` success | **Poor** — needs Wave 8 |
| 10 | Customize invoice | `your-invoice` picker | Partial |
| 11 | Trial splash | `plans` | Partial |
| 12 | Paywall | `plans` + `PaywallSheet` | Partial |
| — | Booking link | `booking` | **Rinse extra** (differentiator) |

**Rinse extras not in IF:** booking link step, sample client on invoice, pipeline/value props in auth.

---

### Appendix H — Out of scope register

| Item | Frames | Reason |
|------|--------|--------|
| Splash | `274877` | No product splash |
| ATT / tracking | `274878` | Web N/A |
| iOS notifications | `274897` | PWA optional later |
| Industry picker | `274884` | Single vertical (detailing) |
| AI estimate | `274891`–`274892` | No AI product |
| App Store rating/IAP | `274893`–`274895`, `274909` | Web uses Stripe |
| Device mockup promo | `274905` | Marketing site |
| FAQ / restore | `274907` | Settings/support |
| Full gallery UI | `274888` | Native file picker |
| Missing frame | `274898` | Export gap |

---

### Appendix I — Motion vs layout checklist

| Screen | Motion W48 | Layout Wave 0 status |
|--------|------------|----------------------|
| Welcome stagger | ✅ | ❌ hierarchy/hero |
| Auth step-enter | ✅ | ⚠️ value props clutter |
| Onboarding step-in | ✅ | ❌ no hero strip |
| Progress seg spring | ✅ | ❌ wrong position/style |
| Logo progress fill | ✅ | ❌ identity card |
| COMPLETE badge pop | ✅ | ❌ wrong position |
| Account hero banner | ✅ pop only | ❌ no confetti/check scale |
| Invoice preview hero-in | ✅ | ❌ wrong order/size |
| Pick card stagger | ✅ | ✅ adequate |
| Booking copy success | ✅ | ⚠️ link card weak |
| Plans card enter | ✅ | ⚠️ no trial splash |
| Paywall sheet stagger | ✅ | ⚠️ lighter than `274901` |

**Rule:** Do not re-motion in layout waves unless new nodes (confetti, hero) need enter.

---

### Fast path (agreed)

`0` ✅ → `1` → `8` → `7` → `2` → `9` → `17`

**Defer:** Wave 3 carousel · industry · rating · gallery · logo crop · `InvoiceAppearancePicker` in onboarding.

---

## Wave 1 — Setup UX foundation ✅

**Shipped** 2026-07-03.

**Scope:** `onboarding.css`, `SetupHeroBand.tsx`, `OnboardingShell.tsx` (optional `hero` + `progressVariant`), `/demo/setup-motion`

### Shipped

- Layout tokens on `.setup-flow` (`--setup-hero-height`, `--setup-hero-gradient`, `--setup-content-pad`, `--setup-identity-bg`, `--setup-cta-height`, `--setup-headline-size`, split overlap tokens)
- `.setup-split` / `__hero` / `__body` / `__footer` + `--overlap` rounded body lift
- `.setup-hero-band` gradient placeholder + `::after` scrim; variants `compact`, `tall`, `dark-footer`
- `.setup-body-headline` / `.setup-body-lead` for IF-style step titles
- `.onboarding-flow__progress--hero` (3px segments under hero)
- `.onboarding-flow--with-hero` shell hook
- `SetupHeroBand` component (`@/components/setup`) — `next/image` when `src` provided
- `OnboardingShell`: optional `hero` slot + `progressVariant="hero"`
- Demo panel: split shell + hero band (IF `274886` tag)

### Acceptance

- [x] `.setup-split` renders in demo with placeholder gradient
- [x] Tokens in `onboarding.css` comment block + SETUP_UX_PLAN Appendix F
- [x] No production route changes (welcome/onboarding unchanged)

---

## Wave 1 — reference (archived spec)

_Original planning notes — implemented above._

### 1.1 Layout tokens (add to `.setup-flow` block)

| Token | Suggested value | Use |
|-------|-----------------|-----|
| `--setup-hero-height` | `min(42vh, 320px)` | Top photo band |
| `--setup-hero-gradient` | dark bottom fade | Text on photo |
| `--setup-content-pad` | `20px` | Horizontal rhythm |
| `--setup-identity-bg` | `#f7f5f0` (warm cream) | Logo + name card |
| `--setup-cta-height` | `52px` | Primary button |
| `--setup-headline-size` | `clamp(28px, 7vw, 34px)` | Left-aligned heroes |

Document in `tokens.css` **only if** reused outside onboarding (else keep in `onboarding.css`).

### 1.2 Split shell pattern

New BEM block: `.setup-split`

```
.setup-split
  .setup-split__hero     ← optional image + gradient
  .setup-split__body     ← scrollable white/gray content
  .setup-split__footer   ← sticky CTA (or use onboarding-flow__footer)
```

- Hero: `background-image` + `linear-gradient` overlay (IF carousel style)
- Body: rounded top corners optional (`border-radius: 20px 20px 0 0` overlap) — match frame `274880`
- Safe areas: `env(safe-area-inset-*)` on hero and footer

### 1.3 Hero image component

**New:** `SetupHeroBand.tsx` (or static CSS classes only)

- Props: `src`, `alt=""`, `decorative`, `height` variant
- `prefers-reduced-motion`: no parallax
- Placeholder: blurred green gradient until Wave 15 assets land

### 1.4 Progress bar variant (IF style)

IF uses **2-segment** thick bar under hero on logo step (`274886`); Rinse uses **4-segment** thin bar in nav.

- Add `.onboarding-flow__progress--hero` — full-width, 3px, fewer segments visible under hero
- Keep existing 4-seg for form steps OR unify to % fill — **decide in Wave 5**

### Acceptance (archived)

- [x] `.setup-split` renders in demo with placeholder gradient
- [x] Tokens documented in `onboarding.css`
- [x] No route changes yet

---

## Wave 2 — Welcome — hero band & CTA hierarchy ✅

**Shipped** 2026-07-03.

**IF refs:** `274878` (welcome + ATT), compare `274877` splash

**Touches:** `src/app/welcome/page.tsx`, `onboarding.css` (`.welcome-screen*`), `/demo/setup-motion`

### Shipped

- `welcome/page.tsx` restructured to `.setup-split.setup-split--overlap` + `SetupHeroBand`
- Small `AppLogo` (40px) top of overlapped content body; left-aligned copy
- Single primary CTA + “Already have an account?” text link in sticky footer
- Removed centered hero layout and green radial logo glow
- Wave 48 motion retained via `welcome-screen--motion` + `staggerContainer`
- Demo welcome panel updated (IF `274878`–`274879` tag)

### Acceptance

- [x] Single obvious primary path
- [x] Hero band visible on iPhone SE and Pro Max
- [x] Stagger still replays on `/demo/setup-motion` welcome panel
- [x] No horizontal scroll

---

## Wave 2 — reference (archived spec)

### Current vs target

| Element | Current | Target (IF-inspired) |
|---------|---------|----------------------|
| Top | Centered logo + green radial glow | Hero band — detailing photo or soft gradient (`42vh`) |
| Title | Centered Syne headline | Large left-aligned or center title on solid bottom sheet |
| Features | `setup-feature-card` checklist (3 rows) | Remove or collapse to single subtitle line |
| CTAs | Primary + secondary + redundant sign-in link | One full-width primary “Get started”; text link “Already have an account?” |
| Logo | `AppLogo` 80px centered | Small logo in hero or status area only |

### Tasks

1. Restructure `welcome/page.tsx` to `.setup-split` or hero + content stack
2. Move `AppLogo` — smaller, top of content area (IF shows wordmark in content, not giant center mark)
3. Copy hierarchy:
   - Eyebrow: keep “Mobile detailing”
   - Title: keep or shorten to IF-style punch (“Run your business from your phone”)
   - Lead: one sentence; drop checklist **or** move one bullet to subtitle
4. CTA stack:
   - Remove duplicate “Sign in” button if footer link exists
   - Primary routes to `/auth?mode=signup`
5. Retain Wave 48 stagger — re-target selectors if DOM order changes
6. ATT / tracking dialog: **out of scope** (not applicable to web PWA)

### Visual spec

- **Background below hero:** `#f2f2f7` or white card overlapping hero (IF overlap at `274880`)
- **Primary button:** full width, `--setup-accent`, 52px height, 14px radius
- **Typography:** title `letter-spacing: -0.03em`; lead `17px` `--setup-muted`

### Acceptance (archived)

- [x] Single obvious primary path
- [x] Hero band visible on iPhone SE and Pro Max
- [x] Stagger still replays on `/demo/setup-motion` welcome panel
- [x] No horizontal scroll

---

## Wave 3 — Intro value carousel (3 slides)

**IF refs:** `274880`–`274883`

| Slide | IF headline | Rinse headline (proposed) |
|-------|-------------|---------------------------|
| 1 | Invoice in seconds | **Book from your phone** |
| 2 | Get paid faster | **Get paid faster** |
| 3 | Scan receipts | **Track every job** |

**Touches:** New route or welcome sub-flow: `/welcome/intro` or state machine in `welcome/page.tsx`

### Product decision (resolve before starting)

- [ ] **A)** Full 3-slide carousel before auth (IF parity)
- [ ] **B)** Single merged hero on welcome (Wave 2 only) — **skip Wave 3**
- [ ] **C)** Carousel only for first launch (`localStorage` flag)

### Tasks (if A or C)

1. `WelcomeIntroCarousel.tsx` — swipe or tap Continue; dot indicator
2. Each slide: `.setup-split` + unique hero image (Wave 15)
3. Dark gradient on hero; white headline left-aligned; Continue sticky bottom
4. Final slide → `/auth?mode=signup`
5. Back chevron on slides 2–3
6. Motion: `setup-step-in` on slide change (`key={slideIndex}`); optional horizontal slide (new archetype — document in `MOTION_SPEC.md`)
7. `prefers-reduced-motion`: crossfade only

### Acceptance

- [ ] 3 slides match IF layout rhythm
- [ ] Skip / Already have account escape hatch
- [ ] Analytics: `trackOnboardingStepViewed` equivalent for intro slides

---

## Wave 4 — Auth — layout, copy, signup value strip

**IF refs:** Minimal direct analog; general iOS auth patterns

**Touches:** `AccountAuth.tsx`, `auth-flow.css`, `SocialAuthButtons.tsx`

### Tasks

1. **Logo size** — reduce to 48px (demo uses 48; production 56 → align)
2. **Signup value props** — IF doesn’t show checklist on auth; consider:
   - Remove `auth-value-props` on signup **or**
   - Single line under subtitle instead of card list
3. **OAuth buttons** — full width, equal height, IF-style white cards with border (already close)
4. **Mode switch** — “Create account” / “Sign in” as text toggle below form (reduce footer clutter)
5. **Forgot password** — keep; ensure `setup-step-in` on `key={mode}` still works
6. **Slug preview** on signup — keep; style as subtle caption (`auth-slug-preview`)
7. **Post-signup routing** — unchanged → `onboarding/business`

### Layout spec

- Max readable width: `100%` (mobile-first; no narrow column)
- Title: left-aligned Syne 30px (already)
- Form fields: `SetupRowField` grouped in `.ob-field-group`

### Acceptance

- [ ] Login and signup feel like same screen family as welcome
- [ ] No duplicate value prop content vs welcome
- [ ] Demo auth panel updated in `/demo/setup-motion`

---

## Wave 5 — Onboarding shell — hero strip + progress

**IF refs:** `274886` (progress under hero), `274885` business setup

**Touches:** `OnboardingShell.tsx`, `onboarding.css` (`.onboarding-flow*`)

### Tasks

1. Optional `heroImage` prop on `OnboardingShell` — renders `SetupHeroBand` above nav
2. Per-step hero map:

   | Step | Hero (proposed) |
   |------|-----------------|
   | business | Detailer at van / mobile setup |
   | your-invoice | Invoice on phone mockup (or none — success beat in Wave 8) |
   | booking | Client booking on phone |
   | plans | Clean abstract / omit |

3. **Progress bar position:**
   - Move below hero when hero present
   - IF: 2-step segments on logo flow; Rinse: consider **step X of 4** fill bar vs 4 pills
4. Nav title — keep centered; back button unchanged
5. Footer blur bar — keep `backdrop-filter` (already iOS-like)

### Open decision

- [ ] Unified progress: single bar `width: (step/4)*100%` vs 4 segments

### Acceptance

- [ ] Business step shows hero + progress like `274886` frame 1
- [ ] Body scroll independent of hero
- [ ] `OnboardingShell` API backward compatible (hero optional)

---

## Wave 6 — Business step — section hierarchy & fields

**IF refs:** `274885`–`274887` (business setup context)

**Touches:** `OnboardingBusinessStep.tsx`, `onboarding.css`

### Tasks

1. **Reorder content** (IF is logo-first on upload screen; Rinse is form-first):
   - Option A: Logo identity block **above** business fields (IF priority)
   - Option B: Keep fields first but add section intro matching IF headline pattern
   - **Recommend:** Logo section immediately after intro line, then business fields
2. Section labels (`.ob-section-label`) — uppercase 11px tracking (already); add spacing `24px` between sections
3. **Intro line** — keep “Quick setup — then you'll see your first invoice.” — style as IF subtitle (`16px`, muted)
4. Required field indicators — phone + name; optional email/address footnote
5. Continue disabled state — visual mute on footer CTA (already); add hint when disabled: “Add business name and phone”
6. Wire `OnboardingShell` hero from Wave 5

### Acceptance

- [ ] Clear scan path: intro → logo → details → continue
- [ ] Footnote visible without scroll on common devices
- [ ] Fields match `SetupRowField` iOS table style

---

## Wave 7 — Logo — identity card, picker sheet, COMPLETE

**IF refs:** `274886`–`274890` ⭐ (hero 5 in `invoice-fly/README.md`)

**Touches:** `OnboardingBusinessStep.tsx`, `onboarding.css`, new sheet or `VaulSheet`

### Current vs target

| Element | Current | Target |
|---------|---------|--------|
| Logo display | 96px square, centered | **Identity card** on cream `--setup-identity-bg`: logo + business name + optional tagline |
| Empty state | “Add logo (optional)” pill | Large gray placeholder + “Choose image” (IF `274886`) |
| Picker | Hidden file input | **Bottom sheet:** Take photo / Choose from gallery / Cancel |
| Progress | Thin bar during save | Same + page-level segment fill under hero |
| Complete | Corner badge “Complete” | **Centered green pill** “COMPLETE” below card (IF `274890`) |
| Live update | Preview on file select | Card updates name from `businessName` state live |

### Tasks

1. New markup: `.onboarding-identity-card`
   - Left: logo or placeholder icon
   - Right: `businessName` or “Your business”; subline “Mobile detailing” or city if available
2. Replace corner `::after` Complete badge with `.onboarding-identity-complete` element below card
3. `VaulSheet` or `BottomSheet variant="light"` for image source:
   - Take photo (`capture="environment"`)
   - Choose from gallery
   - Cancel
4. Sheet header: “Select image” (IF blue header — use `--setup-accent` or neutral surface)
5. Upload progress: keep `onboarding-logo-progress`; position under card
6. Motion: retain `success-pop` on logo; `badge-status-in` on COMPLETE pill
7. `onboarding-logo-picker` — deprecate gradually; migrate styles to identity card

### Acceptance

- [ ] Side-by-side with `274890`: card + centered COMPLETE + Continue in footer
- [ ] Sheet picker works on iOS Safari + Chrome Android
- [ ] Complete state without logo (skip) — no COMPLETE pill; optional remains optional

---

## Wave 8 — Account created — dedicated success beat

**IF refs:** `274896`–`274901` ⭐ (hero 3 — highest impact)

**Touches:** `OnboardingYourInvoiceStep.tsx` or new interim step / sub-view, `onboarding.css`

### Current vs target

| Element | Current | Target |
|---------|---------|--------|
| Structure | Single step: banner + picker + preview | **Beat 1:** Success screen → **Beat 2:** Customize invoice |
| Invoice preview | Below picker | **Above** checkmark; large; bottom fade into background |
| Success | Inline `onboarding-account-hero` banner | Large check circle + **confetti dots** burst |
| Headline | “You're set — here's your first invoice” | “You're ready!” / “Your first invoice” + body copy |
| CTA | Shell Continue | “See my invoice” or “Continue” → reveals picker |
| Phase pills | Menu / Preview / Share | Remove or move to Beat 2 only |

### Tasks

1. **Two-phase step** inside `your-invoice` (state `phase: 'success' | 'customize'`):
   - `success`: preview hero top, confetti + check, headline, subcopy, single CTA
   - `customize`: current picker + preview (phase pills optional)
2. New CSS:
   - `.onboarding-success-screen`
   - `.onboarding-success-check` — 72px circle, `--setup-accent`, white check
   - `.onboarding-success-confetti` — 12–16 absolutely positioned dots; `success-pop` + optional `attention-pulse` loop (Wave 53 utility)
   - `.onboarding-invoice-preview--success-hero` — max-height ~40vh, `mask-image` fade bottom
3. Invoice preview uses live `InvoiceTemplateMock` with settings from business step
4. On first paint of step, default `phase='success'`; CTA → `phase='customize'`
5. Update `MOTION_SPEC.md` Hero 3 status: layout shipped
6. Demo panel: add replay for success beat

### Motion spec (layout + existing archetypes)

- Preview: `onboarding-invoice-hero-in` (existing)
- Check: `success-pop` 400ms
- Confetti dots: staggered `success-pop` 50ms steps
- Reduced motion: static check + preview, no confetti

### Acceptance

- [ ] Emotional peak matches `274896` screenshot composition
- [ ] User can still pick package and continue onboarding
- [ ] Screen reader: success announced once (`role="status"`)

---

## Wave 9 — Your invoice — preview hierarchy & picker

**IF refs:** `274896` (preview card), `274937` (invoice preview polish)

**Touches:** `OnboardingYourInvoiceStep.tsx`, `onboarding.css`

### Tasks (customize phase — after Wave 8)

1. Remove or demote `onboarding-first-invoice-phases` pills if redundant
2. **Section order:** Preview banner → package picker → live preview (picker drives mock)
3. `ob-pick-card` — tighten to IF line-item feel:
   - Strong title, muted subline (vehicle type), right-aligned price
   - Selected check circle (already `ob-pick-card--on`)
4. Preview card shadow — `--setup-shadow-lg`; rounded 16px
5. `onboarding-preview-banner` — keep “Preview only — nothing is sent.”
6. Template/accent customization — if in scope, link to settings footnote (already in footnote copy)

### Acceptance

- [ ] Changing package updates preview instantly
- [ ] Preview readable without zooming
- [ ] Wave 48 stagger on pick cards intact

---

## Wave 10 — Booking link — share moment & link card

**IF refs:** None direct; Rinse-specific differentiator

**Touches:** `OnboardingBookingStep.tsx`, `onboarding.css`

### Tasks

1. **Hero moment** — treat copy/share as mini success:
   - Headline: “Your booking link is live”
   - Sub: brand name interpolated
2. Link display — monospaced URL in elevated card (not bare row); truncate middle on small screens
3. Copy success — keep green `onboarding-booking-actions__btn--success`; add brief “Link copied” toast inline
4. Share button — primary when `navigator.share` available; secondary copy otherwise
5. `WebsiteBookingGuide` compact — collapse to expandable “Where to share”
6. Continue label logic — keep `linkActionDone ? 'Enter Rinse' : 'Continue'`; consider renaming to “Finish setup”
7. Optional hero image from Wave 5 (client on phone)

### Acceptance

- [ ] User understands what the link is for
- [ ] Copy/share work on mobile Safari
- [ ] Empty slug state graceful (already)

---

## Wave 11 — Plans & trial — card layout & CTA stack

**IF refs:** `274893` (rating modal tone — celebratory but not blocking)

**Touches:** `OnboardingPlansStep.tsx`, `onboarding.css`, `paywall-sheet.css` (visual only)

### Tasks

1. Plans card — IF-style elevated single plan:
   - Price prominent top-right
   - Feature list with check icons (not bullets)
   - Trial badge inline with Sparkle
2. CTA order:
   - Primary: “Start free trial” / “Get started” (continue trial)
   - Secondary: Subscribe now (outline)
3. Footnote — 14-day trial copy; smaller below card
4. Remove visual competition with paywall — onboarding plans is softer than `PaywallSheet`
5. Motion: keep `onboarding-plans-card` entrance stagger

### Acceptance

- [ ] User can complete onboarding without subscribing
- [ ] Checkout redirect unchanged functionally
- [ ] Card matches depth tokens (`--setup-shadow`)

---

## Wave 12 — Paywall & post-setup prompts

**IF refs:** `274893`–`274895` (rating prompt + App Store dialog)

**Touches:** `PaywallSheet.tsx`, `paywall-sheet.css`, future `RatingPrompt` (optional)

### Tasks

1. **Paywall visual pass** (not motion):
   - Crown icon size + plan row spacing vs IF sheets
   - Feature list alignment with Wave 11 plans card
2. **Rating prompt** — product decision:
   - [ ] Defer (web app — no App Store)
   - [ ] Soft “Enjoying Rinse?” after onboarding complete → feedback link
3. If feedback prompt: use `BottomSheet` nudge pattern; single primary CTA
4. Align `mode="nudge"` copy with setup tone

### Acceptance

- [ ] Paywall readable in demo panel
- [ ] No App Store references on web

---

## Wave 13 — Edge states — loading, errors, empty, offline

**Touches:** `auth-loading-screen`, `onboarding-error`, `AccountAuth`, all onboarding steps

### Tasks

1. **Loading** — replace plain “Loading…” with branded skeleton:
   - Shell progress + gray pills for fields
   - Or `ScreenLoading` if extended for client-light
2. **Errors** — `onboarding-error` / `auth-error`: icon + message + retry where applicable
3. **Empty packages** on your-invoice — illustrated empty (reuse `EmptyIllustration` Wave 53)
4. **Offline** — PocketBase unreachable during onboarding: banner from offline pattern
5. **Auth** — `AUTH_PB_NOT_CONFIGURED` info box styled as setup card not alert red

### Acceptance

- [ ] No unstyled error text
- [ ] Loading doesn’t flash success beat (Wave 8)

---

## Wave 14 — Copy & microcopy pass

**Touches:** All setup strings in components + `welcome/page.tsx`

### Voice rules

- Second person (“your business”, “you’re ready”)
- Short headlines ≤ 6 words where possible
- Avoid “invoice” overload — balance with jobs, clients, booking

### String audit checklist

| Location | Key string | Review |
|----------|------------|--------|
| Welcome | title, lead, CTAs | ☐ |
| Auth signup | subtitle, value props | ☐ |
| Business intro | bridge line | ☐ |
| Logo | button labels, complete | ☐ |
| Success beat | headline, body, CTA | ☐ |
| Your invoice | section labels, banner | ☐ |
| Booking | headline, footnote | ☐ |
| Plans | trial, features, CTAs | ☐ |

### Acceptance

- [ ] No duplicate sign-in paths on welcome
- [ ] Terminology consistent with home dashboard

---

## Wave 15 — Assets — hero photos, confetti, identity mock

**Touches:** `public/setup/`, `SetupHeroBand`, `next/image` config

### Asset list

| Asset | Filename (proposed) | Used in |
|-------|---------------------|---------|
| Welcome hero | `setup-hero-welcome.webp` | Wave 2 |
| Carousel 1–3 | `setup-carousel-{1,2,3}.webp` | Wave 3 |
| Business hero | `setup-hero-business.webp` | Wave 5–7 |
| Booking hero | `setup-hero-booking.webp` | Wave 10 |
| Confetti dots | CSS-only preferred | Wave 8 |

### Tasks

1. Source detailing-specific photography (licensed or original) — **no generic IF crops**
2. Optimize WebP ≤ 150KB each; `sizes` for hero band
3. Blur placeholder `placeholder="blur"` with LQIP
4. Git LFS decision — document in open decisions
5. Fallback gradient when image fails to load

### Acceptance

- [ ] Lighthouse LCP acceptable on `/welcome`
- [ ] Images work offline after first load (PWA cache optional)

---

## Wave 16 — A11y, safe areas, reduced-motion layout

**Touches:** All setup routes, `a11y-high-contrast.css` if needed

### Tasks

1. Focus order on success beat — preview decorative? `aria-hidden` on confetti
2. Sheet picker — focus trap, Escape close (`a11y-sheets` rule)
3. Color contrast on green COMPLETE pill — verify 4.5:1
4. `prefers-reduced-motion`: confetti off; hero parallax off; stagger off (Wave 48 already)
5. Touch targets ≥ 44px on all CTAs and pick cards
6. High contrast mode spot check

### Acceptance

- [ ] VoiceOver can complete full onboarding
- [ ] No information conveyed by animation alone

---

## Wave 17 — Demo lab + QA checklist

**Touches:** `src/app/demo/setup-motion/page.tsx`, `demo-motion` CSS

### Tasks

1. Add demo panels for new layouts:
   - Welcome hero split
   - Identity card empty / complete / uploading
   - Success beat (phase 1) isolated replay
   - Carousel slide 1 (if Wave 3)
2. Side-by-side frame ID labels on each panel (e.g. “IF 274896”)
3. QA checklist markdown in this file Appendix J
4. Link from `STYLE_PLAN.md` active wave line

### Appendix J — QA checklist (per release)

- [ ] iPhone SE — no clip; footer CTA visible
- [ ] iPhone Pro Max — hero not excessive
- [ ] Android Chrome — file picker sheet
- [ ] Desktop narrow — still mobile column ~420px
- [ ] Reduce motion ON — layouts intact
- [ ] Signup → business → invoice success → booking → plans → home
- [ ] Demo replay buttons work after layout DOM changes

---

## Open decisions

### Resolved in Wave 0 ✅

| Decision | Resolution |
|----------|------------|
| Carousel (Wave 3) | **Defer** — single welcome hero (Wave 2) for MVP |
| Business step order | **Logo block after intro, before fields** |
| Progress UI | **Dual mode:** fill bar under hero when hero present; 4-seg nav fallback |
| Success beat | **Two-phase single step** on `your-invoice` |
| Hero photos MVP | **CSS gradient placeholders** Wave 1; WebP Wave 15 |
| Rating prompt | **Skip App Store** on web |
| Industry step (`274884`) | **Skip** — single vertical (detailing) |
| Logo crop (`274889`) | **Defer** — upload without crop for MVP |
| `InvoiceAppearancePicker` in onboarding | **Defer** — preview only; customize in Settings |
| Assets hosting | **`public/setup/`** bundled; LFS if > ~800KB |
| Missing frame `274898` | Not in export; ignore in implementation |

### Still open before **Wave 1**

- [ ] Confirm gradient-only heroes acceptable until Wave 15 (or provide 1 stock photo for welcome now)
- [ ] Paywall: align with `274901` full-screen vs keep sheet-only nudge

### Still open before **Wave 15**

- [ ] Git LFS for `public/setup/*.webp`?
- [ ] `next/image` remote patterns if CDN added later

---

## File ownership map

| File | Waves |
|------|-------|
| `src/app/onboarding/onboarding.css` | 1–12, 16 |
| `src/app/auth-flow.css` | 4, 13 |
| `src/app/welcome/page.tsx` | 2, 3 |
| `src/components/onboarding/*.tsx` | 5–11 |
| `src/components/AccountAuth.tsx` | 4, 13 |
| `src/components/PaywallSheet.tsx` | 12 |
| `src/app/demo/setup-motion/page.tsx` | 1, 17 |
| `src/components/setup/SetupHeroBand.tsx` | 1+ |
| `src/components/setup/index.ts` | 1+ |
| `design-references/MOTION_SPEC.md` | 0, 8 |
| `public/setup/*` | 15 |

---

## Active wave

**Current:** Waves 3–14 complete ✅ → next **Wave 15** (hero photography) or **Wave 17** (demo QA checklist)

_Update this line when starting each wave._
