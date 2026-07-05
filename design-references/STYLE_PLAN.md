# Style polish plan — 16 waves

Planning doc only — **no implementation until a wave is explicitly started**.
Numbering continues the app's CSS wave convention: **Style Waves 40–54**.

**Related:** `MOTION_SPEC.md` · `invoice-fly/README.md` · `docs/ui-css-audit.md` · `.cursor/rules/design-motion.mdc`

---

## Goal

Make Rinse feel as alive as Invoice Fly: layered depth, spring motion, and micro-interactions — without breaking the design system or pattern owners.

## Current baseline

| Layer | Status | Owner file |
|-------|--------|------------|
| Surfaces / colors | IF-inspired light theme shipped | `tokens.css` |
| Card shadows | Light only; dark removes shadows | `globals.css` |
| Sheet enter | Spring + scrim fade + exit (Wave 41) | `globals.css`, `BottomSheet.tsx` |
| Sheet drag | Implemented | `BottomSheet.tsx` |
| Onboarding step transition | `setup-step-in` | `onboarding.css` |
| Pill pop / ripple | Exists in forms | `premium-sheet.css` |
| List stagger | Pipeline only | `pipeline.css` |
| Press states | `scale(0.99)` on cards | `globals.css` |
| Motion tokens | Wave 40 shipped | `tokens.css` |

**Gap:** Tokens defined; waves 41+ wire them into components.

---

## Wave map (overview)

| Wave | Name | Status |
|------|------|--------|
| 0 | Map replays | ☑ |
| 40 | Foundation — motion tokens | ☑ |
| 41 | Sheets | ☑ |
| 42 | App shell | ☑ |
| 43 | Home dashboard | ☑ |
| 44 | Jobs | ☑ |
| 45 | Clients & vehicles | ☑ |
| 46 | Money (invoices & quotes) | ☑ |
| 47 | Settings | ☑ |
| 48 | Onboarding & auth | ☑ |
| 49 | Secondary operator (pipeline, messages, reports, tools) | ☑ |
| 50 | Inventory, damage & job photos | ☑ |
| 51 | Forms layer | ☑ |
| 52 | Client-facing (book, portal, embed) | ☑ |
| 53 | Delight, empties & tour | ☑ |
| 54 | Dark theme + a11y close-out | ☑ |
| 55 | Depth sweep + motion QA lab | ☑ |

**Fast path (MVP “alive”):** 40 → 41 → 42 → 43, then continue by user traffic (jobs → clients → invoices).

---

## Phase 0 — Map replays ✅

**Complete.** See `invoice-fly/README.md` for full screen index (35 flows) and 5 hero moments.

Summary:
- 218 frames mapped from splash → settings
- 5 hero moments picked for Waves 41–43, 46, 48
- Specs logged in `MOTION_SPEC.md`

---

## Phase 0 reference (archived steps)

1. Skim sequential batches in `invoice-fly/` (5–10 frames at a time)
2. Add rows to `invoice-fly/README.md`: screen name, frame range, archetype
3. Log specs in `MOTION_SPEC.md`
4. Pick **3–5 hero moments** for highest impact

**Deliverable:** Filled screen index + hero moment list. ✅

---

## Wave 40 — Foundation (motion tokens) ✅

**Shipped** in `tokens.css` (2026-07-02). No component changes.

- `--ease-spring`, `--ease-pop`, `--ease-step`, `--ease-out`
- `--duration-instant` / `fast` / `medium` / `slow`
- `--stagger-step: 50ms`
- `--transition` / `--transition-sheet` → alias new tokens (backward compatible)
- `--depth-card-shadow`, `--depth-card-border`, `--depth-elevated-shadow` (light + dark)
- `--sheet-scrim-opacity` for Wave 41 scrim fade
- **Dark depth decision:** border + surface step, no card shadows (apply in Wave 54)
- **Reduced-motion policy:** documented in `tokens.css` comment block

---

## Wave 41 — Sheets ✅

**Shipped** (2026-07-02). Hero refs: `275001`, `275179`.

