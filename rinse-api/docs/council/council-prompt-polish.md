# LLM Council Prompt — Targeted UI Polish (Settings, FAB, Inventory, Money Export, Invoices)

**Product:** `detailing-app` — multi-tenant SaaS CRM for solo mobile detailers  
**Context:** A prior council run produced a 12-week design evolution plan (tokens, booking prototype, portal unification). This prompt focuses on **remaining pain points** the owner flagged after that work.  
**Copy everything below the `---` line** into your external LLM council. Attach screenshots of the surfaces listed in each section.

**Note for council:** Implementation will be done immediately via AI coding agents — **do not estimate weeks, hours, or sprints**. Deliver concrete, file-specific recommendations ordered by impact.

---

## Council instructions

Run Karpathy-style LLM Council: **5 advisors** (Contrarian, First Principles, Expansionist, Outsider, Executor) → **anonymous peer review** → **chairman synthesis**.

Advisors must reference **specific routes, components, class names, and files** from this brief — not generic SaaS UX advice.

**Chairman must deliver:**

1. **Verdict per focus area** (1–5 below) — keep / polish / redesign, with rationale
2. **Top 10 actionable changes** — ordered list with exact files/classes to touch
3. **FAB & IA redundancy map** — which quick actions duplicate bottom nav, home icons, or settings links; what to cut or merge
4. **Settings information architecture** — proposed section groupings (not just accordions inside one card)
5. **Money export strategy** — recommend one approach for “nice-looking” financial exports (styled in-app table vs HTML download vs PDF-only vs improved CSV structure)
6. **Customer invoice design system** — single direction for PDF + portal + email attachment parity (fonts, accent, layout grid)
7. **Stop list** — patterns to abandon in these five areas only
8. **One prototype to build first** — highest-leverage single screen or component to validate before rolling out

**Do not include:** time estimates, sprint planning, or phased week counts.

---

## Question

**How should we polish these five specific surfaces without a full app redesign?**

The owner dislikes the current settings layout, sees alignment issues on the booking-link UI, wants inventory layout critically reviewed, suspects redundancy in the center FAB menu, and wants Money-report exports and customer-facing invoices to look professionally designed (CSS/layout quality).

What should change? What should stay? What creates confusion or duplicate paths?

---

# FOCUS AREA 1 — Settings layout (`/settings`)

## Owner complaint

> “I don't really like the settings layout.”

## Current implementation

| Piece | Location |
|-------|----------|
| Page component | `src/components/Settings.tsx` |
| Styles | `src/app/settings/settings.css` |
| Shell | `app-shell--settings` (390px, dark) |

### Structure today

Long vertical scroll with **6 section heads** + **6 `.card.settings-card` blocks**, plus a sticky **Save settings** button and a collapsible **Advanced** `<details>` block:

| Section | Contents |
|---------|----------|
| **Business** | `grouped` card with 3 nested `<details>` accordions: Online booking (URL, copy, preview), Brand (logo, business name), Contact (phone, email, address) |
| **Invoicing** | Single textarea — invoice terms footer |
| **Notifications** | 5 toggles + push notifications toggle |
| **Operations** | Link rows → inventory, overhead, business expenses, packages, all invoices |
| **Data & security** | Change PIN, backup, export JSON |
| **Account** | Log out, privacy policy |
| **Advanced** | Backend badge, migration, sync queue, cron — separate bordered `<details>` |

### Patterns in use

- `SettingsSection` — section title + description + card wrapper
- `SettingsAccordion` — nested `<details>` inside Business card only (recent change)
- `settings-advanced` — top-level accordion for power-user tools
- `settings-row-link` — full-width row + CaretRight
- `settings-toggle` — custom switch (not native checkbox)
- Save is **global** at bottom — edits across all sections, one `saveSettingsAsync()` call

### Known friction (from code review)

