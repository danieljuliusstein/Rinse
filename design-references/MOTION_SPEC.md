# Motion spec

How to describe and implement animations without pasting motion into chat.
Reference frames: `invoice-fly/` (ScreenDesigns replays).

---

## How to use in Cursor

1. Scrub sequential frames in `invoice-fly/` (IDs are ordered)
2. Pick **start / mid / end** frames (3–5 files)
3. `@`-attach them in chat, OR cite frame IDs
4. Name the **archetype** from the table below
5. Fill a spec row (template at bottom) when tagging new flows

---

## 12 archetypes

| Archetype | Typical properties | Duration | Easing | Extend in |
|-----------|-------------------|----------|--------|-----------|
| `sheet-enter` | `translateY(100%→0)`, scrim `opacity 0→1` | 250–320ms | spring | `globals.css` `inv-sheet-up` |
| `sheet-exit` | reverse of enter, often faster | 180–220ms | ease-in | `globals.css` |
| `list-stagger` | children `opacity`, `translateY(8px→0)`, staggered delay | 200–280ms each | ease-out | `pipeline.css` `pipeline-stage-in`; Home `app-ui.css` `home-block-in` (incl. Slice W readiness rows) |
| `press-depth` | `scale(0.97–0.98)`, bg → `--bg-surface-active` | 100–150ms | ease | `globals.css` `.card-pressable` |
| `pill-spring` | `scale(0.9→1)` with overshoot | 250–300ms | pop | `premium-sheet.css` `form-pill-pop` |
| `progress-fill` | `width 0→N%` | 300–500ms | ease-out | `premium-sheet.css` progress bars |
| `success-pop` | checkmark `scale`, brief green flash | 300–400ms | pop | `premium-sheet.css` `.sheet-submit--done` |
| `tab-active` | icon `scale(1→1.1)` or dot slide | 150–200ms | spring | `globals.css` bottom-nav |
| `swipe-reveal` | row `translateX`, actions fade in | 200ms | ease-out | `SwipeableRow`, `InvoiceSwipeableRow` |
| `empty-enter` | illustration + text fade up | 350–450ms | ease-out | `components.css` empties |
| `counter` | number roll / count-up | 400–600ms | ease-out | `@/components/ui/CurrencyAmount` (`motion-number`) |
| `layout-morph` | shared `layoutId` list → detail overlay | ~350ms | spring | `DetailOverlayProvider`, `MorphSurface`, `ListRow` |
| `attention-pulse` | subtle `opacity` or `scale` loop | 1.5–2s loop | ease-in-out | `pipeline.css`, `rinse-tour.css` |

### Spring / pop curves (iOS-style)

```css
/* spring — sheets, tab active */
cubic-bezier(0.32, 0.72, 0, 1)

/* pop — pills, success */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* step enter — onboarding */
cubic-bezier(0.22, 1, 0.36, 1)
```

Add these as tokens in `tokens.css` when implementing foundation phase.

**Wave 40:** Tokens live in `src/app/tokens.css` — use `var(--ease-spring)` etc. in new CSS.

---

## Reduced motion

Every new animation must include:

```css
@media (prefers-reduced-motion: reduce) {
  /* animation: none; or instant opacity/transform */
}
```

See `rinse-tour.css` and `globals.css` for existing patterns.

---

## Motion intensity by surface

| Surface | Stagger? | Spring? | Notes |
|---------|----------|---------|-------|
| Settings | No | Light | Row press only |
| Home / lists | Yes | Medium | Stagger on load |
| Sheets | No | Yes | Spring enter + scrim |
| Onboarding | Step-based | Yes | Hero moments on success |
| Client book/portal | Step-based | Medium | Separate `--cl-*` tokens |

---

## Spec template

Copy one block per flow you tag in `invoice-fly/README.md`:

```markdown
### [Screen name]

- **Frame range:** 274877–274890
- **Archetype:** sheet-enter
- **Trigger:** tap FAB
- **What moves:** sheet slides up; scrim fades 0→40%
- **Feel:** iOS spring, ~280ms, slight settle at end
- **Rinse target:** BottomSheet / inv-sheet
- **Owner file:** globals.css
- **Status:** shipped (Wave 41) | planned | shipped
```

---

## Logged specs

_Phase 0 mapped 2026-07-02. Full index: `invoice-fly/README.md`._

### Hero 1 — Send invoice sheet ⭐ Wave 41

