# Desk ops parity — vehicles, routes, invoices + capability backlog

**Date:** 2026-09-17  
**Status:** Planning only (no implementation in this pass)  
**Surfaces:** `rinse-desk` (UI), `rinse-mobile` (capability source of truth), `rinse-api` (geocode / route-trip / invoice side effects)  
**UI rule:** Capability parity ≠ visual port. Desk keeps dense SPA patterns (side panels, modals, DnD lists, Leaflet). Do **not** copy Expo sheets, tab chrome, or mobile home modules.

**Related:**  
- `rinse-desk/docs/plans/2026-08-01-002-feat-mobile-desk-parity-plan.md`  
- `rinse-desk/docs/plans/2026-08-02-002-feat-invoices-receipts-cars-plan.md`  
- `rinse-desk/docs/plans/2026-08-04-001-feat-calendar-route-map-plan.md`  
- `rinse-desk/docs/research/mobile-desk-parity-2026.json`

---

## Goal Capsule

**Objective.** (1) Fix / finish the three operators-already-expect flows on Desk: vehicle detail “homing,” route drag-reorder + Optimize, and real invoice editing. (2) Publish a ranked mobile→desk capability backlog so later waves stay desk-native and intentional about mobile-only field work.

**Product authority.** This plan. Prior wave plans remain historical context; where they conflict with current code (e.g. Routes is now a top-level page with Leaflet, not Calendar MapLibre), **code + this plan win**.

**Non-goals this plan:** Porting mobile UI chrome; offline queue on Desk; IAP/billing purchase on web; camera calibration for damage pins.

---

## What Antigravity left behind (context)

Recent uncommitted Desk work is mostly **onboarding tour** wiring (Cars / Routes / Invoices mock writes when `tour.active`). That does not fix product bugs — and tour overlays (`tour-armed`, `pointer-events`) can make DnD / clicks feel “broken” while a tour is active. Treat tour as orthogonal; verify bugs **outside** tour mode.

---

## Unit A — Vehicle viewing (“homing on car modules”)

### Clarification (2026-09-17)

**“Vehicle homing” = onboarding tour spotlight** cutout over the target vehicle row
(`data-tour-target="cars-vehicle"`), so the coach card homes on that box and the user
must click it. Not stock PNG heroes / damage-map camera.

### Root cause (fixed in W0)

FleetList tagged `tour-veh-marcus-gt3`, but tour dummy data uses `tour-veh-porsche`.
Spotlight selector found nothing → cutout never hovered the vehicle row.

### Fix

- Resolve spotlight id from `tour-veh-porsche` / Porsche GT3 / any `tour-` vehicle
- Arm + ring the row; complete via `notifyCreated('vehicle')` on select (not panel click)

---

## Unit B — Routes: drag reorder + Optimize

### Current state (important)

**Drag reorder already exists** on Desk:

- `src/components/calendar/RoutePlanner.tsx` — `@dnd-kit` `DndContext` + `SortableStopCard`  
- Persist: `saveRouteOrder` → `jobs.route_order` (`src/lib/api.ts`)  
- UI copy: “drag to reorder”

**Optimize already exists** as a client call:

- Desk: `optimizeRouteTrip` → `POST {VITE_APP_API_URL}/api/route-trip` (`src/lib/route-api.ts`)  
- API: `rinse-api/src/app/api/route-trip/route.ts` (OSRM trip + CORS for `Content-Type` only)  
- Prefetch: Plot geocodes via `/api/geocode`, caches lat/lng on clients

**Mobile** (`rinse-mobile/app/(tabs)/routes.tsx`): ↑↓ reorder only — **no Optimize**. Desk is supposed to be the planner; mobile consumes order + “Open in Maps”.

### Likely break points (addressed in W1)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Optimize / drag fail on tour jobs | `saveRouteOrder` / `updateClient` hit PB with `tour-*` ids | Skip PB for synthetic ids; local state still updates |
| Stops not plottable after client geocode | Jobs kept stale `expand` client without lat/lng | Hydrate jobs from live `clients` list |
| Spotlight misses stop | Panel click completed tour early | Complete on stop select; arm `routes-stop` row |
| Optimize needs API | `VITE_APP_API_URL` / `rinsehq.com` `/api/route-trip` | Unchanged; clearer when Plot first |

### Desk-native fix approach

