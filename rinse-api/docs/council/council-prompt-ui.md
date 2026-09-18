# LLM Council Prompt — Full App UI & Design System

**Product:** `detailing-app` — multi-tenant SaaS CRM for solo mobile detailers  
**Copy everything below the `---` line** into your external LLM council. Attach screenshots of key surfaces if possible.

---

## Council instructions

Run Karpathy-style LLM Council: **5 advisors** (Contrarian, First Principles, Expansionist, Outsider, Executor) → **anonymous peer review** → **chairman synthesis**.

Advisors must reference **specific routes, class names, tokens, and layout patterns** from this brief — not generic SaaS UX advice.

**Chairman must deliver:**
1. **Unified design direction** — should the app converge on one system or keep three (operator dark / client light / sheet sub-language)?
2. **Top 5 cross-app improvements** (with effort: hours/days)
3. **Per-surface priorities** — what to polish vs leave vs redesign
4. **Stop list** — patterns to abandon, duplicate CSS to kill, orphan routes to wire or remove
5. **IA/navigation** — bottom nav, FAB, orphan routes (messages, quotes)
6. **One prototype to build first** — highest-leverage design experiment across the whole product

---

## Question

**Given the complete UI inventory below, how should we evolve the design of this entire application?**

Surfaces include: operator app (dark), client portal (light), public booking (light), auth/onboarding, settings, bottom sheets, and shared components.

What creates confusion? What is inconsistent? What should converge? What should stay intentionally different? How do we improve conversion (booking + portal) and operator speed (jobs/clients/home) without a full rewrite?

---

# PART 1 — PRODUCT & ARCHITECTURE

## Users & surfaces

| Audience | Routes | Theme | Purpose |
|----------|--------|-------|---------|
| **Detailer (operator)** | `/`, `/jobs/*`, `/clients/*`, `/reports`, `/inventory`, `/settings/*`, `/messages`, `/quotes/*`, `/invoices` | Dark | Daily CRM — schedule, clients, money, inventory |
| **Detailer's customer (portal)** | `/portal/[token]` | Light (+ dark photo mode) | View quotes, invoices, photos, book follow-ups |
| **Detailer's customer (booking)** | `/book/[slug]` | Light | Self-serve 3-step appointment booking |
| **New detailer** | `/auth`, `/onboarding` | Dark | Sign up, PIN, initial setup |
| **Anyone** | `/privacy`, `/offline` | Dark / inline | Legal, PWA offline |

## Tech stack (UI-relevant)

- **Framework:** Next.js App Router, React client components
- **Icons:** Phosphor (`@phosphor-icons/react`) — duotone/fill/regular weights
- **Fonts:** Syne (display/headings) + DM Sans (body) via `next/font` in root layout
- **CSS:** Tailwind imported but most UI is **hand-written CSS** in scoped files
- **Layout:** Single-column **390px** centered shell (430px for portal/auth-flow)
- **No light/dark toggle** for operator — `html.dark` always on except portal/book temporarily

## Root layout hierarchy

```
html.dark
└── AuthProvider
    └── AppShell (div.app-shell + modifiers)
        ├── {page content}
        ├── BottomNav (conditional)
        └── QuickActionOverlays (QuickActionMenu + expense/supply sheets)
```

### AppShell modifiers (`AppShell.tsx`)

| Class | Routes |
|-------|--------|
| `app-shell--portal` | `/portal/*` |
| `app-shell--book` | `/book/*` |
| `app-shell--settings` | `/settings/*`, `/privacy` |
| `app-shell--auth-flow` | `/auth`, `/onboarding`, `/auth/*` |

### Bottom nav visibility

**Hidden on:** `/auth`, `/auth/*`, `/onboarding`, `/privacy`, `/portal/*`, `/book/*`, `/jobs/new`, `/settings/*`

**Visible on:** home, jobs list/detail/edit/photos/invoice, clients, reports, inventory, messages, quotes, invoices, offline

---

# PART 2 — DESIGN SYSTEMS (THREE VISUAL LANGUAGES)

## System A — Operator dark (default)

