# Figma Make Prompt — Rinse Operator CRM (`apps/mobile`)

Use this with **Figma Make** to refine CRM UI mockups so they match the shipped native app. Attach screenshots of Home, Jobs, Clients, Business, a bottom sheet, and Settings if you have them.

**Copy everything below the line into Figma Make.**

---

You are designing **operator CRM screens** for **Rinse** — an iOS-first Expo / React Native app for solo and small-shop mobile detailers (`apps/mobile`).

Your job: take the existing Figma Make mockup and restyle / extend it so every frame feels like a **natural continuation of the live app** — clean, modern, aesthetic — **not** a marketing landing page and **not** a redesign.

Do **not** invent a new brand, dark theme, or navigation paradigm. Extend what exists.

---

## Product context

| Item | Value |
|------|--------|
| App | **Rinse** operator CRM |
| User | Detailer in the field (one-handed, outdoor, time-poor) |
| Job to be done | Book → run job → document → invoice → get paid |
| Platform | iPhone portrait, safe areas, **44pt** min tap targets |
| Frame size | **390×844** (content max width **428**) |
| Theme | **Light only** (shipped source of truth) |

---

## App shell (already built — do not redesign)

### Bottom navigation
- Visible tabs: **Home · Jobs · [center green FAB] · Clients · Business**
- FAB = primary create affordance (raised, green `#22c55e`, soft green glow OK)
- FAB tap → **Quick actions** bottom sheet: New lead · New job · Create invoice · Log expense · Buy supplies · New quote
- FAB long-press → new job (note in specs; no need to animate)
- Hidden modules (reachable from Home / Tools / header — **not** extra tab icons): Settings, Invoices, Pipeline, Messages, Inventory, Quotes, Tools

### Screen chrome
- Page bg `#f2f2f7`; content padding **16px** horizontal
- Headers: Syne title, back chevron on sub-screens, optional trailing icon buttons
- Scroll content clears the tab dock (~56px + safe area)
- Create/edit flows = **`AppSheet` bottom sheets** (drag handle, top radius 16, scrim `rgba(0,0,0,0.35)`, optional sticky footer CTA) — not centered modals
- Detail screens = full page or card presentation with back header

### Recurring components (match these)
- **Card / SectionGroup:** white, radius **14**, hairline `#e5e5ea`, shadow `0 1px 3px rgba(0,0,0,0.06)`, pad 16
- **ListRow:** 40×40 icon chip (radius 12) + title + muted subtitle + optional badge + chevron
- **Section label:** 11px uppercase, tracking 0.4, `#8e8e93`, above grouped cards
- **Badge:** soft tinted pills (paid/completed green, overdue red, scheduled blue, draft gray, pending amber)
- **Button:** primary green fill / secondary bordered / ghost / danger — radius 14, min height 44
- **SearchField:** white/surface, radius 12, magnifying glass
- **FormField:** section label, focus ring green, filled state soft green, error red
- **EmptyState:** 88×88 art tile + h2 + caption + one primary CTA
- **Pill / filter chips:** selected = `greenSoft` + `greenBorder`
- Icons: **Phosphor** duotone/regular (~20–22px)
- One primary green CTA per screen (squint test)

---

## Exact design tokens (from `apps/mobile/src/theme`)

### Color
| Token | Hex | Usage |
|-------|-----|--------|
| `bg` | `#f2f2f7` | Screen canvas |
| `surface` | `#ffffff` | Cards, sheets, fields |
| `surfaceActive` | `#ebebf0` | Pressed rows |
| `text` | `#000000` | Titles, primary text |
| `textSecondary` | `#3c3c43` | Body |
| `textMuted` | `#8e8e93` | Captions, section labels |
| `textDim` | `#aeaeb2` | Hints |
| `border` | `#e5e5ea` | Hairlines |
| **`green`** | **`#22c55e`** | FAB, primary CTAs, active tab |
| `greenText` | `#15803d` | Success text |
| `greenSoft` | `#dcf5e3` | Selected chips / soft success |
| `greenBorder` | `#bbf7d0` | Soft outlines |
| `danger` | `#ef4444` | Destructive |
| `amber` | `#f59e0b` | Warnings |
| `blue` | `#2563eb` | Info / scheduled |
| `navBg` | `rgba(255,255,255,0.94)` | Tab bar / sticky headers |

Icon chip tones: blue / green / amber / purple soft fills (12% opacity style). FAB icon ink `#071407`.

### Type
- Display: **Syne** 700 / 600 — h1 28/34, h2 20/26
- Body: **DM Sans** 400/500/600 — 15/20
- Caption: DM Sans 13/18 muted
- Button: DM Sans 600, 16/20, white on primary
- No Inter / Roboto / system UI as brand fonts

### Space & radius
- Spacing: 4 / 8 / 16 / 24 / 32
- Radii: md 12 · lg 14 · sheet 16 · icon 10 · pill 999 · badge ~6

### Motion (spec notes only)
- Press scale ~0.98 · sheets ~280ms · list stagger 50ms cap 12 · FAB/tabs snappy
- Prefer calm springs over bouncey marketing motion

---

## Visual best practices (CRM)

- **Field-first:** large tap targets, thumb-zone primary actions, readable outdoors (high contrast black on white/gray)
- **Progressive disclosure:** don’t dump every setting on one screen; sheets + section groups
- **Honesty:** empty states teach the next action; never fake urgency
- **Status clarity:** badges + one-line subtitles beat dense tables
- **Consistency:** reuse ListRow / SectionGroup / Badge — don’t invent new card dialects per feature
- **Avoid:** dark mode default, purple AI glow, heavy shadows, card-in-card nesting, floating stickers on content, desktop-only dense grids on phone

