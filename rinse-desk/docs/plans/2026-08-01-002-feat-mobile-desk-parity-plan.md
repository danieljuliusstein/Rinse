# Mobile ↔ Desk parity roadmap

**Date:** 2026-08-01  
**Status:** Wave 0 (time_blocks) shipping now; remainder planned  
**Context:** Desk and mobile share PocketBase org. Desktop CRM is outside the Detailing monorepo. Goal: desk can manage the same operational surfaces as mobile where it makes sense for “Sunday planning,” without reimplementing field-only UX.

---

## Done — Wave 1: Schedule

**Shipped**

- `src/lib/booking-schedule.ts` — same shape as mobile
- `app_settings.booking_schedule` load/save on Desk
- Settings → **Schedule**: work days, hours, lunch, buffers, open dates
- Workspace map: Schedule is Open (not Mobile only)

---

## Done — Wave 0: `time_blocks`

**Shipped in this pass**

- `api.createTimeBlock` / `updateTimeBlock` / `deleteTimeBlock` (match mobile `time-blocks-api.ts`)
- Calendar: solid clickable blocks (not background-only)
- **Block time** header action → create form
- Click block → side panel (label, date, all-day, start/end, remove)
- Shared PB collection — creates on Desk appear on mobile and vice versa

**Verify**

1. Desk: Block time → all-day → see grey event → edit label → remove  
2. Mobile: confirm block shows on calendar / blocked dates  
3. Mobile create block → Desk refresh range shows it  

---

## Recommended order (everything else)

Priority is **shared-data honesty first**, then **desk-useful ops**, then **hard platform work**.

| Wave | Surface | Why this order | Est. effort |
|------|---------|----------------|-------------|
| ~~1~~ | ~~Schedule~~ | **Done** | — |
| **2** | Team (roster read + assign) | Solo often has 1 tech; desk day board needs assignee later | M |
| **3** | Photos (job gallery on Desk) | MVP “quote ↔ invoice ↔ photos”; read-heavy first | M |
| **4** | PDF / portal | Needs `apps/api` client — highest leverage for paperwork desk | L |
| **5** | Billing (plan / subscription UI) | Mostly status display + deep-link; IAP stays mobile | S–M |
| **6** | Inventory | Useful for Sunday planning; larger schema surface | M–L |
| **7** | SMS | Twilio lives on `apps/api`; desk should trigger templates, not host Twilio | L |
| **8** | Offline queue | Field concern; desk is online-first — **defer or skip** | XL / optional |

---

## Wave 1 — Schedule

**Goal:** Edit booking / work schedule on Desk so blocked days and “outside hours” match mobile.

**Source of truth:** `app_settings.booking_schedule` (mobile `BookingSchedule` + `settings-store`).

**Desk work**

1. Extend `settings-api.ts` DeskAppSettings with `booking_schedule` fields already used on mobile.  
2. Settings → Preferences (or Business): weekdays, open/close times, timezone (timezone already partially there).  
3. Calendar optional: grey “outside hours” bands from schedule (nice-to-have).  
4. Remove “Mobile only” for Schedule row in `settings-hub` / workspace map; make it editable.

**Out of scope:** Customer-facing booking page (that’s `apps/api`).

**Depends on:** Nothing beyond existing `app_settings`.

---

## Wave 2 — Team

**Goal:** List technicians / operators in the org; optionally assign jobs.

**Likely data:** `users` filtered by `organization_id`, or a dedicated `team_members` / roster collection (confirm on Fly PB).

**Desk work**

1. Read-only Team page or Settings section: name, email, role.  
2. Job detail / calendar: show `assignee` if field exists on `jobs`.  
3. Write path: assign job to tech (if schema supports).

**Out of scope:** Multi-shop permissions, Enterprise RBAC.

**Depends on:** Schema discovery in PocketBase Admin.

---

## Wave 3 — Photos

**Goal:** View (then upload) job transformation / inspection photos on Desk.