**Scope:** Most of app  
**Entry CSS:** `globals.css` + `app-ui.css`  
**html:** `class="dark"`, `color-scheme: dark`, `themeColor: #0f0f0f`

### Core tokens (`globals.css :root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0f0f0f` | Page background |
| `--bg-surface` | `#1a1a1a` | Cards, inputs |
| `--bg-surface-hover` | `#202020` | Press states |
| `--bg-surface-active` | `#252525` | Active press |
| `--border` | `#2a2a2a` | 0.5px borders everywhere |
| `--border-strong` | `#3a3a3a` | Emphasis borders |
| `--text-primary` | `#ffffff` | Headings, values |
| `--text-secondary` / `--text-muted` | `#a3a3a3` | Subtitles, labels |
| `--text-dim` | `#8c8c8c` | Placeholders, inactive nav |
| `--green` | `#22c55e` | Primary CTA, FAB, active nav |
| `--green-text` | `#4ade80` | Positive money, highlights |
| `--green-dim` | `#1a2e1a` | Tinted backgrounds |
| `--amber` / `--amber-text` | `#f59e0b` / `#fbbf24` | Warnings, follow-ups |
| `--red` / `--red-text` | `#ef4444` / `#f87171` | Errors, delete |
| `--blue` / `--blue-text` | `#60a5fa` / `#93c5fd` | Info states |
| `--radius-sm/md/lg/xl` | 8 / 12 / 16 / 20px | |
| `--screen-padding` | `16px` | Horizontal page padding |
| `--tap-target-min` | `44px` | iOS HIG minimum touch |
| `--font-ui` | SF Pro / system | Default body |
| `--inv-sheet` | `#1c1c1c` | Bottom sheet surface |

### App-ui layer (`app-ui.css` — overlaps globals)

| Token | Value | Notes |
|-------|-------|-------|
| `--bg` | `#111111` | Bottom nav bg |
| `--bg-card` | `#1a1a1a` | List cards |
| `--bg-card-2` | `#1e1e1e` | Icon buttons, nested |
| `--bg-green-mid` | `#1a3a1a` | Active chips |
| `--text-hint` | `#3a3a3a` | Inactive nav icons |
| `--green` | `#4caf50` | Slightly different green in lists |

**Known issue:** Two green values (`#22c55e` globals vs `#4caf50` app-ui) — inconsistent accent.

### Shell layout

```css
.app-shell {
  max-width: 390px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg-base);
  padding-top: env(safe-area-inset-top);
}
.page-content { padding-bottom: calc(88px + env(safe-area-inset-bottom)); }
.screen { padding: 0 var(--screen-padding); }
```

---

## System B — Client light (portal + booking)

Two separate token sets — **similar but not identical.**

### Portal (`portal.css` — `.portal-root`)

| Token | Value |
|-------|-------|
| `--portal-bg` | `#fafafa` |
| `--portal-surface` | `#ffffff` |
| `--portal-border` | `#e5e5e5` |
| `--portal-text-primary` | `#111111` |
| `--portal-text-secondary` | `#737373` |
| `--portal-accent` | `#22c55e` |
| Max width | **430px** |
| Font | system-ui stack (not Syne/DM Sans) |

**Photo mode:** `.portal-root--photos` → dark `#111` bg, light text — for before/after galleries  
**Theme hook:** `usePortalTheme()` strips `html.dark` while portal mounted

**Layout:**
```
.portal-root (flex column, min-height 100dvh)
├── .portal-header (sticky, white, border-bottom)
├── .portal-body (padding 16px, gap 12px)
└── .portal-footer (legal, border-top)
```

**Cards:** `.portal-card` — 14px radius, white, border  
**Components:** `PortalGreetingCard`, `PortalServiceCard`, `PortalInvoiceCard`, `PortalQuoteCard`, `PortalQuoteCTA`, `PortalPhotoGrid`

### Public booking (`book.css` — `.book-root`)

| Token | Value |
|-------|-------|
| `--book-bg` | `#f7f7f5` (warmer than portal) |
| `--book-surface` | `#ffffff` |
| `--book-raised` | `#f3f3f0` |
| `--book-green` | `#16a34a` (darker than portal `#22c55e`) |
| Max width | **390px** (via app-shell) |
| Fonts | **Syne** h1 + CTAs, **DM Sans** body |