1. **Verify env + API** in the running Desk build (Plot + Optimize happy path with 2+ addressed jobs).  
2. **Harden Optimize UX:** clearer dock status when API down / ungeocoded; disable Optimize until `plottedCount >= 2`, not merely `dayJobs.length >= 2`.  
3. **Confirm DnD** outside tour; if broken, fix handle listeners / overlay stacking — do not replace with mobile ↑↓.  
4. **Optional polish:** on stop select, `flyTo` / padded fit on that marker (map “homing”) — desk-dense behavior Jobber-style.  
5. Do **not** reintroduce MapLibre solely for parity with the Aug plan; Leaflet is shipped — polish in place unless product re-opens KD2.

### Acceptance

- Drag stop A above B → PB `route_order` updates; mobile Routes for that day matches after refresh.  
- Plot → Optimize → order + road polyline update; toast explains skipped ungeocoded stops.  
- Failure modes explainable (API / geocode / &lt;2 plottable), not silent.

---

## Unit C — Invoice editing on Desk

### Current state (updated W2)

Desk now has a full **Edit invoice** modal: status, package/job revenue, extra line items (qty × price), discount, tax %, PO, tip, amount paid — writes the same PB fields mobile customize uses (`extra_line_items`, `discount_amount`, `tax_rate`, `tax_amount`, `po_number`, totals).

Still out of this wave when W2 landed: PDF / portal / email send — **now W4 shipped** (row PDF / Copy link / Email via rinse-api + Desk CORS).

### Desk-native UX (do not copy mobile sheets)

Reuse Desk patterns already in-product:

- Expand row → **side drawer or wide modal** (same family as `InvoiceEditModal` / calendar side panels).  
- Sections: Status & payment | Line items table | Tax / discount / PO | Notes.  
- Line items: editable table (add / remove / amount) binding `extra_line_items` + derived `subtotal` / `total` — same PB fields mobile writes (`updateInvoice` patch shape from mobile `saveCustomize`).  
- Keep **finalize/send/PDF** as separate actions (existing Mark sent + future portal Wave).  
- Immutable finalized PDF policy stays: draft/open edits mutate record; customer-facing PDF generation remains API-owned.

### Implementation sketch (directional)

- Extend `InvoiceEditValues` / `buildInvoiceUpdatePatch` (or replace with full patch builder) for `discount_amount`, `tax_rate`, `po_number`, `extra_line_items`.  
- Confirm `DeskInvoice` + `api.updateInvoice` already accept those fields; widen types if stripped.  
- Replace “Light edit” copy with “Edit invoice”; keep destructive void/cancel gated.

### Acceptance

- From Desk, add a line item + tax on a draft → mobile invoice detail shows the same totals after refresh.  
- Status / paid / tip still work.  
- No Expo UI ported; looks like Desk invoices chrome.

---

## Unit D — Capability gap inventory (plan only — do not implement yet)

Classification:

- **Must** — office / Sunday planning / money / dispatch; silly if Desk can’t  
- **Should** — useful on Desk; after Must  
- **Defer** — field, camera, offline, IAP, or Desk already stronger elsewhere  

