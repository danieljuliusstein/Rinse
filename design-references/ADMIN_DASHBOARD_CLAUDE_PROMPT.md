# Claude design prompt — Rinse platform admin dashboard

Copy everything below **PROMPT START** into Claude (Sonnet/Opus). Attach the PNGs listed in the table. Goal: **high-fidelity visual mockups** + **engineer handoff spec** — not production code.

**Where captures live:** `design-references/rinse-site-captures/`

| File | What it shows | Use in admin design |
|------|---------------|---------------------|
| `01-demo-home.png` | Operator home — KPI cards, green hero, uppercase labels | KPI card rhythm, Syne headlines, `#22c55e` accent |
| `02-demo-jobs.png` | Jobs list — grouped sections, card rows | Row density reference for org table (lighter than this) |
| `03-demo-invoice.png` | Invoice detail | Status/badge tone reference |
| `04-demo-booking.png` | Client booking calendar | Booking link preview in org detail |
| `08-welcome.png` | Light welcome split | Optional light-mode admin variant reference |

**Optional context (describe in prompt if not attaching):**
- Current bare admin UI: `src/app/admin/page.tsx` — HTML table, no shell
- North star apps: Linear, Stripe Dashboard, Vercel team settings — internal console feel

---

## PROMPT START

You are a senior product designer. Design the **Rinse Platform Admin Dashboard** — an internal console for **Rinse HQ** (founders/support) to manage all detailing-business tenants. This is **not** the detailer operator app and **not** PocketBase's database admin (`/_/`).

### Product context

**Rinse** is mobile-first SaaS for solo **mobile auto detailers**: booking link, jobs, clients, invoices, Stripe Connect payments, portal share links.

| User | Routes | Device |
|------|--------|--------|
| **Detailer (tenant)** | `/`, `/jobs`, `/settings` | Phone-first, bottom nav, ~390px column |
| **Platform admin (Rinse HQ)** | `/admin` | **Desktop-first** (1280px+), laptop/iPad secondary |

Platform admins manage **organizations** (tenants): subscriptions, trials, booking toggles, backups, future support actions. Access gated by allowlisted emails + auth — non-admins see 403.

### What exists today (ugly but functional)

Bare table at `/admin`:
- Summary: `{total} orgs · {active} active · {trialing} trialing`
- Columns: Business (name + `/slug`), Plan, Status, Trial end, Booking on/off
- One action per row: "Toggle booking"

**Backend already built (design UI around this — do not invent new APIs):**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/orgs` | All orgs + summary counts |
| `PATCH /api/admin/orgs/[id]` | `booking_enabled`, `plan`, `trial_ends_at`, `subscription_status` |
| `GET /api/admin/backups/trigger` | Collection counts (pre-flight) |
| `POST /api/admin/backups/trigger` | Download full cross-tenant JSON backup |

**Org data fields:** `name`, `slug`, `plan` (founding \| starter \| pro), `subscription_status` (trialing \| active \| past_due \| canceled \| none), `trial_ends_at`, `current_period_end`, `founding_member`, `booking_enabled`, `created`.

**Audit events (design visibility; logs live in Vercel today):** `admin_backup_triggered`, `auth_failure`, `webhook_reject`.

---

### Brand & design system (non-negotiable)

| Rule | Value |
|------|--------|
| Accent | **`#22c55e`** Rinse green only — never Invoice Fly blue, never `#16a34a` / `#4caf50` |
| Display font | **Syne** — page titles, KPI numbers |
| UI font | **DM Sans** — tables, labels, buttons |
| Operator app bg | `#f4f4f5` light gray — admin may use slightly cooler `#f2f2f7` or dark sidebar variant |
| Cards | White, ~16–20px radius, subtle border or shadow (match attached home capture) |
| Section labels | Uppercase, ~11px, muted gray (see `01-demo-home.png` "REVENUE MTD") |
| Icons | Phosphor duotone style — building, users, shield, database, download |
| Platform | Web app — design **desktop frames** primary; show one **768px tablet** collapse |

**Do NOT:** Copy Stripe/Linear pixel-perfect, use Bootstrap/MUI aesthetic, show operator bottom nav on admin, mix client booking (`--cl-*`) styling.

---

### Visual direction — admin lane

Create a distinct **internal console** that feels related to Rinse but clearly "HQ tool":

- **Tone:** Calm, trustworthy, support desk — not marketing, not consumer app
- **Density:** Higher than operator home — tables, filters, chips OK
- **Layout:** Propose **two options** in wireframes first:
  - **A:** Fixed left sidebar (Overview, Organizations, Backups, System, Audit) + main canvas
  - **B:** Top nav tabs + full-width content
- Pick one in your final mocks and explain why

**Status badge colors (spec hex + usage):**
- `active` → green
- `trialing` → blue/info
- `past_due` → amber
- `canceled` / `none` → gray/red muted
- `founding` → special pill (gold or green outline)

---

### Screens to mock (deliver all as separate frames)

Export as **PNG mockups**, desktop **1440×900** (or 1280×800) with realistic sample data (~8–12 fake orgs).