- **Inconsistent grouping:** Business uses nested accordions; other sections are flat cards — visual rhythm feels uneven
- **Operations overlaps FAB:** Inventory, expenses, packages reachable from FAB and settings
- **No search** — long scroll on small phone
- **Business booking actions** — stacked full-width buttons inside accordion (`.settings-booking-actions` column flex)
- **Advanced vs sections** — Advanced feels orphaned; migration tools mixed with everyday settings
- **Inline styles** still on logo preview, logout button color

### Reference CSS classes

`.settings-screen`, `.settings-header`, `.settings-section-head`, `.settings-card`, `.settings-card--grouped`, `.settings-accordion`, `.settings-field`, `.settings-row-link`, `.settings-toggle-row`, `.settings-booking-link`, `.settings-booking-actions`, `.settings-save-row`

### Screenshots to attach

- Full `/settings` scroll (top → bottom)
- Business card expanded (all 3 accordions)
- Advanced section open

---

# FOCUS AREA 2 — Booking link UI (centering / layout)

## Owner complaint

> “Create booking link isn't centered”

## Surfaces where booking link appears

### A) Settings — Online booking accordion

**File:** `Settings.tsx` lines ~279–301  
**Classes:** `.settings-booking-link`, `.settings-booking-actions`  
**Layout:** URL in plain text block; two stacked buttons — `btn-ghost` (Copy) and `btn-secondary` (Preview). Actions are `flex-direction: column`, `width: 100%`, `text-align: center` on buttons — but **link text is left-aligned** with `word-break: break-all`.

### B) Onboarding step 3 — “Your booking link”

**File:** `src/app/onboarding/page.tsx`  
**Classes:** `.onboarding-link-box`, `.onboarding-actions`  
**Layout:** Card with title “Your booking link”, link in `.onboarding-link-box`, then **two-button row** (Copy + Preview) in `.onboarding-actions` (column stack). Below that, a **second** `.onboarding-actions` block with Back / Go to dashboard / Skip.

**CSS:** `src/app/auth-flow.css` — `.onboarding-link-box` has padding but no `text-align: center`; buttons are full-width column.

### C) Public booking page (for context)

`/book/[slug]` — customer-facing; not the owner’s complaint but preview opens here.

## Clarify for council

Owner may mean:
- URL text not centered in its box
- Copy / Preview buttons not visually centered as a group
- FAB or onboarding CTA labeled “create booking link” misaligned
- Green FAB `+` not centered in bottom nav (see Area 4)

**Council should address all booking-link surfaces** and call out which alignment model to use (left-aligned URL + centered actions vs hero-style centered block).

### Screenshots to attach

- Settings → Business → Online booking accordion
- Onboarding step 3 (booking link step)
- If FAB misalignment suspected: bottom nav with `+` button

---

# FOCUS AREA 3 — Inventory layout (`/inventory`)

## Owner request

> “Analyze the inventory layout and how well it's implemented.”

## Architecture

| Piece | Location |
|-------|----------|
| Route | `src/app/inventory/page.tsx` → `InventoryPage.tsx` |
| Home view | `src/components/inventory/InventoryHome.tsx` |
| Category drill-down | `src/components/inventory/InventoryCategoryView.tsx` |
| Tiles / rows | `ProductTile.tsx`, `ProductGrid.tsx`, `InventoryRow.tsx` |
| Utils | `inventory-utils.ts` — `SECTION_CONFIG`, low-stock logic |
| Styles | `src/app/inventory/inventory.css` (~1,300 lines) |
| Legacy route | `src/components/Inventory.tsx` + `src/app/settings/inventory/page.tsx` — **older supplies-only UI** |

### Visual system

Inventory uses a **fourth parallel token set** (not operator `globals` nor `app-ui`):

```css
.inventory-section {
  --inv-bg-page: #0d0d0d;
  --inv-accent-green: #4ade80;  /* differs from operator --green #22c55e */
  --inv-radius-lg: 12px;
  max-width: 420px; /* 480px on tablet */
}
```

Syne display + DM Sans body; category grid; swipe rows; bottom sheets for edit (`SupplyEditSheet`, `EquipmentEditSheet`, etc.).

### Home screen structure (`InventoryHome`)

