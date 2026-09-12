# Wave 5B — Deposit + Tips (Money) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operator deposit/cancel/no-show policy + collect-deposit flow, and tip suggestion on customer pay links (after photo gate), with invoice tip line visible when set.

**Architecture:** Policy lives in `app_settings.business_policies` / `tip_prefs`. Job carries deposit fields. Collect deposit creates/updates a partial payment or dedicated deposit checkout amount. Portal checkout accepts optional tip percent/amount, writes `invoice.tip`, then charges `balance_due`. Native sheets mirror Make `DepositSettingsSheet`, `CollectDepositSheet`, `TipsSheet`.

**Tech Stack:** Expo Router, `AppSheet`, PocketBase jobs/invoices, Stripe checkout in `apps/api`, `@rinse/core` types from plan A.

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-crm-design.md`  
**Depends on:** `2026-07-24-wave5-a-foundation.md`

## Global Constraints

- Same RN / token / `@rinse/core` rules as design spec
- UI from Make — adapt to `AppSheet` + Phosphor; no web `div`/`className`
- Transformation photo gate already exists — tip UI appears only after gate passes
- Commits only when user asks
- Verify: `npm run typecheck`; manual smoke on deposit badge + tip chips

---

## File map

| File | Responsibility |
|------|----------------|
| `app/settings/policies.tsx` | **Create** — deposit/cancel/no-show form |
| `app/settings/invoicing.tsx` or settings index | Link to Policies |
| `src/components/jobs/CollectDepositSheet.tsx` | **Create** |
| `src/components/jobs/CancelJobPolicySheet.tsx` | **Create** |
| `src/components/detail/JobDetailBody.tsx` | Deposit badge + entry points |
| `src/lib/deposits.ts` | **Create** — compute due amount from policy + job revenue |
| `src/components/invoice/` share sheets | Tip prefs in share/pay flow |
| `apps/api/.../portal/[token]/checkout/route.ts` | Accept tip; update invoice |
| Portal pay UI | Tip chips customer-facing |
| `app/invoices/[id].tsx` | Ensure tip row when `tip > 0` |

---

### Task 1: Compute deposit due helper

**Files:**
- Create: `apps/mobile/src/lib/deposits.ts`
- Test: typecheck / small assert via `tsx` if no jest

**Interfaces:**
- Consumes: `BusinessPolicies`, job `revenue`
- Produces: `computeDepositDue(policies, revenue): number`

- [ ] **Step 1: Implement**

```ts
import type { BusinessPolicies } from '@rinse/core'

export function computeDepositDue(policies: BusinessPolicies, revenue: number): number {
  if (policies.deposit_mode === 'fixed') return Math.max(0, Number(policies.deposit_value) || 0)
  const pct = Number(policies.deposit_value) || 0
  return Math.round(((revenue * pct) / 100) * 100) / 100
}
```

- [ ] **Step 2: Sanity check**

Run: `npx tsx -e "import { computeDepositDue } from './src/lib/deposits.ts'; console.log(computeDepositDue({deposit_mode:'percent',deposit_value:25,collect_at_booking:false,cancel_window_hours:24,no_show_fee:0,no_show_fee_copy:''}, 200))"`  
Expected: `50`

---

### Task 2: Settings — policies screen

**Files:**
- Create: `app/settings/policies.tsx`
- Modify: settings hub / invoicing to navigate to `/settings/policies`

- [ ] **Step 1: Screen** loads `business_policies` via `loadSettings`, edits mode/value/toggles/copy, saves with `saveSettings({ business_policies })`. Match Make labels: deposit % or fixed, collect at booking, cancel window hours, no-show fee + copy. One primary green Save.

- [ ] **Step 2: Typecheck**

---

### Task 3: Collect deposit + badges + cancel sheet

**Files:**
- Create sheets under `src/components/jobs/`
- Modify: `JobDetailBody` (+ jobs list badge if cheap)

- [ ] **Step 1: Badge** — map `deposit_status` → Badge tone (due=amber, paid=green, waived=gray, none=hide)

- [ ] **Step 2: CollectDepositSheet** — amount (prefill `computeDepositDue`), Send pay link / Mark paid / Waive. On mark paid: set `deposit_status='paid'`, `deposit_paid_at`, `deposit_amount`; optionally append invoice payment if invoice exists.

- [ ] **Step 3: CancelJobPolicySheet** — show cancel window + no-show copy from settings; confirm cancel action (soft: set notes / status path chosen in implementation — prefer explicit cancelled handling without inventing status enum if blocked; otherwise document status as notes + delete policy honesty from existing vault patterns).

- [ ] **Step 4: Wire job detail rows to open sheets

---

### Task 4: Tips on pay link

**Files:**
- Modify: share/pay link actions + portal checkout + portal pay component
- Modify: invoice detail tip display

- [ ] **Step 1: Operator share flow** — if `tip_prefs.suggest_on_pay_link` and photo gate OK, show tip toggle + chips (15/18/20/custom) + tips_go_to note before copy/SMS (Make `TipsSheet`).

- [ ] **Step 2: Portal checkout API** — accept `tip_amount` or `tip_percent`; set `invoice.tip`; recompute total/balance; Stripe session uses updated balance.

- [ ] **Step 3: Portal UI chips** — light customer preview card; respect `portal_permissions.pay`.

- [ ] **Step 4: Invoice detail** — muted `Tip $X` row when `tip > 0` (reuse existing layout if already shown).

---

### Task 5: Smoke + handoff

- [ ] Manual: set 25% policy → job $200 → due $50 → mark paid → badge Paid
- [ ] Manual: enable tip suggest → portal pay with 18% → invoice tip set
- [ ] Typecheck mobile + api as touched

Next: `2026-07-24-wave5-c-day-ops.md`
