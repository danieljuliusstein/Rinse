# Wave 5D — Multi-tech + Add-on Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lightweight tech roster with job assignee + day filters; first-class add-on catalog with checkbox pickers on quote/job (not free-text-first).

**Architecture:** Roster in `app_settings.tech_roster`. Job `assignee_id` references roster id or `"self"`. Add-ons: dedicated Settings list (extend `invoice_line_templates` with `category: 'addon'` **or** `active` + duration field — choose category/tag on templates to avoid new PB collection unless needed). Job `extra_line_items` feeds invoice creation.

**Tech Stack:** Expo forms, `PillGroup` / chips, `HybridLineEditor`, settings-store.

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-crm-design.md`  
**Depends on:** Plan A.

## Global Constraints

- Solo default = You when roster empty
- No desktop multi-column board
- Reuse hybrid qty×price lines from `@rinse/core`
- Commits only when user asks

---

## File map

| File | Responsibility |
|------|----------------|
| `app/settings/team.tsx` | **Create** — tech roster CRUD |
| `JobCreateForm` / job edit | Assignee picker |
| Jobs day list | Filter pills All/Me/techs + chips on cards |
| `app/settings/addons.tsx` or packages sibling | Add-on catalog |
| `QuoteCreateForm` / job forms | Add-ons sheet |
| Invoice-from-job | Merge job `extra_line_items` |

---

### Task 1: Tech roster settings

- [ ] **Step 1:** Settings → Team screen: list roster, add name+color, delete
- [ ] **Step 2:** Persist via `saveSettings({ tech_roster })`
- [ ] **Step 3:** Typecheck

---

### Task 2: Assignee on jobs + day filters

- [ ] **Step 1:** Picker chips on create/edit (You + roster)
- [ ] **Step 2:** Persist `assignee_id` on job create/update
- [ ] **Step 3:** Day filter pills; filter list client-side
- [ ] **Step 4:** Card chip / Unassigned muted label

---

### Task 3: Add-on catalog

- [ ] **Step 1:** Catalog UI — name, price, duration pad, active toggle (seed examples: Pet hair, Ozone, Ceramic, Engine bay)
- [ ] **Step 2:** Store as tagged line templates or dedicated settings list; prefer PB `invoice_line_templates` + `category: 'addon'` if field exists or add via migration in this plan
- [ ] **Step 3:** Quote/job **Add add-ons** sheet — checkboxes → append hybrid lines
- [ ] **Step 4:** Job `extra_line_items` → `createInvoiceForJob` includes them
- [ ] **Step 5:** Typecheck + manual add-on on quote

Next: `2026-07-24-wave5-e-secondary.md`
