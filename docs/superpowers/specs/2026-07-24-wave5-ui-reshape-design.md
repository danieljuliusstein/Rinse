# Wave 5 UI reshape — Business hub + Make-aligned Jobs/sheets

**Date:** 2026-07-24  
**Surface:** `apps/mobile` (worktree `mobile-wave5-crm`, branch `feat/wave5-crm`)  
**Status:** Approved (conversation)  
**References:** `/Users/danny/Downloads/Follow Prompt Action/src/App.tsx`, user mockups (Business hub, job detail, Jobs day, Share Pay Link, Rain Day reschedule), `docs/FIGMA_MAKE_CRM_PROMPT.md`

---

## Goal

Reshape the operator shell so **Business is the hub** (Reports on top; all settings modules live there), and Jobs / job detail / share-pay / weather-reschedule match Make’s **compact, clean** structure using existing native tokens and components — not a web port.

## Non-goals

- Desktop multi-column tech board  
- Live traffic maps beyond static drive-time  
- New design lane / dark mode / purple AI chrome  
- Rebuilding settings screens from scratch (reuse `/settings/*` destinations)  
- Pixel-perfect Make DOM/`div`/`className` in RN

## Constraints

- React Native primitives + `StyleSheet`; operator light (`#f2f2f7` / `#22c55e`)  
- Compose `ListRow`, `SectionGroup`, `AppSheet`, `PillGroup`, `Badge`, `PrimaryButton`  
- Shared logic in `@rinse/core`; prefs already on `app_settings` (Wave 5A)  
- Commits only when user asks  
- Verify: `npm run typecheck` in mobile worktree

---

## Decision log

| Decision | Choice |
|----------|--------|
| Business tab content | **Hub only** — no inline P&L charts |
| Charts location | **Revenue & Payouts** row → drill into current charts screen |
| Settings discovery | All current `SETTINGS_MENU_ITEMS` (+ Wave 5 rows) surfaced on Business hub |
| Jobs tech filter | All / You / `tech_roster` + path to add techs |
| Route mode | Numbered reorder + persist `route_order` (↑↓ MVP OK) |
| Job detail | Compact card stack + Share Pay Link / Tip CTA |
| Share / weather sheets | Restyle to Make structure; keep AppSheet |

---

## 1. Business hub

**File:** `app/(tabs)/reports.tsx` (tab title remains Business)

Replace chart-first layout with sectioned ListRows:

### Reports (top)

| Row | Subtitle (live when cheap) | Destination |
|-----|----------------------------|-------------|
| Revenue & Payouts | Monthly summaries, payouts | New route e.g. `app/reports/pl.tsx` (or `app/(tabs)/reports/pl.tsx`) containing **current** P&L / charts UI moved out of hub |
| Reviews | `X.X avg · N reviews` from `review_prefs` | `/settings/crm-extras` (or Reviews-focused sheet later) |

### Invoicing

| Row | Destination |
|-----|-------------|
| Invoices | `/(tabs)/invoices` — subtitle AR unpaid when available |
| Deposit & Cancel Policy | `/settings/policies` |
| Add-on Catalog | `/settings/addons` |
| (Optional keep) Stripe / line templates | `/settings/invoicing` if not redundant with rows above |

### Operations

| Row | Destination |
|-----|-------------|
| Quotes | `/(tabs)/quotes` |
| Expenses | `/settings/expenses` or business-expenses entry currently used |
| Pipeline | `/(tabs)/pipeline` |
| Inventory (optional) | `/(tabs)/inventory` |

### Settings

Mirror **every** item from `src/lib/settings-menu.ts` groups (account, business, preferences, management, support), including Team (`/settings/team`), CRM extras, quiet hours, language, billing, support, etc.

**Search:** Keep optional search on hub (reuse `searchSettingsMenu` + hub rows) so modules stay findable.

**Chrome:** `SectionGroup` + `ListRow` + Phosphor duotone; compact vertical rhythm (section label → card → next section).

---

## 2. Jobs day list

**File:** `app/(tabs)/jobs/index.tsx` (+ small card helper if needed)

- **Tech filter chips:** `All` | `You` (`assignee_id` empty/`self`) | each `tech_roster` entry; filter client-side.  
- **Add operators:** chip or link → `/settings/team`.  
- **Route button:** toggles route mode (selected = blue/green soft per tokens).  
- **Route mode:** numbered stops for filtered day jobs; ↑↓ reorder; save sequential `route_order`; banner “Reorder stop sequence”.  
- **Normal cards (compact):** client name + status badge; vehicle/service/time line; assignee chip; deposit badge; drive-time when available; weather hold badge when set.

Default list remains period grouping when not date-filtered; **day/route UX** emphasizes today’s (or `?date=`) jobs.

---

## 3. Job detail (overlay / sheet body)

**File:** `src/components/detail/JobDetailBody.tsx` (and overlay presentation)

Restructure primary content (remove visual clutter; keep existing actions available without duplicating Make’s unused chrome):

1. **Vehicle** card — year/make/model/color when known; address for mobile  
2. **Service rows** — Service, Time (+ duration if known), Technician chip, Status badge  
3. **Deposit** card — badge + due/paid/waived copy; Collect when due  
4. **Before/After** checklist — counts from photos; tap opens photos  
5. **Footer CTA** — Share Pay Link / Tip (opens share/tips sheet)

Secondary actions (complete, on my way, cancel, edit) remain below or in overflow — do not fight the one primary green CTA.

---

## 4. Share Pay Link sheet

**Files:** `TipsSheet` / `ShareLinkActions` (+ new wrapper sheet if cleaner)

Make-aligned structure:

- Gate banner when transformation OK  
- Suggest tip toggle + tip chips (15/18/20/Custom)  
- Customer preview card (service, total, tip chips, Pay $X mock)  
- Footer: Copy link | Send via SMS  

Respect photo gate; use `tip_prefs` from settings.

---

## 5. Rain Day reschedule sheet

**File:** `WeatherRescheduleSheet.tsx`

- Risk banner (chance/copy + outdoor job count)  
- SELECT JOBS checkboxes  
- MOVE TO date chips  
- MESSAGE PREVIEW (template with new date)  
- Skip | Send SMS & Reschedule  

Persist date + `weather_hold`; SMS via existing templates.

---

## Architecture

```
Business hub (reports.tsx)
  ├─ Revenue & Payouts → reports/pl (charts)
  ├─ Reviews / Invoicing / Ops rows → existing tabs & settings
  └─ Settings rows → /settings/*

Jobs index
  ├─ tech filter + Route mode → route_order
  └─ Job press → detail overlay (compact cards)
        └─ Share Pay Link → Tips/share sheet
Home weather risk → WeatherRescheduleSheet
```

---

## Success criteria

- Business tab reads as Make hub; Reports first; settings modules reachable without a separate Settings “home” as primary discovery  
- Charts still available under Revenue & Payouts  
- Jobs: filter by tech, Route reorder persists, cards show assignee/deposit/drive  
- Job detail matches compact card stack + Share Pay Link CTA  
- Share + Rain sheets match Make structure in native chrome  
- Compact/simple styling; typecheck clean for touched files  

## Spec self-review

- No TBD for Business charts destination (drill-in screen)  
- Settings migration = surface existing menu, not rewrite forms  
- Route = ↑↓ MVP acceptable vs full drag  
- Does not contradict Wave 5 data layer already landed  

---

## Next

Implementation plan: `docs/superpowers/plans/2026-07-24-wave5-ui-reshape.md` (writing-plans), then execute on `feat/wave5-crm`.
