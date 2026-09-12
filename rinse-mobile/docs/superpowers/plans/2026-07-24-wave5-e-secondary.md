# Wave 5E — Secondary 7–12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship secondary MVPs: client membership card, SOP checklists, tax jurisdiction presets, entity audit History, portal permission toggles + reschedule request, static drive-time ETA on job rows, plus Business **Reviews** row (Make).

**Architecture:** Prefer settings JSON + existing APIs. Audit writes to `entity_events`. Portal permissions enforced server-side. Drive-time uses existing OSRM route with `source: 'static'`.

**Tech Stack:** Same as prior Wave 5 plans.

**Spec:** `docs/superpowers/specs/2026-07-24-wave5-crm-design.md`  
**Depends on:** Plan A (and portal/checkout awareness from B).

## Global Constraints

- No geo tax API; no live traffic provider; reschedule ≠ full calendar write-back
- Do not conflate SOP checklist with liability inspection
- Commits only when user asks

---

## File map

| # | Feature | Primary files |
|---|---------|----------------|
| 7 | Membership | Client detail body; client API fields |
| 8 | SOP | Settings templates; job detail checklist; `checklist_items` |
| 9 | Tax presets | Settings tax presets; invoice tax row picker → `tax_rate` + `tax_jurisdiction` |
| 10 | Audit | API hook on job/invoice updates; History section on detail |
| 11 | Portal perms | Settings toggles; portal API enforce; reschedule request SMS |
| 12 | ETA | Job row subtitle via `/api/drive-time` |
| — | Reviews | Business tab row + review link prefs |

---

### Task 0: Business Reviews row

**MVP (chosen):** Operator-entered review summary + public review URL (not scraped Google ratings).

- Prefs on `app_settings` (or extend plan A prefs): `review_link`, `review_rating_avg`, `review_count` (optional display)
- Business / reports hub: ListRow “Reviews” with subtitle like `4.9 avg · 142 reviews` (Make); tap → sheet or settings to edit link/avg/count + shortcut to send `review_request` SMS template
- Reuse existing `{{review_link}}` message template plumbing in `messages-api.ts`

- [ ] **Step 1:** Add prefs + settings UI fields (link, avg, count)
- [ ] **Step 2:** Add Reviews `ListRow` on Business tab (`app/(tabs)/reports.tsx` or Business hub entry)
- [ ] **Step 3:** Detail sheet — edit fields + “Request review” using existing SMS template
- [ ] **Step 4:** Typecheck

### Task 1: Membership (7)

- [ ] Client detail Membership card: cadence (weekly/biweekly/monthly), next visit date, pause toggle
- [ ] Persist client membership fields
- [ ] Typecheck

### Task 2: SOP checklists (8)

- [ ] Settings: CRUD `sop_templates`
- [ ] Job detail: pick template → `checklist_items`; toggle done
- [ ] Separate section from inspection

### Task 3: Tax presets (9)

- [ ] Settings: list name+rate presets
- [ ] Invoice customize: picker sets `tax_rate` + `tax_jurisdiction` label

### Task 4: Audit trail (10)

- [ ] Server: on job/invoice status/price/tax change, append `entity_events`
- [ ] Mobile: History list on job + invoice detail (who/what/when)
- [ ] Read-only

### Task 5: Portal permissions (11)

- [ ] Settings toggles for pay / photos / reschedule
- [ ] Portal API returns 403/hide when disabled
- [ ] Reschedule v1: customer submits preferred date → SMS/notify operator (no auto calendar write)

### Task 6: Drive-time ETA (12)

- [ ] Job day/home rows: fetch static drive-time between stops or from pad
- [ ] Subtitle `12 min drive` (not “Live” until provider exists)
- [ ] Typecheck + smoke

---

## Program complete checklist

- [ ] Spec features 1–12 + Reviews row covered by plans A–E
- [ ] Forbidden still absent (postcard / card readers / R&I / AI Home)
- [ ] Full typecheck on touched packages