1. Header — Warehouse icon, title, item count, low-stock count  
2. **Needs attention** — low-stock supplies in `.inventory-card` rows  
3. **Categories** — 4-cell grid: Chemicals, Equipment, Supplies, Wish list  
4. **Products** — horizontal `ProductGrid` / `ProductTile` for catalog items  

### Category view (`InventoryCategoryView`)

- Back navigation  
- Section-specific lists with swipe-to-delete  
- FAB or header actions for add  
- Equipment status toggles, acquisition toggle components  

### Overlap / debt signals

| Issue | Detail |
|-------|--------|
| **Dual inventory UIs** | Full `InventoryPage` at `/inventory` vs simpler `Inventory.tsx` at `/settings/inventory` |
| **Token fragmentation** | `--inv-accent-green: #4ade80` vs app `--green: #22c55e` |
| **FAB duplicate** | QuickActionMenu has “Inventory” → `/inventory`; bottom nav does **not** include inventory tab |
| **Reachability** | Settings → Operations → Inventory; FAB → Inventory; home inventory alert card |
| **CSS weight** | 1,300-line dedicated stylesheet — sheet sub-language + swipe gestures |
| **Max width** | 420px inventory vs 390px operator shell |

### Screenshots to attach

- `/inventory` home (categories + products)
- One category drill-down (e.g. Chemicals)
- Low-stock “Needs attention” section if populated
- Compare: `/settings/inventory` if still routed

### Council should evaluate

- Is the category grid + product tiles IA clear for a solo detailer?
- Does “Needs attention” earn its place above categories?
- Should inventory converge on operator tokens or keep distinct `--inv-*` scope?
- Is the settings/inventory legacy route dead weight?

---

# FOCUS AREA 4 — Center FAB (`+`) and quick actions

## Owner request

> “Analyze the plus center button and if there are any redundancies.”

## Implementation

| Piece | Location |
|-------|----------|
| FAB button | `src/components/BottomNav.tsx` — `.bottom-nav-fab`, `.bottom-nav-fab-link` |
| Menu sheet | `src/components/QuickActionMenu.tsx` — `.quick-action-sheet` |
| State | `QuickActionContext` — `menuOpen`, expense/supply sheets |
| Styles | `globals.css` — `.bottom-nav-fab*`, `.quick-action-*` |

### Bottom nav layout

```
[ Home ] [ Jobs ]  ( + )  [ Clients ] [ Money ]
```

- FAB: green circle, `Plus` icon `#071407`, rotates/opens menu  
- Hidden on: auth, portal, book, onboarding, privacy, `/jobs/new`, `/settings/*`  
- **Not in nav:** messages, quotes, invoices, inventory

### QuickActionMenu — 6 actions (current)

| # | Label | Action | Overlap? |
|---|-------|--------|----------|
| 1 | New job | `router.push('/jobs/new')` | Primary FAB purpose; nav has Jobs tab |
| 2 | Log business expense | Opens `BusinessExpenseSheet` | Settings → Operations → Business expenses |
| 3 | Buy supplies | Opens `SupplyPurchaseSheet` | Related to inventory |
| 4 | New quote | `router.push('/quotes/new')` | No nav tab; no home icon |
| 5 | View messages | `router.push('/messages')` | Home header has ChatCircle → `/messages` **duplicate** |
| 6 | Inventory | `router.push('/inventory')` | Settings → Operations → Inventory **duplicate** |

### Other `+` entry points

- `JobsList.tsx` — green `.icon-btn` → `/jobs/new` (same as FAB action 1)
- `ClientsList.tsx` — green `.icon-btn` → `/clients/new`
- `QuotesList.tsx` — `btn-primary` “New quote”
- Dashboard — no FAB alternative for quotes/messages except header messages icon

### FAB CSS notes (`globals.css`)

```css
.bottom-nav-fab {
  position: relative;
  flex: 0 0 auto;
  /* FAB link: 56px circle, margin-top negative for float effect */
}
```

Council should verify visual centering of `+` between left/right tab pairs at 390px.

### Screenshots to attach