| # | Capability | Mobile home | Desk status | Class | Notes |
|---|------------|-------------|-------------|-------|-------|
| 1 | Vehicle detail + type identity | vehicles/[id] | Partial; stock hero unwired | **Must** | Unit A |
| 2 | Damage map review | CarDamageMap | Partial | **Must** | Unit A |
| 3 | Route drag reorder | ↑↓ only | Implemented; verify | **Must** | Unit B |
| 4 | Route Optimize (OSRM) | Absent | Implemented; reportedly broken | **Must** | Unit B — Desk-owned |
| 5 | Invoice line/tax/discount edit | InvoiceDetailBody | Light only | **Must** | Unit C |
| 6 | Invoice create / mark sent | Yes | Yes | Done | Keep |
| 7 | Quotes list + detail + convert | quotes tabs | **Missing** | **Must** | Desk Money/Deals adjacent; dense table + drawer |
| 8 | Job detail edit (notes, status, package, times) | jobs/[id], edit | Calendar/partial | **Should** | Desk calendar panel deepen |
| 9 | Team roster + job assignee | settings/team | WorkspaceMap **Mobile only** | **Should** | Prior Wave 2 |
| 10 | Inventory list + qty adjust | inventory tab | **Missing** | **Should** | Prior Wave 6; Sunday supply |
| 11 | Packages / add-ons CRUD | settings/packages | Settings partial? | **Should** | Desk settings section |
| 12 | Invoice PDF / portal link / send | API-backed | **Done (W4)** | Done | Desk row actions → `/api/pdf/*`, `/api/portal/create`, `/api/portal/send`. Prereqs: `VITE_APP_API_URL`, active org subscription (desk gate + API 402), contact email prompt on Email |
| 13 | SMS templates + quiet hours send | messages + settings | Quiet hours prefs; send incomplete | **Should** | Prior Wave 7; server Twilio |
| 14 | Client CSV import | clients/import | **Missing** | **Should** | Desk is better surface |
| 15 | Reports / P&L depth | reports, reports/pl | Money overview | **Should** | Extend Money, don’t clone mobile reports chrome |
| 16 | Pipeline / deals | pipeline | Deals page | Done-ish | Desk-native board |
| 17 | Photos upload/delete | job photos | Under Cars | Done-ish | |
| 18 | Expenses / receipts | expenses | Receipts page | Done-ish | |
| 19 | Booking schedule prefs | settings/schedule | Settings Schedule | Done | |
| 20 | Time blocks | calendar | Calendar | Done | |
| 21 | Damage pin calibration | CarDamageMap calibrate | Intentionally mobile | **Defer** | Field precision |
| 22 | Camera / scan / OCR / plate | scan, vehicle-ocr, receipt-ocr | N/A | **Defer** | Device |
| 23 | Offline outbox | offline/* | N/A | **Defer** | Prior Wave 8 |
| 24 | IAP / paywall / StoreKit | billing, PaywallGate | Billing Mobile only | **Defer** | Stripe portal later |
| 25 | Onboarding / intro / tour (native) | onboarding | Desk tour WIP | Separate | Don’t block ops |
| 26 | Home module toggles | home_modules | N/A | **Defer** | Mobile home only |
| 27 | Push / native notifications | push | N/A | **Defer** | |
| 28 | Data export | data-export | Partial? | **Should** | Desk download fits |
| 29 | Inspection walkthrough capture | jobs/.../inspection | Review-only on Desk | **Defer** capture | Review OK under Cars |
| 30 | Automations / campaigns / forms | Limited mobile | Desk-strong | Desk-led | Not a mobile gap |

**Grouped remainder (mobile-present, desk-absent, mostly Defer/Should):**  
language, privacy/delete-account, email-domain, quiet-hours editor depth, FAQ/support chat, wishlist/equipment inventory subtypes, blocked-day sheets, deposit collection, tips sheet, share pay link, invoice layout designer, booking embed preview, weather readiness cards, AR strip, app review prompts.

### Settings honesty

Update `WorkspaceMapSection` badges as waves land (Team, Billing, Inventory, etc.) so “Mobile only” stays true.

---

## Delivery waves (recommended order)

| Wave | Focus | Why |
|------|-------|-----|
| **W0** | Triage repro outside tour: vehicles, Optimize network, DnD | Stop guessing |
| **W1** | Unit A vehicles + Unit B routes harden | User-reported broken now |
| **W2** | Unit C full invoice edit (desk drawer) | Explicit ask; high leverage |
| **W3** | Quotes on Desk (list + edit drawer) | **Shipped** — sidebar Quotes, PB CRUD, accept→job |
| **W4** | PDF / portal / send from Desk | **Shipped** — Bearer `app-api` + Desk CORS on portal/PDF routes; Invoice/Quote row PDF · Copy link · Email |
| **W5** | Team assignee + Inventory read/write | Sunday ops |
| **W6** | SMS send + client import + export | Ops depth |
| **Later** | Job panel deepen, packages CRUD, reports depth | Incremental |

**Execution direction:** smoke-first on W0–W2 (manual Desk + mobile refresh of same org). Characterization tests only where patch builders / route merge already have test homes (`money-parity`, `route-optimize`).

---

## Cross-cutting principles

1. **Same PB org, same records** — never desk-only shadows for jobs/invoices/vehicles.  
2. **Desk-dense UI** — tables, drawers, DnD, maps; reuse `Header`, invoice row chrome, RoutePlanner, Cars split pane.  
3. **Mobile owns field capture** — camera, calibrate, offline, IAP stay mobile.  
4. **Side effects via `rinse-api`** — geocode, route-trip, PDF, SMS, portal; Desk is a thin authenticated client where needed.  
5. **Tour code paths** must not replace or mask real API behavior in production flows.

---

## Risks

- Invoice line-item schema drift between Desk types and mobile `extra_line_items`.  
- Optimize depends on production CORS + OSRM availability at `rinsehq.com`.  
- Tour + real data mixed in uncommitted Antigravity diffs — separate before shipping W1–W2.  
- Subagent parity audit was rate-limited this session; inventory is code-trace based (high confidence on Units A–C, medium on long-tail settings screens).

---

## Open question (non-blocking default)

**Vehicle “homing”:** Plan defaults to wiring `StockTypeVehicle` + pin→photo focus. If you meant map fly-to on Routes stop select, or something else, say so before W1 implementation — map fly-to is already listed as Unit B polish.