- **Frame range:** 275001–275006 (scrub sequential)
- **Archetype:** sheet-enter
- **Trigger:** tap Send on invoice preview
- **What moves:** action sheet slides up; scrim fades 0→~40%; FAB mic visible above sheet
- **Feel:** iOS spring, ~280ms, slight settle
- **Rinse target:** `BottomSheet`, `.inv-sheet-root`, send dock on job invoice
- **Owner file:** `globals.css`
- **Status:** tagged

### Counter — rolling money totals (Premium UX Wave A)

- **Archetype:** counter
- **Trigger:** KPI / total `value` changes after mount
- **What moves:** digit roll via `motion-number` inside `CurrencyAmount`
- **Feel:** ease-out ~500ms; snap on `prefers-reduced-motion`
- **Rinse target:** Home AR/revenue, Reports KPIs, invoice totals, portal pay amount
- **Owner file:** `@/components/ui/CurrencyAmount.tsx`
- **Status:** shipped

### Hero 2 — Invoices dashboard ⭐ Wave 43/46

- **Frame range:** 275146–275151
- **Archetype:** list-stagger, counter
- **Trigger:** navigate to Invoices tab/screen
- **What moves:** KPI card + chart fade up; invoice rows stagger in; unpaid badge color
- **Feel:** gentle ease-out, 50ms stagger between rows
- **Rinse target:** `/invoices`, home KPI blocks
- **Owner file:** `app-ui.css`, `components.css`
- **Status:** shipped (Wave 46 — invoices list + swipe; job invoice send toast)

### Hero 3 — Account created success ⭐ Wave 48

- **Frame range:** 274896–274901
- **Archetype:** success-pop
- **Trigger:** onboarding account creation complete
- **What moves:** checkmark scale pop; confetti dots burst; invoice preview card above
- **Feel:** pop easing, ~400ms
- **Rinse target:** onboarding first-invoice / welcome completion
- **Owner file:** `onboarding.css`
- **Status:** motion shipped (Wave 48 — `onboarding-account-hero`); **layout gap** → Setup UX Wave 8 (`274896`)

- **Frame range:** 275179–275179 (open) + prior frames for enter
- **Archetype:** sheet-enter
- **Trigger:** tap Voice settings row
- **What moves:** half-height sheet; scrim dims settings; selected row checkmark
- **Feel:** spring, ~300ms
- **Rinse target:** `VaulSheet` / light picker sheets in settings
- **Owner file:** `globals.css`, `settings.css`
- **Status:** shipped (Wave 41 — scrim; vaul handles slide)

### Hero 5 — Logo upload progress ⭐ Wave 48

- **Frame range:** 274886–274890
- **Archetype:** progress-fill, success-pop
- **Trigger:** complete logo upload step
- **What moves:** progress bar fills; COMPLETE badge pops; logo card preview
- **Feel:** progress 400ms ease-out; badge pop 300ms
- **Rinse target:** onboarding business logo sub-step
- **Owner file:** `onboarding.css`
- **Status:** motion shipped (Wave 48 — `onboarding-logo-progress` + COMPLETE badge); **layout gap** → Setup UX Wave 7 (`274890`)

- **Frame range:** 274921–274926
- **Archetype:** attention-pulse
- **Trigger:** first new invoice tutorial
- **What moves:** dim overlay; tooltip bubble + green arrow to “Add client”
- **Feel:** tooltip fade+slide, pulsing highlight on CTA
- **Rinse target:** first job/invoice empty state coachmark
- **Owner file:** `components.css`
- **Status:** tagged

### Voice to invoice recording — Wave 41/53

- **Frame range:** 275040–275047
- **Archetype:** attention-pulse
- **Trigger:** open voice invoice sheet, recording active
- **What moves:** mic rings pulse; waveform bars animate; example pills horizontal scroll
- **Feel:** 1.5s loop pulse on mic; waveform real-time
- **Rinse target:** future voice feature or FAB mic — defer unless product ships voice
- **Owner file:** —
- **Status:** tagged (defer)

---

## Setup UX layout specs

_Layout + hierarchy pass — [`SETUP_UX_PLAN.md`](./SETUP_UX_PLAN.md) Waves 0–17. **Wave 0 second pass:** 27 frames `274877`–`274909` indexed (see SETUP_UX_PLAN Appendix B). Motion archetypes above stay valid._

### Layout spec template