- Bottom nav with FAB closed and open (menu sheet)
- Home header (messages + settings icons) alongside FAB menu showing “View messages”
- Jobs list header `+` icon

### Council should answer

- Is 6 items too many for a thumb-zone sheet?
- Which 1–2 actions should be removed or moved to nav/settings?
- Should Messages be FAB-only or header-only?
- Should Inventory get a bottom nav tab instead of FAB row?
- Is “New job” redundant with Jobs list `+`?

---

# FOCUS AREA 5 — Money report export & customer invoices

## Owner request

> “Improve the CSV for the Money report section to make it look very nicely put together CSS wise. The invoices sent to the customer should also be improved CSS wise.”

---

## 5A — Money screen (`/reports`)

### UI component

**File:** `src/components/Reports.tsx`  
**Styles:** `app-ui.css` — `.money-screen`, `.money-hero`, `.money-export-row`, `.money-export-btn`

### Current export UX

Two side-by-side buttons at bottom:

| Button | Handler | Output |
|--------|---------|--------|
| Export PDF | `downloadReportPdf()` | `ReportPdfDocument.tsx` via `/api/pdf/report` |
| Export CSV | `exportJobsCSV(range)` | Raw `.csv` file download |

**CSV implementation:** `src/lib/api/aggregates.ts` → `computeJobsCSV()`:

```ts
headers = ['Date', 'Client', 'Package', 'Revenue', 'Tip', 'Expenses', 'Net Profit', 'Status']
// Plain comma-joined rows, no quoting, no styling, no summary section
```

There is **no in-app CSV preview** — only a file blob download. Owner said “CSS wise” which may mean:

1. Styled **export button row** on Money page  
2. An **on-screen financial table** before/instead of raw CSV  
3. **PDF report** visual polish (Helvetica, minimal layout)  
4. HTML export with embedded styles  

**PDF report today:** `src/components/pdf/ReportPdfDocument.tsx` — basic Helvetica, simple rows, green profit line `#1a7a3a`, no logo, no charts.

### Money screen layout (for context)

- Page header “Money” + period chips (`this_week`, `this_month`, `last_month`)
- `.money-hero` — net profit/loss large display
- `.stat-grid` — revenue, expenses, net profit, avg job value
- Context links — Invoices, Quotes (recent addition)
- Charts: `ReportRevenueByService`, `ReportExpenseBreakdown`, `ReportComparisonChart`
- Export row at bottom

### Screenshots to attach

- Full `/reports` scroll including export buttons
- Downloaded CSV opened in Excel/Numbers (plainness visible)
- PDF export sample if available

---

## 5B — Customer-facing invoices

Three delivery channels — **should look like one brand**:

### 1) PDF attachment (email / download)

| Piece | Location |
|-------|----------|
| Document | `src/components/pdf/InvoicePdfDocument.tsx` |
| Layout logic | `src/lib/invoice-layout.ts` — `INVOICE_ACCENT = '#22c55e'`, `buildInvoiceViewModel()` |
| API | `src/app/api/pdf/invoice/route.tsx` |
| Download | `src/lib/pdf/downloadInvoicePdf.ts` |

**PDF styling:** `@react-pdf/renderer`, Helvetica/Courier, light page `#ffffff`, table with `#f5f5f5` header, status chips, fixed footer “Thank you”.

### 2) Operator in-app preview (dark shell — not customer-facing but shapes PDF)

| Piece | Location |
|-------|----------|
| Preview page | `src/components/InvoicePreview.tsx` → `/jobs/[id]/invoice` |
| Body | `src/components/invoice/InvoiceDocumentBody.tsx` |
| CSS | `globals.css` — `.invoice-doc`, `.invoice-doc-card`, `.invoice-doc-table`, etc. |

**Issue:** Preview sits inside **dark operator** `.card.invoice-doc-card` with `background: var(--bg-surface-hover)` — invoice content styled for light document but hosted on dark UI.

### 3) Client portal

| Piece | Location |
|-------|----------|
| Card | `src/components/portal/PortalInvoiceCard.tsx` |
| CSS | `src/app/portal/portal.css` — `.portal-invoice-table`, `.portal-total-row`, `.portal-balance-panel` |
| Theme | `client-light` tokens via `.portal-root.client-light-root` |