- `inv-sheet-up` / `inv-sheet-down` use `--ease-spring` / `--duration-medium`
- Scrim: `inv-sheet-scrim-in` / `out` on `--sheet-scrim`
- `BottomSheet`: exit animation via `inv-sheet-root--closing` before unmount
- Drag: scrim dims with drag; snap-back uses spring transition
- Quick actions + row context menu aligned to same keyframes
- `VaulSheet`: scrim fade only (vaul handles slide)
- Submit: token transitions + `sheet-submit-success` pop on `--done`
- `paywall-sheet.css`: plan row transition tokens
- `prefers-reduced-motion` extended for all sheet surfaces

---

## Wave 42 — App shell ✅

**Shipped** (2026-07-02).

- **Nav tabs:** active icon `scale(1.1)` spring; press `scale(0.92)` (`tab-active`, `press-depth`)
- **FAB:** spring rotate on open; press `scale(0.94)` + reduced shadow
- **Quick actions:** `quick-action-row-in` stagger (50ms steps) on menu open
- **icon-btn:** press depth in `app-ui.css`
- **page-header__action:** press depth in `components.css`
- `BottomNav.tsx`: removed inline icon transition (CSS-owned)
- `prefers-reduced-motion` extended for shell controls

---

## Wave 43 — Home dashboard ✅

**Scope:** `app-ui.css`, `components.css` home blocks  
**Archetypes:** `list-stagger`, `counter` (optional — skipped; tabular-nums on chip counts)

- KPI card stagger on load (`stat-grid--dashboard`)
- Today's job row entrance + elevated depth
- Section depth hierarchy (`--depth-card-*` on cards + list groups)
- "Needs attention" row polish (quick chips, AR card, inventory alert styles)

**Touches:** `/` (Dashboard). Hero ref **275146** (home KPI + list stagger).

---

## Wave 44 — Jobs ✅

**Scope:** `app-ui.css` job cards, `components.css` job detail, `job-photos.css`  
**Archetypes:** `list-stagger`, `press-depth`, `empty-enter`

- Job list load stagger (`.jobs-screen` + `ListRow`)
- Row press depth on list, more-pill, legacy `.job-card`
- Job detail block stagger + status badge pop on change (`key` + `badge-status-in`)
- Illustrated empty enter on jobs list + photo gallery (extends Wave 4 art)
- Photo thumb press depth

**Touches:** `/jobs`, `/jobs/[id]`, photos gallery.

---

## Wave 45 — Clients & vehicles ✅

**Scope:** `app-ui.css` client cards, `components.css` client detail, `globals.css` menu, `damage.css`  
**Archetypes:** `list-stagger`, `press-depth`

- Client list stagger (`clients-list-section` wrappers) + VIP row treatment
- Client card menu popover spring + item stagger
- Client detail block entrance + row/action press
- Vehicle/damage list press + empty enter

**Note:** Full damage UI polish in Wave 50.

**Touches:** `/clients`, detail, vehicles, damage routes.

---

## Wave 46 — Money (invoices & quotes) ✅

**Scope:** `components.css`, `globals.css`, `app-ui.css`, `InvoiceSwipeableRow.tsx`  
**Archetypes:** `swipe-reveal`, `success-pop`, `progress-fill` (busy toast only)

- Swipe row spring (`--ease-spring` on snap-back) + action reveal stagger
- Invoice list stagger (IF 275146) + aging chip press
- Invoice/quote preview success toast pop + status badge transitions (`key` remount)
- Quotes list stagger + press
- Money screen KPI hero + stat card stagger

**Touches:** `/invoices`, `/quotes`, job invoice preview, `/invoices/new`, Business (`money-screen`).

---

## Wave 47 — Settings ✅

**Scope:** `settings.css`, `settings-progress.css`, `SettingsFooter.tsx`  
**Archetypes:** `press-depth` only — **no stagger**