#### Frame 1 — Overview
- Left sidebar or top nav (your chosen layout)
- **5 KPI cards:** Total orgs, Active, Trialing, Past due, Founding members
- **Quick actions row:** "Download full backup", "Open PocketBase admin" (external), "View docs"
- **Mini chart or sparkline placeholder:** "Signups last 30 days" (static fake data — label "Coming soon")
- Sample numbers: 47 orgs, 31 active, 9 trialing, 3 past due, 4 founding

#### Frame 2 — Organizations list (default landing alternative)
- Search bar + filters: Status, Plan, Booking on/off
- **Data table** with columns: Business, Plan, Status, Trial ends, Booking, Created, Actions (⋯ menu)
- Sample rows: "Summit Detail /summit-detail", "Atlas Mobile /atlas-detailing", etc.
- Row hover state; founding member star or badge on one row
- Pagination or "Showing 12 of 47"

#### Frame 3 — Organization detail (slide-over OR full page — show one)
- Header: **Summit Detail**, `/summit-detail`, created Jan 2026
- **Booking link chip:** `rinsehq.com/book/summit-detail` with copy icon
- **Subscription card:** Plan Pro, Status Active, trial/period dates, Stripe IDs truncated (`cus_…`, `sub_…`)
- **Support actions:** Extend trial (date), Set plan dropdown, Toggle booking, Force status (with warning)
- **Activity section:** Empty state — "No recent activity API yet"
- **Danger zone:** muted red border — Disable booking, Cancel subscription (confirm copy only)

#### Frame 4 — Backup & disaster recovery
- Explain: "Full export of all tenants — for DR only"
- **Pre-flight panel:** Collection counts (clients 842, jobs 3,201, invoices 1,890…) from GET metadata
- Primary button: **Download full backup** (green)
- Secondary: CLI hint (collapsed code snippet — `curl` with secret — gray monospace, not prominent)
- States to show as **inset variants** or annotation callouts: loading spinner, success toast, error banner

#### Frame 5 — System health
- Status cards: PocketBase ● Online, Stripe webhooks ● Configured, Upstash ● Not configured (amber)
- Links to `docs/PRODUCTION.md` security waves (CSP soak, audit log)
- No fake green checkmarks for things we can't verify client-side — use "Configure in Vercel" helper text

#### Frame 6 — Audit log (v1 stub)
- Empty table with columns: Time, Event, Actor, Detail
- Helper: "Events stream to Vercel Functions — search `admin_backup_triggered`"
- One **sample row** grayed out as preview: `2026-07-05 · admin_backup_triggered · you@rinsehq.com · scope: all`

#### Frame 7 — Mobile / tablet (768px)
- Same Overview or Org list collapsed: hamburger sidebar, stacked KPI cards, horizontal scroll table OR card list fallback

---

### Sample data (use consistently)

| Business | Slug | Plan | Status | Trial end | Booking |
|----------|------|------|--------|-----------|---------|
| Summit Detail | summit-detail | pro | active | — | On |
| Atlas Mobile Detailing | atlas-detailing | starter | trialing | Aug 12 | On |
| Bay Shine Co | bay-shine | starter | past_due | — | Off |
| Founding: Danny's Rinse Demo | danny-demo | founding | active | — | On |

---

### What to deliver (output format)

Return **four sections** in one response:

1. **Layout decision** — A vs B wireframes (ASCII ok), chosen direction, 2–3 sentences rationale

2. **Visual mockups** — Frames 1–7 as generated images (or extremely detailed frame-by-frame specs if image gen unavailable)

3. **Design token handoff table**

   | Token | Value | Usage |
   |-------|-------|-------|
   | `--admin-sidebar-bg` | … | … |
   | `--admin-kpi-label` | … | … |
   | Badge colors per status | hex | … |

4. **Engineer implementation checklist** — Map each UI block to existing Rinse components where possible:
   - `Button`, `Badge`, `Card`, `ListRow`, `SectionGroup`, `EmptyState`
   - New CSS owner: `admin.css` scoped under `.admin-root`
   - Routes: `/admin`, optional `/admin/orgs/[id]`
   - API wiring notes (which button calls which endpoint)
   - **Do not write React code** unless I ask — spec only

---

### Motion & polish notes (spec only)

- KPI cards: subtle `list-stagger` on load (60ms) — archetype from our motion spec
- Row actions menu: `sheet-enter` or dropdown fade 200ms
- Backup download: button → loading → success pop
- `@media (prefers-reduced-motion: reduce)`: disable stagger

---

### Out of scope

- PocketBase admin UI redesign
- "Login as customer" impersonation
- Editing tenant jobs/invoices from admin
- Building real audit log API
- Operator app bottom nav or home dashboard changes

---

### Constraints

- Static mockups + handoff — **no production code** in this pass
- Must feel like Rinse (green, Syne, card rhythm from attached captures) but **desktop internal tool**
- Accessible: table headers, 4.5:1 contrast on badges, focus rings on interactive elements

If you cannot generate images, produce **Figma-style frame descriptions** detailed enough to rebuild in one session — every spacing value, font size, and hex color.

## PROMPT END

---

## After Claude delivers

1. Save mockups to `design-references/admin-dashboard/` (create folder)
2. Paste handoff checklist into a GitHub issue or `SETUP_UX_PLAN.md` appendix
3. Open Cursor with `ADMIN_DASHBOARD_CURSOR_HANDOFF.md` (optional) to implement from mocks
4. Verify live stub at `/admin` against mocks before shipping