**Layout:**
```
.book-root (flex column)
├── .book-header (padding 20px + safe-area)
├── .book-body (padding 0 20px 24px, gap 16px)
└── .book-footer (privacy link, 12px hint)
```

**Council question:** Should portal and booking converge on one light design system?

---

## System C — Sheet sub-language (iOS-adjacent dark)

**Component:** `BottomSheet.tsx` — portal to `document.body`, drag-to-dismiss (100px threshold), z-index 200

| Class | Style |
|-------|-------|
| `.inv-sheet` | `#1c1c1e` bg, max-height 88vh, top radius 20px |
| `.inv-sheet-overlay` | `rgba(0,0,0,0.55)` |
| `.inv-sheet-handle` | 36×4px, `rgba(255,255,255,0.2)` |
| `.inv-sheet-title` | 18px `#f2f2f7` |
| `.inv-sheet-subtitle` | 13px `#8e8e93` |
| `.inv-field-input` | 44px height, `#2c2c2e` bg |
| `.inv-sheet-save` | **Inverted** — light `#f2f2f7` button on dark sheet |
| `.inv-sheet-cancel` | Ghost outline |
| `.inv-sheet-delete` | Red destructive |

**Structure (always):**
```
.inv-sheet-root
├── .inv-sheet-overlay
└── .inv-sheet
    ├── handle + header (title, subtitle, X close)
    ├── .inv-sheet-body (children — padded automatically)
    └── .inv-sheet-footer (optional)
```

**BottomSheet consumers (7):** `SupplyEditSheet`, `EquipmentEditSheet`, `InventoryEditSheet`, `BusinessExpenseSheet`, `SupplyPurchaseSheet`, `JobExpensesSheet`, `JobSuppliesConfirmSheet`

**Alternate sheets (NOT BottomSheet):**
- `QuickActionMenu` — `.quick-action-*` (z 150)
- `AddDamageSheet` / `AddJobPhotoSheet` — `.damage-sheet-*`
- `RowContextMenu` — `.row-context-*` (z 250, long-press)

---

# PART 3 — GLOBAL SHARED COMPONENTS

## Bottom navigation

**Grid:** `1fr 1fr 72px 1fr 1fr` — center column is FAB

| Tab | Route | Icon | Label |
|-----|-------|------|-------|
| Home | `/` | SquaresFour | Home |
| Jobs | `/jobs` | Briefcase | Jobs |
| **FAB** | opens menu | Plus 24px | — |
| Clients | `/clients` | Users | Clients |
| Money | `/reports` | ChartBar | Money |

**FAB:** 52×52px, `--green` bg, `#071407` icon, `margin-top: -22px`, shadow; rotates 45° when menu open

**Active tab:** green icon + label; inactive: `#3a3a3a` hint color, 9–10px uppercase labels

## Quick Action Menu (FAB sheet)

| Action | Destination |
|--------|-------------|
| New job | `/jobs/new` |
| Log business expense | `BusinessExpenseSheet` |
| Buy supplies | `SupplyPurchaseSheet` |
| Inventory | `/inventory` |

Classes: `.quick-action-root`, `.quick-action-backdrop`, `.quick-action-sheet` (slide-up, `--inv-sheet` bg)

## Buttons (`globals.css`)

| Class | Style |
|-------|-------|
| `.btn-primary` | Full-width, `--green` bg, `#071407` text, 16px padding, `--radius-lg` |
| `.btn-ghost` | `--bg-surface`, border, secondary actions |
| `.btn-danger` | Transparent, red text, red border tint |
| `.btn-secondary` | auth-flow/settings variant |

## Inputs (`globals.css`)

| Class | Style |
|-------|-------|
| `.input` | `--bg-surface`, `--border`, `--radius-md`, 12px 14px padding, green focus border |
| `.toggle-group` | 2-col pill; `.toggle-option.active` → green |

## Cards (`globals.css`)

| Class | Style |
|-------|-------|
| `.card` | surface bg, 0.5px border, `--radius-lg`, 14px padding |
| `.card-pressable` | + active scale 0.99 |
| `.kpi-card` | mono values |