- Hub row press (subtle `scale(0.995)`)
- Progress/milestone badge entrance (`badge-status-in`)
- Footer save `--ready` / `--done` feedback (reuses `sheet-submit-success`)
- Grouped card depth on hub list groups, panels, milestone list
- Toggle thumb spring + panel `SheetSubmitButton` press

**Touches:** All `/settings/*` pages.

---

## Wave 48 — Onboarding & auth ✅

**Shipped** (2026-07-03). Hero refs: `274896` (account ready), `274886`–`274890` (logo progress).

**Scope:** `onboarding.css`, `auth-flow.css`, `welcome`, `paywall-sheet.css`  
**Archetypes:** `step-enter`, `success-pop`, `progress-fill`

- Welcome hero stagger (logo → eyebrow → title → lead → features → CTAs)
- Auth `setup-step-in` on mode switch (`key={mode}`); OAuth row `press-depth`
- Onboarding `setup-step-in` on every sub-step (`key={step}` in shell)
- Account-ready hero on your-invoice step (`onboarding-account-hero`)
- Logo upload progress bar + COMPLETE badge on picker (`onboarding-logo-progress`)
- First-invoice preview hero (`onboarding-invoice-preview--hero`)
- Package pick stagger + check `success-pop`; plans card entrance
- Booking link row stagger; copy-link `success-pop`
- Paywall sheet entrance stagger (reuses Wave 41 sheet + `paywall-sheet.css`)
- Setup CTAs use motion tokens; `prefers-reduced-motion` extended

**Touches:** `/welcome`, `/auth`, `/onboarding`, `PaywallSheet`. Demo: `/demo/setup-motion`.

---

## Wave 49 — Secondary operator ✅

**Shipped** (2026-07-03). Ref: IF `275064` (cost estimator accordion), `275098` (expenses list).

**Scope:** `pipeline.css`, `messages.css`, `app-ui.css` (reports), `components.css` (tools)  
**Archetypes:** `list-stagger`, `pipeline-stage-in`, `attention-pulse`, `press-depth`

- **Pipeline** — stepper/header enter; stage panel `pipeline-stage-in` on tab change; lead row stagger + press; current-node pulse (Wave 40 tokens on transitions)
- **Messages** — header/chips enter; tab panel re-enter on switch; thread + auto-template list stagger; expand `pipeline-stage-in`; detail view blocks enter
- **Reports** (`/reports` → `money-screen`) — report sections/cards stagger; revenue + expense bar rows enter; chart panel re-enter on toggle/range; bar fills use `--duration-slow`; filter chips press
- **Tools** — widget card + ops list stagger; row press depth; footer hint enter

**Touches:** `/pipeline`, `/messages`, `/reports`, `/tools`.

---

## Wave 50 — Inventory, damage & job photos ✅

**Shipped** (2026-07-03). Ref: IF `274969` (attachments), `275090` (receipt OCR success).

**Scope:** `inventory.css`, `damage.css`, `job-photos.css`  
**Archetypes:** `attention-pulse`, `press-depth`, `success-pop`, `list-stagger`

- **Inventory** — header + category grid enter; list/tile stagger; low-stock `attention-pulse` on qty + category badge; product bar fill tokens; row/tile press
- **Damage** — vehicle + damage list stagger; thumb press zoom; add-form photo preview `success-pop` + green border; detail hero photo + metadata rows enter
- **Job photos** — header/compare/section/grid stagger; upload `thumb--success` pop (900ms); uploading section dims add chip; thumb/entry press depth

**Touches:** `/inventory`, vehicle damage flows, job photos gallery.

---

## Wave 51 — Forms layer ✅

**Scope:** `floating-labels.css`, `light-form.css`, `page-form.css`, `premium-sheet.css`  
**Archetypes:** `pill-spring`, ripple, field focus

- Pill pop on select (`form-pill--pop`, `--duration-medium` token)
- Field focus transitions + green ring (`box-shadow`)
- Page-form save button press/success states
- Checkmark on filled fields (`f-field--filled` + `badge-status-in`)
- Photo-picker row press + focus; confirm sheet button press
- Setup-row focus highlight in onboarding auth fields