Portal invoice uses HTML `<table>`, monospace invoice number, balance panel variants.

### Quote PDF (related)

`src/components/pdf/QuotePdfDocument.tsx` — should council recommend invoice/quote parity?

### Screenshots to attach

- `/jobs/[id]/invoice` preview on phone
- PDF opened on desktop
- Portal invoice card (`/portal/[token]` with invoice scope)

### Council should deliver

- A **unified invoice layout spec** (grid, typography, accent, logo placement, status badge, line items, totals, pay CTA)
- Whether `.invoice-doc-*` (web) and `InvoicePdfDocument` (PDF) should share more tokens
- Portal card vs PDF: converge or intentionally simplify portal?
- Professional reference level (Stripe invoice, Square, FreshBooks, etc.) — what to emulate at mobile-first scale

---

# APP CONTEXT (brief)

## Stack

- Next.js App Router, React client components  
- Phosphor icons, Syne + DM Sans fonts  
- Hand-written CSS (not Tailwind-heavy)  
- 390px operator shell; client-light for book/portal  

## Design systems (post prior council work)

| System | Scope |
|--------|-------|
| Operator dark | Home, jobs, clients, money, settings |
| Client light | `/book/*`, `/portal/*` (`client-light.css`) |
| Sheet sub-language | Bottom sheets, inventory editors (inverted save buttons) |
| Inventory scoped | `--inv-*` in `inventory.css` |

## Prior work already shipped (do not re-litigate unless broken)

- Green unified to `#22c55e` for operator/book/portal accent  
- Booking step 2 redesigned (native date + slot grid)  
- Dashboard messages icon; FAB quote + messages actions  
- Settings Business section split into accordions  
- `src/components/ui/` primitives extracted (Button, Card, etc.)

---

# FILES TO REFERENCE

```
src/components/Settings.tsx
src/app/settings/settings.css
src/app/onboarding/page.tsx
src/app/auth-flow.css
src/components/BottomNav.tsx
src/components/QuickActionMenu.tsx
src/providers/QuickActionContext.tsx
src/components/inventory/InventoryPage.tsx
src/components/inventory/InventoryHome.tsx
src/components/inventory/InventoryCategoryView.tsx
src/app/inventory/inventory.css
src/components/Reports.tsx
src/lib/api/aggregates.ts          # computeJobsCSV
src/components/pdf/ReportPdfDocument.tsx
src/components/pdf/InvoicePdfDocument.tsx
src/components/invoice/InvoiceDocumentBody.tsx
src/components/InvoicePreview.tsx
src/components/portal/PortalInvoiceCard.tsx
src/lib/invoice-layout.ts
src/app/globals.css                 # .invoice-doc-*, .bottom-nav-fab, .quick-action-*
src/app/app-ui.css                  # .money-export-*
```

---

# CONSTRAINTS

- **No operator light mode** — settings/inventory stay dark  
- **No new bottom nav tabs** unless council strongly justifies with redundancy proof  
- **Mobile-first** — solo detailer on iPhone in field  
- **Keep PocketBase/local dual backend** — no export features that assume cloud only  
- **Prefer extending existing CSS classes** over new design systems  
- **Do not propose multi-week roadmaps** — output is an ordered implementation checklist  

---

# OPTIONAL CONTEXT TO PASTE

If the council supports images, attach screenshots labeled:

1. `settings-full.png`  
2. `settings-booking-accordion.png`  
3. `onboarding-booking-link.png`  
4. `inventory-home.png`  
5. `inventory-category.png`  
6. `fab-menu-open.png`  
7. `money-reports-export.png`  
8. `invoice-preview-dark.png`  
9. `invoice-pdf.png`  
10. `portal-invoice.png`  

---

# PRIOR COUNCIL DOC

For full app inventory and design-system history, see `council-prompt-ui.md` and `council-verdict-ui.md` in the same repo. **This prompt supersedes those docs for the five focus areas above only.**
