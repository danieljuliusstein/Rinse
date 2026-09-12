# Wave 5A — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land shared `@rinse/core` types, PocketBase migrations, and `app_settings` JSON prefs that all later Wave 5 plans consume.

**Architecture:** Prefer nested JSON on `app_settings` (mirror `booking_schedule`) for org prefs; add job/client/invoice scalar fields via PB migrations; export types + Zod from `@rinse/core` so mobile and API stay aligned.

**Tech Stack:** TypeScript, Zod (`packages/core`), PocketBase migrations (`apps/pocketbase/pb_migrations`), Expo settings store (`apps/mobile/src/lib/settings-store.ts`).

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-crm-design.md`

## Global Constraints

- Types/schemas live in `@rinse/core` — do not duplicate in screen files
- Settings: merge-patch via existing `loadSettings` / `saveSettings`
- Migration timestamps ≥ `1763000000_*` (after `1762980000_document_locale_expand.js`)
- React Native / Expo only for mobile UI in later plans; this plan is data layer
- Commits only when the user explicitly asks
- Verify: `npm run typecheck` in `packages/core` and `apps/mobile`

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/core/src/types.ts` | DepositStatus, prefs types, Job/Client/Invoice field additions |
| `packages/core/src/validation/schemas.ts` | Zod for prefs + new job/client fields |
| `packages/core/src/index.ts` | Re-exports if needed |
| `apps/pocketbase/pb_migrations/1763000000_wave5_app_settings_prefs.js` | JSON fields on `app_settings` |
| `apps/pocketbase/pb_migrations/1763010000_wave5_job_fields.js` | Job deposit/route/assignee/weather/checklist/extras |
| `apps/pocketbase/pb_migrations/1763020000_wave5_client_membership.js` | Client membership fields |
| `apps/pocketbase/pb_migrations/1763030000_wave5_invoice_tax_jurisdiction.js` | Invoice `tax_jurisdiction` |
| `apps/pocketbase/pb_migrations/1763040000_wave5_entity_events.js` | `entity_events` collection |
| `apps/mobile/src/lib/settings-store.ts` | Map new prefs in `recordToSettings` / `saveSettings` |
| `apps/mobile/src/lib/wave5-prefs.ts` | **Create** — defaults + normalizers for prefs |

---

### Task 1: Core types for Wave 5 prefs and entity fields

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/validation/schemas.ts`
- Test: typecheck

**Interfaces:**
- Produces: `DepositStatus`, `BusinessPolicies`, `TipPrefs`, `PortalPermissions`, `TaxPreset`, `SopTemplate`, `TechRosterEntry`, `ReviewPrefs`, Job/Client field additions

- [ ] **Step 1: Add types to `packages/core/src/types.ts`**

```ts
export type DepositStatus = 'none' | 'due' | 'paid' | 'waived'

export type BusinessPolicies = {
  deposit_mode: 'percent' | 'fixed'
  deposit_value: number
  collect_at_booking: boolean
  cancel_window_hours: number
  no_show_fee: number
  no_show_fee_copy: string
}

export type TipPrefs = {
  suggest_on_pay_link: boolean
  presets: number[]
  tips_go_to: string
}

export type PortalPermissions = {
  pay: boolean
  photos: boolean
  reschedule: boolean
}

export type TaxPreset = { name: string; rate: number }
export type SopTemplate = { id: string; name: string; items: string[] }
export type TechRosterEntry = { id: string; name: string; color: string }
export type ChecklistItem = { id: string; label: string; done: boolean }
export type ReviewPrefs = {
  review_link: string
  review_rating_avg: number
  review_count: number
}
```

On `Job`, add optional: `deposit_status`, `deposit_amount`, `deposit_paid_at`, `route_order`, `assignee_id`, `weather_hold`, `checklist_items`, `extra_line_items`.

On `Client`, add optional: `membership_cadence`, `membership_paused`, `membership_next_visit`.

On `Invoice`, add optional: `tax_jurisdiction`.

- [ ] **Step 2: Add Zod schemas** in `schemas.ts` for prefs objects and checklist items; wire into job/client input schemas where create/update already validate.

- [ ] **Step 3: Typecheck core**

Run: `cd packages/core && npm run typecheck` (or workspace equivalent)  
Expected: PASS for new symbols

---

### Task 2: PocketBase migrations

**Files:**
- Create: four–five migration files under `apps/pocketbase/pb_migrations/` as in file map

- [ ] **Step 1: `app_settings` JSON columns**

Add optional JSON fields: `business_policies`, `tip_prefs`, `portal_permissions`, `tax_presets`, `sop_templates`, `tech_roster`, `review_prefs` (type `json`, required false). Follow pattern from `1761400000_schedule_and_travel.js` / quiet-hours migrations.

- [ ] **Step 2: `jobs` fields**

`deposit_status` (select: none/due/paid/waived), `deposit_amount` (number), `deposit_paid_at` (text/date), `route_order` (number), `assignee_id` (text), `weather_hold` (bool), `checklist_items` (json), `extra_line_items` (json).

- [ ] **Step 3: `clients` membership + `invoices.tax_jurisdiction` + `entity_events` collection**

`entity_events`: `organization_id`, `entity` (job|invoice), `entity_id`, `actor_id`, `action`, `patch` (json), `occurred_at`. List/create rules scoped to org auth like other collections.

- [ ] **Step 4: Apply migrations locally** (dev PB) and confirm collections update — document command used in PR notes

---

### Task 3: Mobile settings-store mapping

**Files:**
- Create: `apps/mobile/src/lib/wave5-prefs.ts`
- Modify: `apps/mobile/src/lib/settings-store.ts`

**Interfaces:**
- Consumes: core pref types
- Produces: `DEFAULT_BUSINESS_POLICIES`, `normalizeBusinessPolicies`, etc.; `AppSettings` includes optional pref keys

- [ ] **Step 1: Create normalizers** with safe defaults:

```ts
export const DEFAULT_BUSINESS_POLICIES: BusinessPolicies = {
  deposit_mode: 'percent',
  deposit_value: 25,
  collect_at_booking: false,
  cancel_window_hours: 24,
  no_show_fee: 0,
  no_show_fee_copy: '',
}

export const DEFAULT_TIP_PREFS: TipPrefs = {
  suggest_on_pay_link: false,
  presets: [15, 18, 20],
  tips_go_to: '',
}

export const DEFAULT_PORTAL_PERMISSIONS: PortalPermissions = {
  pay: true,
  photos: true,
  reschedule: false,
}
```

- [ ] **Step 2: Extend `AppSettings` + `recordToSettings` + `saveSettings` payload** to round-trip the six JSON keys without wiping unknowns.

- [ ] **Step 3: Typecheck mobile**

Run: `cd apps/mobile && npm run typecheck`  
Expected: no new errors in settings-store / wave5-prefs

- [ ] **Step 4: Commit only if user asked**

```bash
git add packages/core apps/pocketbase/pb_migrations apps/mobile/src/lib/settings-store.ts apps/mobile/src/lib/wave5-prefs.ts
git commit -m "$(cat <<'EOF'
Add Wave 5 foundation types, migrations, and settings prefs.

EOF
)"
```

---

## Handoff

Next plan: `docs/superpowers/plans/2026-07-24-wave5-b-money.md` (deposit + tips).
