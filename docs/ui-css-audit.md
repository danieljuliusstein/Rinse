# UI CSS Audit

Owner map for shared patterns across the detailing app. Use this when adding surfaces or consolidating CSS.

**Last updated:** Slice W (Job readiness / weather on Home)

---

## Design systems

| System | Scope | Token source |
|--------|-------|--------------|
| Operator Light | `/`, `/jobs`, `/clients`, sheets, FAB | `tokens.css` → `globals.css` `:root` + `app-ui.css` |
| Client Light | `/book/*`, `/portal/*` | `client-light.css` → `--cl-*` |
| Sheet sub-language | Bottom sheets, quick actions, supply picker | `globals.css` inv-sheet blocks + `premium-sheet.css` |

**Accent green:** `#22c55e` via `--green` / `--green-text`. Inventory OK state keeps `--inv-ok: #3dc97a` (semantic, not UI accent).

---

## Pattern owners

### `.card` — generic elevated surface

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `globals.css` | Base `.card`, `.card-pressable`; used settings advanced, damage docs |
| Extend | `settings.css`, `damage.css` | Page-scoped overrides only |

**Do not** duplicate full card rules in feature CSS; extend `.card`.

---

### `.job-card` — job list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.job-card`, hover, home variant `.job-card--home` |
| Status | `app-ui.css` | `.job-card .badge-status` |
| **Not** | `globals.css` | No `.job-card` in globals |

Used by: `JobsList`, `Dashboard` (`HomeJobRow`).

---

### `.client-card` — client list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.client-card`, `.client-card.vip`, `.client-card-main` |
| Menu | `globals.css` | `.client-card-menu-*` (popover actions) |

Legacy `.clients-screen` wrapper removed (Wave 17). List screens use `screen page-content body` only.

Used by: `ClientsList`, `ClientDetail` related lists.

---

### `.bottom-nav` — operator shell navigation

| Owner | File | Notes |
|-------|------|-------|
| **Canonical** | `globals.css` | Full layout, FAB, safe-area, animations |
| **Overrides** | `embed.css`, `product-tour.css` | Embed hide, tour dim only |

Used by: `BottomNav.tsx`.

---