## Typography patterns

| Context | Pattern |
|---------|---------|
| App-ui page titles | `.page-header h1` — 24–26px, weight 600, white, -0.3px tracking |
| Section labels | `.section-title` — 10px uppercase, muted (globals) |
| QuickAddJob / book labels | 10px uppercase, 0.1em tracking, `#555` or muted |
| Settings section | `.settings-section-head` + `.section-title` |
| Money hero | `.money-hero` — 28px profit/loss number |

## BackButton

`CaretLeft` 22px, `var(--text-muted)`, no background — inline only, used inconsistently across detail pages

## Badges

`.badge`, `.badge-status--*`, `.badge-paid/pending/overdue/scheduled/draft`  
App-ui: `.badge.green/amber/blue/purple/gray`

## List patterns (`app-ui.css`)

| Pattern | Classes |
|---------|---------|
| Search | `.search` — 40px height |
| Filter chips | `.chip` / `.chip.active` — green mid when active |
| Job row | `.job-card`, `.job-icon.{green\|amber\|blue\|gray}` |
| Client row | `.client-card`, `.avatar.{green\|blue\|amber\|gray}` |
| Follow-up banner | `.followup-card` — amber tint |
| Empty state | `.empty-state`, `.empty-cta` |
| Expand list | `.more-pill` |
| Swipe delete | `SwipeableRow` — 72px red strip |

---

# PART 4 — SURFACE-BY-SURFACE INVENTORY

## 4.1 Home `/`

**Component:** `Dashboard` (`.screen.page-content.body`)  
**CSS:** `app-ui.css` (+ unused `home/home.css` for alternate `HomeScreen`)

```
┌─────────────────────────────────┐
│ Good morning, {name}    [⚙️]    │  .page-header h1.lg 26px
│ {weekday, month day}            │  subtitle 13px muted
├─────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐       │  .stat-grid — week jobs + earned
│ │ Jobs: 3  │ │ $1,240   │       │
│ └──────────┘ └──────────┘       │
├─────────────────────────────────┤
│ [Inventory alert card]          │  optional amber/danger
├─────────────────────────────────┤
│ Mon Tue Wed Thu Fri Sat Sun     │  .week-strip, .day.today highlighted
├─────────────────────────────────┤
│ Today's jobs                    │  .job-card.job-card--home
│ ┌─────────────────────────────┐ │
│ │ 9:00 AM · Full Detail       │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Coming up                       │  .upcoming-card × 3
└─────────────────────────────────┘
│ [Bottom Nav + FAB]              │
```

**Settings access:** icon-btn top-right → `/settings`  
**No link to:** messages, quotes, invoices from dashboard

---

## 4.2 Jobs

### `/jobs` — JobsList

- Header: "Jobs" + green `.icon-btn` add → `/jobs/new`
- `.search` + `.chips` (All / Scheduled / In progress)
- Grouped list by period (`.sec` labels), `.job-card` rows, `.more-pill` expand

### `/jobs/new` — QuickAddJob (**nav hidden**)

Full-viewport column layout — **reference UI for many booking patterns**

```
.new-job (100dvh flex column, --bg-base)
├── .new-job-header (back, title, date)
├── .new-job-body (scroll, gap 20px, padding-bottom 100px)
│   ├── Client search + dropdown
│   ├── Date & Time — .new-job-datetime-grid (2-col, INVISIBLE overlay inputs)
│   ├── Package — .new-job-package-card + CheckCircle
│   ├── Vehicle — .new-job-vehicle-grid (3-col icons)
│   ├── Location — .new-job-location-toggle (Mobile/Fixed)
│   ├── Revenue & tip — .new-job-money-grid
│   └── Notes
└── .new-job-footer (fixed bottom, Save + Expenses btn)
```

**QuickAddJob tokens:** surfaces `#1e1e1e`, borders `#2a2a2a`, selected green tint `#1a3a2a`, price `#3dc97a`  
**Sheets:** `JobExpensesSheet`, `JobSuppliesConfirmSheet`