```markdown
### [Screen name]

- **Frame range:** 274878–274879 (scrub 5–10 sequential)
- **Setup UX wave:** 2
- **Layout model:** split-hero | full-bleed | centered | sheet-overlay
- **Hero:** height ~42vh, lifestyle photo, dark gradient bottom OR white content overlap
- **Type:** headline left/center, size ~28–34px bold; subtitle 15–17px muted
- **Primary CTA:** 1× sticky bottom, full width, 52px, gradient or flat accent
- **Secondary:** text link only (no second full-width button)
- **Cards:** cream identity `#f7f5f0`, invoice preview fade mask, iOS grouped table
- **Rinse route:** `/welcome`
- **Gap vs Rinse today:** [bullet list]
- **Owner file:** `onboarding.css`
- **Status:** audited (Wave 0) | planned | shipped
```

---

### Splash — IF only (no Rinse route)

- **Frame range:** `274877`
- **Setup UX wave:** —
- **Layout model:** centered
- **Hero:** none — white full screen
- **Type:** logo only, centered
- **Primary CTA:** none (auto-advance splash)
- **Rinse route:** — (Rinse uses inline app load; no splash screen)
- **Status:** audited (Wave 0) — **out of scope**

---

### Welcome + ATT

- **Frame range:** `274878`–`274879`
- **Setup UX wave:** 2
- **Layout model:** **split-hero** — photo top ~45%, white content bottom ~55%
- **Hero:** lifestyle photo (grass / outdoor); sharp horizontal cut to white (no wave SVG in IF)
- **Type:** center-aligned; app name **bold ~32px**; tagline **17px** muted gray; emoji optional in tagline
- **Primary CTA:** **1×** full-width bottom; **blue vertical gradient**; label “Get started”; ~52px height; 14px radius; soft shadow
- **Secondary:** “Already have an account?” — **text link** center, accent blue; no second filled button
- **Cards:** none on welcome (no feature checklist)
- **Rinse route:** `/welcome`
- **Gap vs Rinse today:** centered logo + green glow; `setup-feature-card` checklist; dual filled CTAs + redundant sign-in link; no photography
- **Status:** audited (Wave 0)

**Frame notes:**
- `274878` — iOS ATT dialog over welcome (web: skip)
- `274879` — clean target state for layout

---

### Intro value carousel (3 slides)

- **Frame range:** `274880`–`274883`
- **Setup UX wave:** 3
- **Layout model:** **full-bleed hero** top ~60% + **dark content** bottom ~40%
- **Hero:** unique **looping muted video** per slide (ScreenDesigns frames look like stills — motion does not export); bottom **dark gradient** into black content area
- **Type:** **left-aligned** white headline ~30px bold; subtitle ~16px light gray; 20px horizontal pad
- **Primary CTA:** **1×** “Continue” sticky bottom on dark; blue gradient button
- **Secondary:** back chevron top-left on slides 2–3
- **Cards:** none
- **Rinse route:** none today → proposed `/welcome/intro` or welcome state machine
- **Gap vs Rinse today:** entire carousel missing; Rinse goes welcome → auth

| Slide | Frame | IF headline | Rinse headline (proposed) |
|-------|-------|-------------|---------------------------|
| 1 | `274880` | Invoice in seconds | Book from your phone |
| 2 | `274881` | Get paid faster | Get paid faster |
| 3 | `274882` | Scan and save receipts | Track every job |

- **Transition:** `274883` → Business Info (first form) — progress bar appears
- **Status:** audited (Wave 0)

---

### Business info (first form)

- **Frame range:** `274883`–`274884`
- **Setup UX wave:** 5–6 (fields) · `274884` industry **out of scope**
- **Layout model:** **split-hero** — office building photo ~35%; white body below
- **Hero:** architectural / business context photo
- **Progress:** thin bar **under hero** — ~25% fill (step 1 of multi-step)
- **Type:** left “Business Info” **bold ~28px**; helper “Required, can be edited any time” 13px gray
- **Primary CTA:** sticky “Continue” gradient blue
- **Fields (`274883`):** **single** prominent row first (building icon + business name)
- **Rinse route:** `/onboarding?step=business`
- **Gap vs Rinse today:** no hero; 4 field rows upfront; 4-seg progress in nav not under hero
- **Status:** audited (Wave 0)

---

### Industry picker (IF only — skip for Rinse)

- **Frame range:** `274884`
- **Setup UX wave:** —
- **Layout model:** split-hero + searchable radio list
- **Hero:** workbench / tools photo
- **Progress:** ~40% fill
- **Type:** “Industry” bold; subtitle explains personalization
- **List:** search field + scrollable radio rows (Carpentry, Cleaning, …); blue check on select
- **Rinse route:** — (single vertical: mobile detailing; no industry step)
- **Status:** audited (Wave 0) — **out of scope** per Appendix H

---

### Upload logo — empty + picker

- **Frame range:** `274885`–`274888`, `274887` (permission)
- **Setup UX wave:** 7
- **Layout model:** split-hero (tradesperson photo) + form body
- **Hero:** workshop / hard-hat lifestyle; same strip as business
- **Progress:** ~50% fill on 2-segment bar under hero
- **Type:** “Upload logo” bold left; “Optional, can be edited any time” muted
- **Primary CTA:** sticky Continue (always visible; sheet overlays)
- **Upload area:** large **light blue-gray** rounded rect; inner white pill “Choose image” + pencil icon
- **Sheet overlay (`274886`):** “Select image” header bar; rows: Take from camera / Choose from gallery; Cancel with X
- **Gallery (`274888`):** full-screen grid 3-col; Photos/Collections segment; not needed for Rinse MVP (use native picker)
- **Permission (`274887`):** iOS Photos permission — web uses `<input accept="image/*">` + optional `capture`
- **Rinse route:** logo section in `OnboardingBusinessStep`
- **Gap vs Rinse today:** small centered logo square; hidden file input; no hero strip; no source sheet
- **Status:** audited (Wave 0)

---

### Logo upload complete

- **Frame range:** `274890`
- **Setup UX wave:** 7
- **Layout model:** split-hero + identity card
- **Hero:** same trades photo strip
- **Progress:** ~50% (logo step done)
- **Identity card:** **cream/tan** rounded rect ~90% width; logo left + wordmark + tagline (“Design studio — est. 2026”)
- **COMPLETE badge:** **centered green pill** below card (not corner); uppercase; pops after upload
- **Primary CTA:** Continue gradient bottom
- **Rinse route:** `onboarding-logo-picker--complete`
- **Gap vs Rinse today:** corner `::after` badge; 96px square only; no business name on card
- **Status:** audited (Wave 0)

**Frame notes:**
- `274889` — iOS crop editor after pick; optional web crop in Wave 7 (defer MVP)

---

### Logo crop (optional)

- **Frame range:** `274889`
- **Setup UX wave:** 7 optional
- **Layout model:** full-screen iOS crop chrome
- **Content:** beige identity preview with corner handles; Cancel / Done
- **Rinse route:** — today uploads without crop
- **Gap:** none for MVP; add `canvas` crop if large uploads become issue
- **Status:** audited (Wave 0) — **defer**

---

### Rating + social proof

- **Frame range:** `274893`–`274895`
- **Setup UX wave:** 12 (defer App Store on web)
- **Layout model:** centered marketing + **modal overlay**
- **Hero:** none — white page
- **Progress:** thin blue bar ~75%
- **Type:** “Give us a rating” blue bold; subtitle black; avatar cluster + “+ 1M users”; 5 yellow stars
- **Carousel:** horizontal testimonial cards (light blue active card)
- **Modal (`274893`):** “Enjoying Invoice Fly?”; 5 blue stars; Submit / Cancel
- **Thanks modal (`274894`):** orange stars; Write a Review / OK
- **Primary CTA:** page Continue behind modal; shimmer on button in some frames
- **Rinse route:** none — optional post-onboarding feedback
- **Gap vs Rinse today:** not implemented (correct for web PWA)
- **Status:** audited (Wave 0) — **recommend skip** App Store; optional feedback sheet later

---

### Account created success ⭐

- **Frame range:** `274896`–`274897` (+ motion through `274901` for downstream monetization)
- **Setup UX wave:** 8
- **Layout model:** **centered celebration** — white/gray background
- **Invoice preview:** **top third**; full invoice mock; **bottom fade** into background; shadow
- **Success icon:** **72px+ blue circle** white check; **confetti dots** ring (blue + orange, varied sizes)
- **Type:** “Account created!” **center bold ~28px**; body 2 lines center 15px gray
- **Primary CTA:** “Start Invoice Tutorial” full-width gradient (Rinse: “See my invoice” / “Continue”)
- **Overlays:** `274897` notification permission — **skip on web**
- **Rinse route:** `/onboarding?step=your-invoice` (today: inline banner, preview below picker)
- **Gap vs Rinse today:** no confetti; no large check; preview not above success; picker on same screen
- **Status:** audited (Wave 0) — **hero layout #1**

**Frame-by-frame (success + monetization):**

| Frame | What changes | Rinse action |
|-------|--------------|--------------|
| `274896` | Full success — preview, confetti ring, check, copy, CTA | **Target layout** |
| `274897` | Same + notification permission modal | Skip on web |
| `274898` | — | Missing from export |
| `274899` | Trial splash “Try 3 days For Free!” | Wave 11 |
| `274901` | Full PRO paywall | Wave 12 |

---

### Trial promo splash

- **Frame range:** `274899`
- **Setup UX wave:** 11
- **Layout model:** centered full-screen
- **Hero:** soft blue radial gradient; sparkle stars
- **Type:** “Try 3 days” gradient text + “For Free!” bold black center
- **Primary CTA:** implied transition to paywall
- **Rinse route:** `/onboarding?step=plans` (partial — trial banner exists)
- **Gap vs Rinse today:** no full-screen trial moment; inline `onboarding-plans-trial` only
- **Status:** audited (Wave 0)

---

### PRO paywall

- **Frame range:** `274901`
- **Setup UX wave:** 12
- **Layout model:** scrollable marketing + plan cards
- **Hero:** crown/logo with orbital feature icons
- **Type:** “GET PRO ACCESS” / “GO UNLIMITED” badge
- **Cards:** 3 plan rows; selected border; “BEST OFFER” pill
- **Primary CTA:** “Try for Free” + trust line
- **Rinse route:** `PaywallSheet` (nudge mode different — align visual weight in Wave 12)
- **Status:** audited (Wave 0)

---

### Invoice preview (operator reference)

- **Frame range:** `274937`
- **Setup UX wave:** 9 (preview polish only)
- **Layout model:** full-page preview + action sheet + modal
- **Relevance:** invoice card depth, line items, balance band — inform `InvoiceTemplateMock` hero sizing
- **Rinse route:** `onboarding-invoice-preview--hero`
- **Gap vs Rinse today:** preview smaller; less “document” presence
- **Status:** audited (Wave 0)

---

### Preview & customize invoice

- **Frame range:** `274903`
- **Setup UX wave:** 9 (defer deep customize in onboarding)
- **Layout model:** full-page preview + template thumbnails + bottom tool tabs
- **Nav:** “Preview & Customize” centered title; back chevron
- **Preview:** large invoice doc with shadow; scrollable
- **Templates:** horizontal thumbnail carousel; blue border on selected
- **Bottom tabs:** Template · Logo · Color · Font · Options · Info (icon + label)
- **Rinse route:** `InvoiceTemplateMock` only; `InvoiceAppearancePicker` **not wired** in onboarding
- **Gap vs Rinse today:** no template carousel or color/font tabs during setup (settings later)
- **Status:** audited (Wave 0) — **defer** picker to Settings; polish preview size in Wave 9

---

### Slice W — Job readiness (Home)

- **Screen / flow:** Home — Job readiness (replaces Job revenue + week stat-grid)
- **Archetype:** `list-stagger` (`home-block-in` on `.weather-readiness-row`)
- **Trigger:** Home load when weather-sensitive (`location_type === 'mobile'`) jobs exist in next 3 days
- **What moves:** readiness rows fade/slide up with stagger; no assertive live region
- **Feel:** same as Home list rows; `prefers-reduced-motion: reduce` → static
- **Owner file:** `components.css` (rows), `app-ui.css` (`home-block-in` keyframe)
- **Status:** shipped (Slice W — Option B outdoor signal)

---

### Device mockup / FAQ / IAP (out of scope)

| Frame | Screen | Status |
|-------|--------|--------|
| `274905` | Device mockup “Add your images” | Out of scope — marketing |
| `274907` | FAQ + Contact / Restore | Out of scope — support |
| `274909` | App Store subscribe sheet | Out of scope — use Stripe |

---

### AI estimate builder (IF only — defer)

- **Frame range:** `274891`–`274892`
- **Setup UX wave:** —
- **Layout model:** chat + estimate table + confetti petals
- **Rinse route:** — (no AI estimate product)
- **Status:** audited (Wave 0) — **out of scope**