**Source:** `jobs.photos` file fields + `photo_meta` (mobile offline sync-runner).

**Desk work**

1. Job / Calendar detail panel: thumbnail strip from PB file URLs.  
2. Lightbox viewer.  
3. Later: upload with same type limits as mobile (`jobPhotoLimitMessage`).  
4. Honor send gates when wiring invoices (Wave 4) — don’t invent vault rules.

**Depends on:** Auth’d file URLs from same PB; no `apps/api` required for view.

---

## Wave 4 — PDF / portal

**Goal:** Generate / open invoice PDF and customer portal links from Desk Money or job panel.

**Source:** `apps/api` (`EXPO_PUBLIC_APP_API_URL` / `rinsehq.com`) — mobile already calls this.

**Desk work**

1. Add `VITE_APP_API_URL` (non-secret base).  
2. Thin client: forward PocketBase bearer, org-scoped.  
3. Money / invoice row: “Open PDF”, “Copy portal link”, “Send” if API supports.  
4. Reuse mobile request shapes — do not fork PDF HTML.

**Depends on:** API CORS allowing Desk origin; auth validation on API.

**Risk:** Desk is outside monorepo — prefer shared types later via `@rinse/core` or OpenAPI.

---

## Wave 5 — Billing

**Goal:** Show plan / subscription status on Desk; don’t sell IAP in browser at launch.

**Desk work**

1. Settings → Billing: read subscription fields from org or billing collection.  
2. CTA: “Manage on iPhone” or Stripe Customer Portal URL if already provisioned.  
3. Unlock Settings hub row.

**Out of scope:** StoreKit / Play billing on web.

---

## Wave 6 — Inventory

**Goal:** Stock levels and low-stock alerts visible on Desk (Sunday supply run).

**Source:** Mobile inventory collections / home `InventoryAlertCard`.

**Desk work**

1. Inventory list page (qty, SKU, reorder).  
2. Optional: dashboard widget mirroring mobile alert.  
3. Adjust qty / log purchase (if mobile write paths exist and are safe).

**Depends on:** Collection schema inventory on PB.

---

## Wave 7 — SMS

**Goal:** Trigger SMS templates from Desk (quiet hours respected).

**Source:** Twilio via `apps/api`; quiet hours already in `app_settings`.

**Desk work**

1. Contact / Inbox / Campaign: “Send SMS” → API endpoint.  
2. Template picker (Settings Messages was wrongly labeled before — real SMS templates live with mobile/api).  
3. Never put Twilio secrets in `VITE_*`.

**Depends on:** Wave 4-style API client; quiet-hours already on Desk prefs.

---

## Wave 8 — Offline queue (defer)

**Recommendation:** **Do not port** mobile SQLite offline queue to Desk.

- Desk is a connected planning surface.  
- Offline queue is for field photos / job updates on bad LTE.  
- If needed later: read-only “pending sync” status from a PB-visible queue table — not a second offline writer.

---

## Cross-cutting principles

1. **Same PB org, same records** — never a parallel desk-only copy of jobs/clients.  
2. **Platform modules** (campaigns/chat/automations) stay Desk-local until PB collections exist; don’t block Waves 1–7.  
3. **`apps/api` for side effects** — PDF, SMS, portal, gates. Desk should grow an API client, not duplicate server logic.  
4. **Settings hub honesty** — as each wave lands, flip “Mobile only” → Open and implement the editor.  
5. **Monorepo debt** — longer term: move Desk into Detailing or publish `@rinse/core` shared types; not required to start Waves 1–3.

---

## Suggested next implementation

**Wave 2 Team** — roster list + optional job assignee.

---

## File anchors

| Area | Desk | Mobile |
|------|------|--------|
| Schedule | `src/lib/booking-schedule.ts`, `settings-api.ts`, Settings Schedule | `apps/mobile/src/lib/booking-schedule.ts` |
| Time blocks | `src/lib/api.ts`, `CalendarPage.tsx` | `apps/mobile/src/lib/time-blocks-api.ts` |