### `/jobs/[id]` — JobDetail

- BackButton + title + status `.badge`
- `.card` grids: package, vehicle, location, revenue/profit KPIs
- Actions: `.btn-primary`, `.btn-ghost`, share portal link
- Links: edit, photos, invoice, add to calendar

### `/jobs/[id]/edit` — JobEdit

Forms: `.input`, `.toggle-group`, package grid, supplies, `JobSuppliesConfirmSheet`

### `/jobs/[id]/photos` — PhotoGallery

**CSS:** `job-photos.css` — `.job-photos`, `--jp-*` tokens  
**Sheet:** `AddJobPhotoSheet` (damage-sheet pattern)  
**Lightbox:** `.job-photos-lightbox__*`

### `/jobs/[id]/invoice` — InvoicePreview

`InvoiceDocumentBody` + `.invoice-doc-*` classes, status badges, white logo tile for dark logos

---

## 4.3 Clients `/clients/*`

### `/clients` — ClientsList

- `.clients-screen` wrapper
- Header + green add
- `.search` + chips (All / Follow up / Top / New)
- `ClientCard` → `.client-card`, colored `.avatar`, `.badge`, overflow menu

### `/clients/[id]` — ClientDetail

- Contact grid: Call / Text / Email as `.btn-ghost` tiles
- Stats `.card`, job history `.card-pressable`, vehicles list

### Vehicle flows

- `VehicleForm` — color swatch picker, `VehicleTypePicker` / icons
- `VehicleProfile` — `.vehicle-hero`, `DamageSection`, `AddDamageSheet`
- Damage: `damage.css` — `.damage-card`, severity badges

---

## 4.4 Money `/reports`

**Component:** `Reports`  
**Label in nav:** "Money" (not "Reports")

```
.page-header "Money"
.chips (this week / month / last month)
.money-hero.money-hero--profit|--loss  ← 28px net number, green or red
.stat-grid × 4 KPIs
ReportRevenueByService
ReportExpenseBreakdown
ReportComparisonChart
.money-export-btn (PDF + CSV)
```

---

## 4.5 Quotes & Invoices (orphan routes — no nav tab)

### `/quotes`, `/quotes/new`, `/quotes/[id]`

`QuotesList`, `QuoteForm`, `QuoteDetail` — inline 22px headers, `.card-pressable` rows, PDF/send, `ShareLinkActions`

### `/invoices`

`InvoicesList` → row click goes to `/jobs/[id]/invoice`  
Reachable from Settings → Operations

---

## 4.6 Inventory `/inventory`

**CSS:** `inventory/inventory.css` — own `--inv-*` scope (`#0d0d0d` page, `#4ade80` accent)

```
.inventory-section
├── InventoryHome (category tiles)
└── InventoryCategoryView (grid or list)
    ├── ProductTile / ProductGrid
    ├── InventoryRow + SwipeableRow
    ├── AcquisitionToggle, EquipmentStatusToggle
    └── Sheets: SupplyEdit, EquipmentEdit, InventoryEdit, BusinessExpense, SupplyPurchase
```

**Nav:** FAB quick action also links here  
**Settings `/settings/inventory`:** redirect to `/inventory`

---

## 4.7 Messages `/messages` (orphan — no dashboard link)

**CSS:** `messages/messages.css` — `--msg-*` tokens

```
.messages-screen
├── BackButton → /
├── .messages-tabs (All | Auto) — active: green bg #4ade80, text #071407
├── AllMessagesTab / AutoMessagesTab
└── MessageDetailView (full-screen swap)
```

Planned `.home-header__messages` icon exists in CSS but **not wired** on Dashboard

---

## 4.8 Settings `/settings/*` (**nav hidden**)

**CSS:** `settings/settings.css`

```
.settings-screen
├── .settings-header + BackButton + 22px title
├── Sections with .settings-section-head + .section-title + .settings-section-desc
└── .card.settings-card rows
```

**Key sections:**
- Business info fields
- **Booking link card** (`.settings-booking-card`) — copy URL, preview link
- Invoicing toggles
- Notifications
- Operations → packages, overhead, expenses, invoices
- Data & security → change PIN
- Account
- Advanced `<details>` — sync/migration