**Touches:** All forms cross-cutting — do after shells (Waves 41–42).

---

## Wave 52 — Client-facing ✅

**Scope:** `client-light.css`, `book.css`, `portal.css`, `embed.css`, `privacy.css`  
**Archetypes:** step transitions, `press-depth`

- `--cl-depth-*`, `--cl-stagger-step`, shared `.cl-shake-once` utility
- Booking step enter + package stagger; continue shake (book + embed unified)
- Portal invoice card depth (`portal-card--invoice`, raised totals band)
- Embed aliases `--embed-*` → `--cl-*`; `client-light-root` on embed layout
- `light-form.css` fully on `--cl-*` lane (no operator `--green`)
- Privacy page on client-light tokens + depth card body

**Touches:** `/book/[slug]`, `/portal/[token]`, embed widget, `/privacy`.

**Rule:** Do not mix operator `--green` tokens into client surfaces.

---

## Wave 53 — Delight, empties & tour ✅

**Scope:** `components.css` empties, `rinse-tour.css`, offline page  
**Archetypes:** `empty-enter`, `attention-pulse`, `success-pop`

- ✅ Illustrated empty state entrance (`ui-empty--illustrated`, `empty-illustration-in`)
- ✅ Tour pulse aligned to tokens (`tour-ring-pulse`, `--motion-attention-duration`)
- ✅ Offline/PWA moments (banner sync pulse, PWA install enter + dismiss press)
- ✅ Global delight utilities: `.motion-empty-enter`, `.motion-success-pop`, `.motion-sheet-done`, `.motion-attention-pulse`

**Touches:** Cross-app delight layer.

---

## Wave 54 — Dark theme + a11y close-out ✅

**Scope:** `a11y-high-contrast.css`, dark `[data-theme="dark"]` overrides  
**Touches:** Every prior wave in dark mode

- ✅ Depth parity in dark — `--depth-*` aliases `--shadow-*` in dark; list cards, tour, progress stats on depth tokens
- ✅ `prefers-reduced-motion` audit — Wave 53 utilities + tour ring/card + empties in globals + `a11y-high-contrast.css`
- ✅ High-contrast verification — operator list cards, PWA banner, tour ring (`docs/a11y-audit-phase2.md`)
- ✅ Motion owners documented in `docs/ui-css-audit.md`

---

## Wave 55 — Depth sweep + motion QA lab ✅

_Maintenance close-out from the motion arc (not UI/UX)._

**Scope:** Operator CSS depth token migration, `/demo/delight-motion`

---

## Wave 56 — UI/UX audit ✅

**Scope:** Screens off the design system — layout, tokens, shell consistency (not animation)  
**Method:** Full operator pass (like QuickAddJob pre-fix)

- ✅ Job photos — re-skinned from dark ATLAS island to operator light tokens + standard shell
- ✅ Shell `body` class — QuickAddJob, JobDetail, forms, invoice/quote detail, settings hub
- ✅ Dead dark inventory toggle CSS removed (`AcquisitionToggle` already uses `PillGroup`)
- ✅ Form headers → `page-header page-header--compact` (QuickAddJob, JobEdit, ClientForm, QuoteForm, VehicleForm, AddDamageForm)
- ✅ Client detail header → `page-header` + stacked title block
- ✅ Reports waterfall chart — theme tokens via `readChartTheme()`
- ✅ Operator feature CSS hex → tokens (`--cta-ink`, semantic colors in inventory, app-ui, settings, reports)

---

## Wave 56+ — ScreenDesigns expansion (ongoing)

When adding apps from ScreenDesigns:

1. `design-references/{app-slug}/`
2. README with frame index
3. Note which Rinse screens they inform (booking → `book.css`, etc.)

---

## Principles (every wave)