### `.page-header` — screen title row

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.page-header`, `h1`, `h1.lg`, subtitle `p`, `--compact`, `__title-block` |
| Actions | `app-ui.css` | `.page-header-actions`, `.icon-btn` beside header |
| Header buttons | `components.css` | `.page-header__action` (compact screens) |

Used by: `Dashboard`, `JobsList`, `ClientsList`, `Reports`, settings, pipeline, CRM, messages, etc.

**Screen shell:** Prefer `screen page-content body` with no feature-specific wrapper class unless the feature CSS file defines layout rules for it (e.g. `.money-screen`, `.inventory-section`, `.home-dashboard`).

---

### Home dashboard motion (Wave 43)

| Owner | File | Notes |
|-------|------|-------|
| **Keyframe** | `app-ui.css` | `@keyframes home-block-in` (list-stagger archetype, IF 275146) |
| **KPI + today job** | `app-ui.css` | `.home-dashboard` scoped stagger, depth tokens, job card entrance |
| **Attention + chart** | `components.css` | `.home-quick-chip`, `.inventory-alert-card`, `.ar-summary-card`, `.home-revenue-chart` |
| **Job readiness (Slice W)** | `components.css` | `.weather-readiness-row` list-stagger via `home-block-in`; risk border tokens |
| **Trigger** | `Dashboard.tsx` | Root `.home-dashboard` wrapper |

Used by: `/` (`Dashboard.tsx`).

### Job readiness / weather (Slice W)

| Owner | File | Notes |
|-------|------|-------|
| **UI** | `components/home/WeatherReadinessCard.tsx` | Phosphor duotone icons; `Badge` amber for risk |
| **CSS** | `components.css` | `.weather-readiness*`; tokens only (`--bg-surface`, `--border-amber`, `--amber`) |
| **Thresholds** | `lib/weather-risk.ts` | `WEATHER_RISK_THRESHOLDS`, `isWeatherSensitiveJob` (Option B: `location_type === 'mobile'`) |
| **Server cache** | `lib/server/weather-forecast.ts` | Open-Meteo; geocode by address hash; forecast by day + lat/lon 2dp |
| **API** | `app/api/weather/readiness/route.ts` | POST jobs → readiness rows; no client-side weather calls |

Outdoor signal: **Option B** — mobile = weather-sensitive; fixed = not. No PocketBase schema change.

---

### Jobs motion (Wave 44)

| Owner | File | Notes |
|-------|------|-------|
| **List stagger + press** | `app-ui.css` | `.jobs-screen` — `ListRow` stagger, `.job-card` press, `.more-pill` |
| **Detail + empty-enter** | `components.css` | `.job-detail-screen` block stagger, `badge-status-in`, `@keyframes empty-enter` |
| **Photos press** | `job-photos/job-photos.css` | `.job-photos__thumb:active` |
| **Triggers** | `JobsList.tsx`, `JobDetail.tsx` | `.jobs-screen`, `.job-detail-screen` wrappers |

Used by: `/jobs`, `/jobs/[id]`, `/jobs/[id]/photos`.

---

### Clients & vehicles motion (Wave 45)

| Owner | File | Notes |
|-------|------|-------|
| **List + VIP** | `app-ui.css` | `.clients-screen`, `.clients-list-section` stagger, `.client-card.vip`, press depth |
| **Card menu** | `globals.css` | `client-menu-popover-in`, menu item stagger + press |
| **Client detail** | `components.css` | `.client-detail` block stagger, list/action press, empty-enter |
| **Vehicle/damage** | `damage/damage.css` | `.vehicle-screen` list + damage row press |
| **Triggers** | `ClientsList.tsx`, `VehicleProfile.tsx` | `.clients-screen`, `.vehicle-screen` |

Used by: `/clients`, `/clients/[id]`, vehicle + damage routes.

---

### Money motion (Wave 46)

| Owner | File | Notes |
|-------|------|-------|
| **Swipe reveal** | `components.css` | `swipe-actions-in`, `.invoice-swipe-item` stagger + action press |
| **Invoice/quote screens** | `components.css` | `.invoices-screen`, `.quotes-screen` list + empty-enter |
| **Preview success + badge** | `globals.css` | `.invoice-screen__message--success`, badge `badge-status-in` |
| **Quote detail** | `components.css` | `.quote-screen__message--success`, badge transition |
| **Money KPIs** | `app-ui.css` | `.money-screen` hero + stat card stagger |
| **Swipe spring** | `InvoiceSwipeableRow.tsx`, `SwipeableRow.tsx` | `--ease-spring` snap-back |
| **Triggers** | `InvoicesList`, `QuotesList`, `InvoicePreview`, `QuoteDetail` | Screen wrappers + `key` on status badge |

Used by: `/invoices`, `/quotes`, `/jobs/[id]/invoice`, `/invoices/new`, Business reports.

---

### Settings motion (Wave 47)

| Owner | File | Notes |
|-------|------|-------|
| **Hub + depth** | `settings.css` | `.settings-screen` row press, grouped card depth — no stagger |
| **Badges** | `settings.css`, `settings-progress.css` | `.settings-menu-*-badge` entrance |
| **Save feedback** | `settings.css`, `SettingsFooter.tsx` | `.settings-footer__save--ready` / `--done` |
| **Toggles** | `settings.css` | `.settings-toggle__thumb` spring slide |

Used by: all `/settings/*` via `.settings-screen`.

---

### Onboarding & auth motion (Wave 48)

| Owner | File | Notes |
|-------|------|-------|
| **Step enter** | `onboarding.css` | `setup-step-in` on welcome, auth (`key={mode}`), onboarding (`key={step}`) |
| **Invoice hero** | `onboarding.css` | `.onboarding-invoice-preview--hero` first-invoice preview |
| **Logo complete** | `onboarding.css` | `.onboarding-logo-picker--complete` badge + image pop |
| **OAuth press** | `onboarding.css` | `.social-auth__btn` spring press depth |
| **Paywall sheet** | `paywall-sheet.css` | Icon pop, plan row stagger, press depth |
| **Triggers** | `OnboardingShell`, `AccountAuth`, `OnboardingBusinessStep`, `OnboardingYourInvoiceStep` | Step `key` remounts + conditional classes |

Used by: `/welcome`, `/auth`, `/onboarding`, paywall `BottomSheet`.

---

### Secondary operator motion (Wave 49)

| Owner | File | Notes |
|-------|------|-------|
| **Pipeline** | `pipeline.css`, `PipelineScreen.tsx` | `.pipeline-screen` stage-in tokens, lead stagger, stepper pulse |
| **Messages** | `messages.css`, `MessagesScreen.tsx` | `.messages-screen` list stagger, expand panel, chip press |
| **Reports** | `app-ui.css`, `globals.css`, `Reports.tsx` | `.money-screen` report sections + chart panel; revenue bar tokens |
| **Tools** | `components.css`, `ToolsScreen.tsx` | `.tools-screen` widget + row stagger, footer entrance |

Used by: `/pipeline`, `/messages`, `/reports`, `/tools`.

---

### Inventory, damage & photos motion (Wave 50)

| Owner | File | Notes |
|-------|------|-------|
| **Inventory** | `inventory.css` | `.inventory-section` row stagger, low-stock `inv-attention-pulse`, tile press |
| **Damage** | `damage.css` | `.vehicle-screen` / `.damage-screen` list stagger, photo preview pop |
| **Job photos** | `job-photos.css`, `PhotoGallery.tsx` | Grid stagger, `--success` thumb after upload, compare/footer enter |

Used by: `/inventory`, vehicle damage flows, `/jobs/[id]/photos`.

---

### Forms layer motion (Wave 51)

| Owner | File | Notes |
|-------|------|-------|
| **Floating labels** | `floating-labels.css` | Label/focus tokens, filled `.f-check` pop, affix check animation |
| **Premium sheets** | `premium-sheet.css` | Pill spring + pop, submit ripple/`--ready`/`--done`, sheet checkmarks |
| **Light sheets** | `light-sheet.css` | Pill press, submit spring, reduced-motion fallbacks |
| **Page forms** | `page-form.css` | Save button states, search focus ring |
| **Client/auth forms** | `light-form.css` | Light-theme focus ring + filled check pop |
| **Pill select** | `PillGroup.tsx` | `--pop` class timeout aligned to `--duration-medium` (280ms) |

Cross-cutting: all operator sheets, page-form cards, booking/auth floating fields.

---

### Client-facing motion (Wave 52)

| Owner | File | Notes |
|-------|------|-------|
| **Shared client** | `client-light.css` | `--cl-duration-*`, `--cl-ease-*`, `cl-step-in`, `cl-shake`, `cl-success-pop` |
| **Booking** | `book.css`, `book/[slug]/page.tsx` | Step enter (`key={step}`), press-depth, success/error enter |
| **Portal** | `portal.css` | Body stagger, card depth, pay/photo press, lightbox enter |
| **Embed widget** | `embed.css`, `BookingCalendarWidget.tsx` | Unified `cl-shake`, widget enter, cal press |
| **Privacy** | `privacy.css` | Page enter, back link press |

Uses `--cl-*` motion lane on booking/portal; embed keeps `--embed-*` tokens. No operator `--green` on client surfaces.

---

### Delight & PWA motion (Wave 53)

| Owner | File | Notes |
|-------|------|-------|
| **Motion utilities** | `components.css` | `empty-enter`, `empty-illustration-in`, `success-pop`, `attention-pulse`; `.motion-empty-enter`, `.motion-success-pop`, `.motion-sheet-done`, `.motion-attention-pulse` |
| **Empties** | `components.css` `.ui-empty` | Global illustrated empty stagger (replaces per-screen rules) |
| **Product tour** | `rinse-tour.css`, `RinseTourOverlay.tsx` | Token transitions, spotlight ring pulse, welcome card enter |
| **Offline** | `app-ui.css`, `OfflineBanner.tsx`, `offline/page.tsx` | Banner slide-in, sync pulse, offline icon attention |

Sheet `--done` states use canonical `success-pop` keyframe (was `sheet-submit-success` in `premium-sheet.css`).

---

### Dark theme + motion close-out (Wave 54)

| Owner | File | Notes |
|-------|------|-------|
| **Depth tokens** | `tokens.css` | `--depth-card-shadow`, `--depth-card-border`, `--depth-elevated-shadow` per theme; dark aliases `--shadow-card` / `--shadow-elevated` |
| **Surfaces** | `globals.css` | `.card`, `.kpi-card`, sheets, tour cards — dark elevated shadow on modals |
| **Lists + cards** | `components.css`, `app-ui.css` | `.ui-list-group`, `.ui-empty`, `.client-card`, `.job-card`, `.stat-card` on `--depth-*` |
| **High contrast** | `a11y-high-contrast.css` | Operator CTAs, sheets, tour, offline; dark HC borders |
| **Reduced motion** | All wave owner CSS + `globals.css` | Local `@media (prefers-reduced-motion)` per surface; globals supplement for utilities |

**Motion token source:** `tokens.css` (`--ease-*`, `--duration-*`, `--stagger-step`).  
**Shared keyframes:** `components.css` (`empty-enter`, `success-pop`, `attention-pulse`), `app-ui.css` (`home-block-in`), `onboarding.css` (`setup-step-in`), `client-light.css` (`cl-step-in`, `cl-shake`).

**Reduced-motion policy:** `tokens.css` comment block — loops off; press keeps bg, drops scale; sheet dismiss stays functional.

---

### Depth sweep + motion QA (Wave 55)

| Owner | File | Notes |
|-------|------|-------|
| **Depth migration** | All operator `src/app/**/*.css` | No direct `--shadow-card` / `--shadow-elevated` except `tokens.css` aliases |
| **Motion QA demo** | `demo/delight-motion/page.tsx` | Replays Wave 53 utilities + theme toggle for Wave 54 depth |

Demo route: `/demo/delight-motion`

---

### Sheet forms

| Owner | File | Notes |
|-------|------|-------|
| Shell | `globals.css` | `.inv-sheet-*`, `.inv-supply-picker-*` |
| **Light operator forms** | `light-sheet.css` | `BottomSheet variant="light"` (default) — all operator sheets |
| **Dark premium** | `premium-sheet.css` | Legacy layout class names only; dark chrome deprecated |
| Submit | `premium-sheet.css` + `light-sheet.css` | `.sheet-submit`, `.sheet-footer` |
| Fields | `floating-labels.css` + `@/components/forms` | `FloatingField`, `PillGroup` |

**Wave 19–20:** All operator `BottomSheet` surfaces use light chrome. Invoice client signatures: `signature_url` + `signed_at` on portal/PDF/preview.

Legacy `.inv-field-*` removed (Wave 17). Supply picker retained.

---

### Settings hub

| Owner | File | Notes |
|-------|------|-------|
| Hub layout | `settings.css` | `.settings-hub`, `.settings-panel`, `.settings-menu-trailing` |
| Hub rows | `@/components/ui` `ListRow` via `SettingsMenuListRow` | Icon tones from `ListRow` |
| Badges | `app-ui.css`, `settings-progress.css` | `.settings-menu-profile-badge`, `.settings-menu-milestone-badge` |

Legacy `.settings-menu-item` / `.settings-row-link` removed (Wave 17).

---

## Removed / dead

| Item | Resolution |
|------|------------|
| `home/home.css` | **Deleted** with unrouted `HomeScreen.tsx` (Phase 1) |
| `JobsRevenueChart.tsx` | **Deleted**; `lib/jobs-revenue.ts` kept (Phase 1) |
| Stray greens `#16a34a`, `#4caf50` | Replaced with tokens; guarded by `css-accent-guard.test.ts` |
| `.inv-field-*`, `.inv-select-wrap`, `.inv-input-affix`, `.inv-status-*` | **Deleted** — use floating labels (Wave 17) |
| `.clients-screen`, `.messages-screen`, `.crm-screen`, `.pipeline-screen`, `.quotes-screen` | **Deleted** — empty wrappers (Wave 17) |
| `.settings-menu-item`, `.settings-row-link` | **Deleted** — hub uses `ListRow` (Wave 17) |
| `globals.css` `.clients-*` list utilities | **Removed** — only `.client-card-menu-*` remains |

---

## Deferred / intentional

- `.inv-sheet-save` / `.inv-sheet-cancel` in `globals.css` — legacy inverted buttons; new sheets use `.sheet-submit`. Remove when confirmed no external HTML depends on them.
- `src/components/ui/*` — adopt incrementally in new screens (ongoing)