**Sub-routes:** packages, overhead, business-expenses, change-pin (PIN pad reuses auth-flow)

---

## 4.9 Auth `/auth` + Onboarding `/onboarding` (**nav hidden**)

**CSS:** `auth-flow.css`, shell `app-shell--auth-flow` (430px max)

### Auth flow
```
.auth-screen (centered, min-height 100dvh)
├── Logo
├── .auth-screen__title (Syne 22px)
├── AccountAuth — .auth-form, .auth-input
└── PinAuth — .pin-dots, .pin-pad .pin-key 64px, green filled dots
```

### Onboarding (3 steps)
```
.onboarding-screen
├── .onboarding-progress__dot
├── Step 1: phone
├── Step 2: packages list
├── Step 3: booking link — .onboarding-link-box
└── .btn-primary / .btn-secondary / .btn-ghost
```

---

## 4.10 Client portal `/portal/[token]` (**nav hidden**)

**Max width 430px**, light theme, strips `html.dark`

```
.portal-root
├── PortalHeader (sticky)
├── PortalGreetingCard — client name, detailer name
├── PortalServiceCard — upcoming job
├── PortalInvoiceCard / PortalQuoteCard
├── PortalQuoteCTA — accept/decline
├── PortalPhotoGrid — tap → .portal-root--photos dark mode
└── portal-footer
```

**Accent:** `#22c55e` — matches operator green, not booking `#16a34a`

---

## 4.11 Public booking `/book/[slug]` (**nav hidden**)

**3-step wizard** — detailed spec below (consumer light theme)

### Header (all steps, outside white card)
```
BOOK ONLINE          ← .book-eyebrow 11px uppercase green
{Business Name}      ← Syne h1 clamp(26-32px)
📞 {phone}           ← optional
Step N of 3 — {label}
████████░░░░░░░░░░░  ← .book-progress 3px dots
```

### Step 1 — Choose service (`.book-step-card` white, 20px padding)
- `.book-package-list` — vertical, 8px gap
- `.book-package-card` — flex row, raised `#f3f3f0` bg, 14px padding
  - Left: name 14px/600, desc 11px muted
  - Right: price 15px/700 green, CheckCircle 18px or Circle 18px
- Selected: `--book-green-bg` tint, green border
- Actions: `Continue →` only, right-aligned `.book-btn-primary`

### Step 2 — Date & time
```
DATE                                    ← 10px uppercase label
┌──────────────┐ ┌──────────────┐
│📅 [date inp] │ │🕐 Pick a time │       ← RIGHT BOX IS STATIC (not clickable)
└──────────────┘ └──────────────┘
AVAILABLE TIMES
┌─────────┐ ┌─────────┐                 ← .book-slots-grid 2-col
│ 8:00 AM │ │10:00 AM │                 ← .book-slot / .active / .taken
└─────────┘ └─────────┘
Full Detail · $320                      ← .book-summary (not sticky)
[ Back ]              [ Continue → ]
```

**Date field:** `BookDateField` — label wrapper, CalendarBlank 18px absolute left, native `type=date` full width, min today max +60 days

**Known UX bug:** Clock box mirrors date box styling but only displays selection — actual time pick is slot grid below

### Step 3 — Your details
- Summary row: static date + time boxes (formatted)
- CONTACT: 4 icon-prefixed inputs (User, Phone, EnvelopeSimple, MapPin) — 15px, 12px radius, green focus
- VEHICLE TYPE: 3-col `.book-vehicle-btn` grid (5 types, no boat), 22px icons
- LOCATION: `.book-location-toggle` — "Mobile" (MapPin) / "Fixed" (House); selected = solid green fill white text
- NOTES: textarea with NotePencil icon, placeholder "Gate code, parking, pet hair…"
- Submit: `Confirm booking →` — requires name + phone only

### Confirmation
- Header: CONFIRMED / You're booked
- `.book-success-banner` — CheckCircle 32px, green tint, formatted date/time

### Not found
- Eyebrow + h1 + lead, empty body