1. **Depth before decoration** — elevation and press states before confetti
2. **Spring over linear** — iOS-style easing on enters; avoid plain `ease`
3. **Stagger sparingly** — lists and dashboard yes; settings rows no
4. **Reduced motion** — every animation gets a `prefers-reduced-motion` path
5. **Extend owners** — no per-page animation CSS files (`ui-css-audit.md`)
6. **Use components** — `@/components/ui`, `@/components/forms` (`ui-styling` rule)

---

## Open decisions

Resolve before **Wave 40**:

- [x] Dark theme: restore subtle shadows or use border/brightness for depth? → **Border + `--bg-elevated` step; `--depth-*` tokens; Wave 54 wires into `.card`**
- [ ] Framer Motion vs CSS-only for stagger (project is mostly CSS today)
- [ ] Which 3 IF hero moments ship in Wave 41–43? → **Send sheet (275001), invoices dashboard (275146), account created (274896)** — plus voice picker + logo progress
- [ ] Git: keep 23MB webp in repo or move to LFS?

---

## Active wave

**Premium UX:** Wave A (Foundation & Feedback) — **in progress**

**Motion arc:** Wave 56 complete ✅

**Setup layout arc:** [`SETUP_UX_PLAN.md`](./SETUP_UX_PLAN.md) — Waves 1–14 complete ✅ · Wave 15 or 17 next

**Product slice:** Slice W (Job readiness / weather) complete ✅ — Option B (`location_type === 'mobile'`)

**Other:** Wave 57+ ScreenDesigns expansion

_Update this line when starting each wave._

---

## Premium UX — Wave A (Foundation & Feedback)

| Item | Status | Owner |
|------|--------|-------|
| A0 Cursor rule `premium-ux-toolkit.mdc` | ☑ | `.cursor/rules/` |
| A1 Skeleton loading | ☑ | `components.css`, `ScreenLoading`, `ScreenSkeletons` |
| A2 Rolling totals (`counter`) | ☑ | `CurrencyAmount` + `motion-number` |
| A3 Route transition (`nextjs-toploader`) | ☑ | `AppShell.tsx`, `globals.css` `#nprogress` |
| A4 Search debounce (300ms) | ☑ | `useDebouncedSearch` |

**Exit criteria:** skeleton default on list/detail; money rolls on change; operator top progress (not book/portal/auth); debounced search; docs + rule shipped.

---

## Premium UX — Wave B (Forms, Data Integrity & List Performance)

| Item | Status | Owner |
|------|--------|-------|
| B1 Form validation (zod + RHF) | ☑ | `@/lib/validation`, `useRinseForm`, `f-field--error` |
| B2 Phone + currency masking | ☑ | `phone-format.ts`, `FloatingAffixField` `currency`, `FloatingPhoneField` |
| B3 List virtualization (>50) | ☑ | `VirtualList.tsx` — invoices, clients, jobs |
| B4 Optimistic UI (`useOptimistic`) | ☑ | `optimistic-reducers.ts` — invoice/lead/job/supply actions |

**Exit criteria:** forms validate inline + toast; phone/currency format correctly; long lists virtualize with swipe intact; status taps update instantly and revert + toast on failure.

---

## Premium UX — Wave C (Spatial Continuity & Rich Interactions)

| Item | Status | Owner |
|------|--------|-------|
| C1 Shared-element transitions (`layoutId`) | ☑ | `DetailOverlayProvider`, `MorphSurface`, `ListRow` `morphLayoutId` |
| C2 Reorderable line items (`@hello-pangea/dnd@18.0.1`) | ☑ | `ReorderableList` — customize, receipt, template library |
| C3 QR codes (`qrcode.react`) | ☑ | `@/components/ui/QrCode` — invoice preview/send, portal pay, share |
| C4 Calendar (`react-day-picker` v9) | ☑ | `RinseDayPicker` — book, schedule blocks, home month; day jobs on Home |
| C5 Prose typography (`.rinse-prose`) | ☑ | `@tailwindcss/typography` + `rinse-prose.css` |

**Exit criteria:** card→detail morph via overlay (deep links intact); line items reorder; QR scans to pay URL; calendar unified and Home stays on Home; prose pages use `rinse-prose` tokens.