---

## Already shipped (reference only — do not rebuild)

Home (greeting, calendar, today’s jobs, revenue/AR, weather readiness, inventory alerts) · Jobs (schedule, detail, inspection, photos, timer, expenses) · Clients (CRM, vehicles, CSV import) · Business/reports · Pipeline/leads · Quotes · Invoices · Inventory · Messages (SMS templates) · Expenses · Settings hub · Onboarding · Offline drafts

New mockups must **plug into** these surfaces (entry from FAB, job detail, settings, or Tools) — not invent parallel apps.

---

## PRIORITY — new CRM features to mock (Wave 5+)

Spend most effort here. For each feature: **empty · populated · mid-flow sheet** (min 2–3 frames). Show entry point from the existing shell.

### 1. Deposit / cancel / no-show policy (HIGH)
**Surfaces:** Settings → Invoicing or Business policies · Job detail · Public book (operator preview) · Invoice lines

**Design:**
- Settings form: deposit % or fixed amount · collect at booking toggle · cancel window (hours) · no-show fee copy
- Job detail row: **Deposit** status badge (`Due` amber / `Paid` green / `Waived` gray) + amount
- Sheet: “Collect deposit” → amount, send pay link, mark paid
- Cancel flow sheet: policy summary for operator + customer-facing copy preview (EN/ES note OK)
- Do **not** redesign public booking site chrome — show as a small “Customer sees” preview card inside the operator sheet

### 2. Day route packing / route order (HIGH)
**Surfaces:** Jobs day view · Home “Today”

**Design:**
- Day list with **drag handles** to reorder stop sequence (1, 2, 3…)
- Each row: sequence index · time window · client · vehicle · drive-time pad subtitle (e.g. “12 min drive”)
- Sticky footer: **Save route order** (primary green)
- Optional map thumbnail strip (simplified — not a full GIS app)
- Empty: “Add jobs to today to build a route”
- Keep calendar/list modes; route order is an enhancement of the day list, not a new tab

### 3. Tips on payment link (HIGH)
**Surfaces:** Invoice detail · Share / pay-link sheet · after transformation-photo gate

**Design:**
- Toggle: **Suggest tip on pay link** · preset chips 15% / 18% / 20% / Custom · optional “Tips go to…” note
- Customer pay preview card (light, minimal): invoice total + tip chips + pay CTA
- Invoice detail shows tip line when paid (`Tip $24` muted row)
- Respect existing gates: tip UI appears in share flow after photos when gated — show a quiet checklist row (“Transformation photos ✓”)

### 4. Weather / rain-day reschedule
**Surfaces:** Home weather readiness · Jobs day · job detail

**Design:**
- Home banner when outdoor risk: amber soft card — “Rain likely · 3 outdoor jobs” · **Reschedule day** CTA
- Sheet: list today’s outdoor jobs with checkboxes · pick new date · message preview (“We’ll move you to …”) · Send SMS / Skip
- Job row badge: `Weather hold` amber

### 5. Multi-tech assignment
**Surfaces:** Job create/edit sheet · Jobs day filters · optional tech avatar on cards

**Design:**
- Assignee picker: avatar/initials chips (You + tech names) — solo default = You
- Day filter pills: **All · Me · Alex · Sam**
- Job cards show small assignee chip; unassigned = muted “Unassigned”
- Keep phone-simple — **not** a desktop multi-column board (note “desktop later” in specs if needed)

### 6. Add-on catalog
**Surfaces:** Settings → Packages · Quote/Job line editor · booking package picker

**Design:**
- Catalog list: add-on name · price · duration pad · active toggle (Pet hair, Ozone, Ceramic, Engine bay…)
- On quote/job: **Add add-ons** sheet with checkboxes → append hybrid qty×price lines
- Avoid free-text-only as the primary path; free-text remains secondary “Custom line”

---

## Secondary (design if time remains)

7. **Recurring / membership** — client detail “Membership” card · interval (weekly/biweekly) · next visit · pause  
8. **SOP / job checklists** — job detail checklist section · template picker in Settings  
9. **Jurisdiction tax picker** — invoice/job tax row · manual jurisdiction select first (simple)  
10. **Audit trail** — job/invoice “History” list: who / what / when  
11. **Deeper portal self-serve** — operator “Portal permissions” sheet: pay · reschedule · photos toggles  
12. **Live traffic ETA** — job row subtitle upgrade from static pad to “Live · 14 min” with subtle blue info

**Explicitly do not mock:** postcard mail, Bluetooth card readers, R&I/PDR labor guides, purple “AI chat” takeover of Home.

---

## Frame checklist (deliverables)

1. Updated **app shell** reference (tab bar + FAB + one Home populated frame) matching tokens above  
2. For each HIGH feature (1–3 at minimum; 1–6 ideal): entry point → primary screen → key sheet(s) → success/empty  
3. Component stickers / notes: token hex, Syne/DM Sans, radius, Phosphor icon names  
4. Interaction notes: sheet vs full page, tap targets ≥44, one primary CTA  
5. All frames **390×844**, light mode only  

Refine the existing mockup’s structure where it’s strong; replace off-brand colors, fonts, dark surfaces, and invented nav with the Rinse CRM system above.

Output production-ready CRM frames that a React Native engineer could implement in `apps/mobile` without guessing the visual language.