### Booking tokens summary
| Token | Value |
|-------|-------|
| `--book-bg` | `#f7f7f5` |
| `--book-green` | `#16a34a` |
| `--book-raised` | `#f3f3f0` |
| Card radius | 16px step card, 12px controls |
| Bottom | Privacy policy link 12px |

---

## 4.12 Privacy `/privacy` + Offline `/offline`

**Privacy:** `.legal-page` — dark theme, back to settings, `.card.legal-page__body`  
**Offline:** inline styles only, `#0f0f0f`, WifiSlash icon — **bottom nav still visible**

---

# PART 5 — CROSS-APP INCONSISTENCIES & TECH DEBT

| Issue | Detail |
|-------|--------|
| **Three greens** | Operator `#22c55e`, app-ui `#4caf50`, booking `#16a34a`, portal `#22c55e` |
| **Two light themes** | Portal `#fafafa` vs booking `#f7f7f5` — different fonts, radii, accent |
| **Duplicate CSS** | globals `.clients-*` vs app-ui `.client-card`; `home.css` unused with `HomeScreen` |
| **Alternate components** | `HomeScreen` built but `Dashboard` shipped; `JobsRevenueChart` CSS exists, not mounted |
| **Orphan routes** | `/messages`, `/quotes/*` — no bottom nav or home entry |
| **Back navigation** | Mix of `BackButton`, inline CaretLeft, `router.back()` |
| **Operator datetime** | QuickAddJob uses invisible overlay inputs (works in dark app); booking overlay failed |
| **Sheet save button** | Inverted light-on-dark — unique sub-language vs `.btn-primary` green |
| **Typography** | Dashboard page-header uses system UI; book uses Syne; portal uses system only |
| **Max widths** | 390px operator/book vs 430px portal/auth |
| **No per-org branding** | Booking/portal show name + phone only — no logo, accent color, hero image |
| **Loading states** | Mostly text "Loading…" — few skeletons |
| **Offline page** | Shows operator bottom nav on a dead-end page |

---

# PART 6 — INFORMATION ARCHITECTURE MAP

```
                    ┌─────────────┐
                    │  FAB (+)    │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      /jobs/new      BusinessExpense   SupplyPurchase
           │               │               │
           ▼               └───────┬───────┘
      QuickAddJob                  ▼
                            /inventory
                            
Bottom Nav:
  Home ── Settings (icon only)
  Jobs ── /jobs/new (via FAB, not tab)
  Clients
  Money (/reports)

Hidden from nav:
  /messages, /quotes, /invoices
  /settings/*, /auth, /onboarding
  /portal/[token], /book/[slug]

Customer-facing:
  /book/[slug]  ← detailer shares
  /portal/[token] ← detailer shares per job/client
```

---

# PART 7 — WHAT WE WANT FROM THE COUNCIL

1. **Unification strategy** — one design system vs intentional multi-system; which tokens to merge
2. **Navigation IA** — wire orphans, add tabs, or kill routes; FAB menu completeness
3. **Operator app polish priority** — home vs jobs vs clients vs money vs inventory
4. **Customer surface strategy** — align portal + booking; trust/branding without backend scope creep
5. **Component library** — extract shared patterns (datetime, package cards, vehicle grid) or keep separate
6. **Sheet language** — keep iOS inverted save or align with `.btn-primary`
7. **Specific redesigns** — booking step 2 clock box, QuickAddJob footer, settings density, reports hero
8. **Accessibility & mobile** — tap targets, focus, iOS Safari date/time across surfaces
9. **Stop list** — what to delete (unused CSS, HomeScreen, duplicate tokens)
10. **90-day design roadmap** — phased, with **one prototype to validate direction first**

Reference **class names, hex values, and route paths** when recommending changes so a solo developer can implement.

---

## Suggested screenshots to attach

1. Home dashboard
2. Jobs list + QuickAddJob
3. Client detail
4. Money/reports
5. Inventory grid
6. Settings (booking link card)
7. Auth PIN + onboarding
8. Portal home + photos mode
9. Booking steps 1–3 + confirmation
10. BottomSheet example (expense or supply)
11. Quick action FAB menu open

---

*End of prompt — detailing-app full UI council brief*
