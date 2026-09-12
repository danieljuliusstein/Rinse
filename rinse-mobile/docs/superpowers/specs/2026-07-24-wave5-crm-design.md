# Wave 5 CRM — design

**Date:** 2026-07-24  
**Surface:** `apps/mobile` operator CRM + `packages/core` + `apps/api` + PocketBase  
**Status:** Approved scope (conversation) — HIGH 1–6 + secondary 7–12 + Business Reviews row; skip forbidden only  
**UI reference:** `/Users/danny/Downloads/Follow Prompt Action/src/App.tsx` (Make) + `docs/FIGMA_MAKE_CRM_PROMPT.md`  
**Approach:** Sequential sub-plans (A→E). One subsystem per plan file under `docs/superpowers/plans/`.

---

## Goal

Ship operator Wave 5 so detailers can collect deposits, tip on pay links, reorder day routes, rain-reschedule, assign techs, sell catalog add-ons, plus secondary membership / SOP / tax presets / audit / portal toggles / drive-time ETA — without rebuilding shipped shells.

## Non-goals

- Postcard mail, Bluetooth card readers, R&I/PDR guides, purple AI Home chat
- Desktop multi-column tech board
- Live Mapbox/Google traffic in v1 (static OSRM only)
- Geo tax lookup
- Porting Make web DOM into RN

## Constraints

- React Native primitives + `StyleSheet`; operator light tokens (`#22c55e`)
- Shared logic in `@rinse/core`; settings via PocketBase `app_settings` JSON (same pattern as `booking_schedule`)
- Compose `src/components/ui/*` / `AppSheet`; adapt Make sheets, don’t invent parallel chrome
- Expo SDK 57; no `setInterval` sync loops; PB FormData for files
- Commits only when the user explicitly asks
- Verification: `npm run typecheck` in `apps/mobile` (and core package as needed)

---

## Program decomposition (chosen approach)

**Recommended: Sequential sub-plans A→E** (one shippable vertical each).

| Alt | Trade-off |
|-----|-----------|
| **A. One monolith plan** | Unreviewable; skill rejects multi-subsystem specs |
| **B. Sequential A→E (chosen)** | Clear deps; settings land first; money before portal tip; day ops independent of team |
| **C. Parallel money ∥ ops tracks** | Faster wall-clock; merge conflicts on `Job` / `app_settings` |

**Order:** Foundation → Deposit+Tips → Route+Weather → Tech+Add-ons → Secondary 7–12.

---

## Architecture

```
app_settings JSON prefs ──► Settings screens (policies, tips, portal, tax, SOP, techs)
        │
        ├── book / portal / checkout (API reads same row)
        │
jobs / clients / invoices fields ◄── PB migrations + @rinse/core types
        │
        └── Mobile sheets / day lists / Home weather (Make-inspired UI)
```

### Pref groups on `app_settings`

| Key | Purpose |
|-----|---------|
| `business_policies` | Deposit %/fixed, collect_at_booking, cancel_window_hours, no_show_fee + copy |
| `tip_prefs` | suggest_on_pay_link, presets, tips_go_to |
| `portal_permissions` | pay, photos, reschedule |
| `tax_presets` | `[{ name, rate }]` |
| `sop_templates` | `[{ id, name, items: string[] }]` |
| `tech_roster` | `[{ id, name, color }]` |
| `review_prefs` | `review_link`, `review_rating_avg`, `review_count` (Business Reviews row) |

### Entity fields (MVP)

| Entity | Fields |
|--------|--------|
| Job | `deposit_status`, `deposit_amount`, `deposit_paid_at`, `route_order`, `assignee_id`, `weather_hold`, `checklist_items`, `extra_line_items` |
| Client | `membership_cadence`, `membership_paused`, `membership_next_visit` |
| Invoice | `tax_jurisdiction` (label; `tax_rate` already exists) |
| New collection | `entity_events` for audit trail |

---

## Feature map → plan file

| # | Feature | Plan |
|---|---------|------|
| — | Types, migrations, settings mapping | `2026-07-24-wave5-a-foundation.md` |
| 1 | Deposit / cancel / no-show | `2026-07-24-wave5-b-money.md` |
| 3 | Tips on pay link | same B |
| 2 | Day route order | `2026-07-24-wave5-c-day-ops.md` |
| 4 | Weather reschedule | same C |
| 5 | Multi-tech | `2026-07-24-wave5-d-team-addons.md` |
| 6 | Add-on catalog | same D |
| 7–12 | Membership, SOP, tax, audit, portal, ETA | `2026-07-24-wave5-e-secondary.md` |
| — | Business Reviews row | same E |

---

## Make UI → native mapping

| Make component | Native target |
|----------------|---------------|
| `DepositSettingsSheet` | `app/settings/policies.tsx` + sheet |
| `CollectDepositSheet` | Job detail sheet |
| Cancel copy only | New cancel sheet (fills Make gap) |
| Jobs `routeMode` | Jobs day + Home today |
| `TipsSheet` | Share/pay flow after photo gate |
| Weather banner + `WeatherSheet` | Extend `WeatherReadinessCard` + sheet |
| Tech filters/chips | Jobs day + create/edit picker |
| Add-on stub | Real catalog (Make had noop) |

Shell screens in Make (Home/Clients/Business/FAB) = **reference only**.

---

## Success criteria

- Operator can configure deposit policy and collect/mark deposit on a job
- Customer pay link can suggest tip chips; invoice shows tip when paid
- Day jobs reorder with persisted `route_order`
- Rain risk → reschedule sheet → SMS + weather_hold
- Jobs filterable/assignable to tech roster
- Add-ons selectable onto quote/job lines
- Secondary 7–12 MVPs as defined in plan E
- Business Reviews row (avg + count + open review link / request flow)
- No forbidden features

---

## Spec self-review

- No TBD placeholders for scope (MVPs chosen)
- Decomposition matches writing-plans subsystem rule
- Settings pattern consistent with existing `booking_schedule`
- Secondary live traffic deferred to static OSRM wiring only
