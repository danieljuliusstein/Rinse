# UI Mockup Design Brief — Detailing App (Atlas)

Use this prompt with Claude (or any design tool) to produce **interactive or static mockups** before implementation. Mockups must feel like a natural extension of the **existing** app — not a redesign.

---

## Copy everything below this line into Claude

---

You are designing UI mockups for **Atlas Detailing**, a mobile-first Next.js PWA for a solo car detailing operator. The app is dark-themed, operator-focused, and already in production. Your job is to design **new screens and enhancements** that match the current layout system exactly.

---

## ⚠️ PRIORITY FOCUS — design these three areas first and in greatest detail

Claude: spend the **majority of your effort** on fully visualized mockups (multiple states each) for:

1. **Damage photos** (CRM → Vehicles → vehicle detail) — including add flow, library vs camera sheet, and populated list
2. **Before/after job photos** (redesigned `/jobs/[id]/photos`) — full page, lightbox, add flow, share bar, job detail entry row
3. **Pipeline “Send quote” + Auto messages channel UX** — quoted-stage CTA flow and message template cards with channel selector

Other features in this brief are lower priority unless time remains.

**Deliverables for priority screens:** minimum **2–3 frames per flow state** (empty, populated, mid-interaction). Include ASCII or visual mockups at **390×844**.

**Deliverables (all screens):**
1. A visual mockup (mobile viewport **390×844**, primary target)
2. Brief interaction notes (tap targets, sheet vs full page, empty states)
3. Component-level labels matching the class naming style provided

Do **not** invent a new brand, color palette, or navigation paradigm. Extend what exists.

---

## App shell (already built — do not redesign)

### Navigation
- **Bottom bar:** Home · Jobs · **center FAB (+)** · Clients · Reports
- **FAB opens a bottom sheet** titled “Quick actions” with rows: icon (green duotone) + label + subtitle
- Settings is **not** in the bottom nav — only a **gear icon** on the home header (top right today)
- Inventory is reachable via FAB → “Inventory”

### Layout constraints
- Content column: **max-width 420px** (480px on tablet), centered
- Page padding: **16px** horizontal
- Safe area above bottom nav (~80px padding-bottom on scrollable pages)

### Typography
- **Display / headings:** Syne, 600 weight
- **Body / UI:** DM Sans
- Section labels: 11px, uppercase, letter-spacing 0.06em, muted gray

### Color tokens (use these exact values)
| Token | Hex | Usage |
|-------|-----|--------|
| Page background | `#0d0d0d` | Screen bg |
| Surface | `#161616` | Cards |
| Surface raised | `#1e1e1e` | Hero cards |
| Border subtle | `rgba(255,255,255,0.08)` | Card borders |
| Text primary | `#f5f5f4` | Headings, names |
| Text secondary | `#9b9b96` | Subtitles, labels |
| Text tertiary | `#6b6b67` | Hints |
| Accent green | `#4ade80` | Active nav, CTAs, icons |
| Warning | `#fbbf24` | Low stock, follow-up |
| Danger | `#f87171` | Out of stock, errors |
| Info | `#60a5fa` | Links, info banners |

### Recurring UI patterns (match these)
- **Cards:** `border-radius: 12px`, 1px subtle border, 16–20px padding
- **Section labels** above card groups (e.g. “TODAY’S JOB”, “NEEDS ATTENTION”)
- **Bottom sheets** for forms (handle bar at top, slides up over dimmed backdrop)
- **Pressable rows** inside cards with chevron or swipe affordances
- **Buttons:** Primary = green fill; Ghost = transparent with border
- **Icons:** Phosphor style (duotone, ~20–22px) — describe as “Phosphor duotone” in specs
- **No** Settings submenu for new features — entry points are FAB, home header, or existing section pages

### Home screen (existing — reference for header change)
Current header row:
- **Left:** Greeting (“Good afternoon”) + date (“Friday, June 5, 2026”)
- **Right:** Single gear button → Settings

Below header: Today’s job card → optional inventory alert → Coming up → tip banner.

---

## Features to mock up (priority order)

### FEATURE 1 — Lead pipeline (NEW)
**Entry:** Quick Action FAB → new row **“New lead”** (subtitle: “Capture an inquiry before they’re a client”)

**Primary screen: `/pipeline`**
- Full-page kanban or horizontal **stage stepper**: **Inquiry → Quoted → Booked**
- Stage tabs or pills at top; card list below for active stage
- Each lead card shows: name, phone, source badge (Instagram / Google / Referral / Text / Other), vehicle type, service interest, optional quote amount
- Swipe or overflow menu: Move stage, Edit, Delete
- Empty state per stage with illustration placeholder
- **FAB or header “+”** on pipeline page for quick add lead sheet

**New lead sheet (bottom sheet)**
- Fields: Name*, Phone, Email, Source (select), Vehicle type, Service (text or package picker), Notes
- Save → lands in Inquiry

**Quoted stage — “Send quote” CTA (DECIDED UX — mock all states)**

Use a **single combined primary button** on each Quoted-stage lead card: **“Send quote”** (green or prominent ghost).

**Do NOT mock the new-quote form (`/quotes/new`).** The app sends quotes from **quote detail**, not the editor.

**Tap “Send quote” → branching flow (mock each as a separate frame):**

| State | What happens | Frame to design |
|-------|----------------|-----------------|
| A — No client yet | Bottom sheet: “Create client from lead?” — shows prefilled name, phone, email from lead · **Create & continue** (primary) · Cancel | Confirmation sheet |
| B — Creating | Brief inline loading on card: “Creating quote…” | Loading on lead card |
| C — Success | Navigate to **Quote detail** (`/quotes/[id]`) — existing-style screen: quote number, package, price, status badge `draft`, **Mark sent** + **Client portal link** (ShareLinkActions) | Quote detail (reuse app card style) |
| D — Quote exists | Same button label but subtitle on card: “Quote #Q-1042 · Draft” — tap opens existing `/quotes/[id]` (deep-link) | Lead card with linked quote chip |

**Lead card in Quoted stage shows:**
- All inquiry fields
- Optional quote amount from lead
- Primary: **Send quote** (or **Open quote** if already linked)
- Secondary: Move to Booked · Edit lead

**Booked stage actions**
- “Convert to client + job” primary CTA (green)

**Design note:** Match `quick-action-row` and `inventory-card` visual weight. Source badges use small colored pills (muted backgrounds).

---

### FEATURE 2 — CRM client detail (REPLACE existing simple client page)
**Route:** `/clients/[id]` — same URL, richer **4-tab layout**

**Header (persistent across tabs)**
- Back chevron
- Client name (18px Syne semibold)
- Phone / email / address as muted lines
- Row of icon buttons: Call · Text · Email (existing pattern)
- Edit pencil top-right

**Stats card** (2×2 grid, existing pattern)
- Total revenue · Total jobs · Avg job · Lead source

**Tab bar** (sticky below stats): **Overview · Vehicles · History · Notes**

**Tab: Overview**
- “Due for service” banner if overdue (amber)
- Recent job snippet (1 card)
- Quick actions: Book job · New quote

**Tab: Vehicles**
- Grid of **vehicle tiles** (not just a list): each tile shows
  - User-uploaded **photo** or color swatch fallback (circle with `color_hex`)
  - Year Make Model
  - Plate · Color name
  - Vehicle type badge
- Tap tile → vehicle detail sub-screen or sheet
- “+ Add vehicle” ghost button

**Vehicle detail screen** (full page or tall sheet — mock as full page)
- Header: back · “2021 BMW X5” · edit icon
- Hero: vehicle photo (16:9 rounded card) or color swatch placeholder
- Meta rows: Plate · VIN · Type · Color
- Section label: **PRE-EXISTING DAMAGE**

---

### FEATURE 2b — Damage photos (HIGH PRIORITY — full mockup set)

Purpose: document **pre-existing damage** at intake — legal protection, not marketing before/after.

**Damage list (populated state)**
- Vertical stack inside `inventory-card`-style container
- Each **damage row**:
  - Left: 56×56 rounded thumbnail (8px radius)
  - Center: **Area** (14px semibold, e.g. “Front bumper”) + **Note** (12px muted, 2 lines max, e.g. “Small paint chip, pre-existing”) + **Date** (11px tertiary, “Jun 2, 2026”)
  - Right: chevron or tap → expand
- Rows separated by `border-bottom: 1px rgba(255,255,255,0.08)`
- Footer in card: **+ Add damage documentation** (ghost, full width)

**Damage list (empty state)**
- Inset empty area inside card:
  - Phosphor `WarningCircle` duotone, dim
  - “No damage documented”
  - “Add photos of scratches, dents, or existing wear” (muted)
  - **+ Add damage documentation** button

**Tap “Add damage documentation” → action sheet (REQUIRED — do not use camera-only)**

Bottom sheet titled **“Add damage photo”** with handle bar:

```
┌─────────────────────────────────────┐
│  Take photo                         │
│  Opens camera · best at intake      │
├─────────────────────────────────────┤
│  Photo library                      │
│  Choose from camera roll            │
├─────────────────────────────────────┤
│  Cancel                             │
└─────────────────────────────────────┘
```

- **Take photo** → rear camera (`capture="environment"`) — for on-site intake
- **Photo library** → standard picker, no capture — for existing roll / screenshots
- Icons: `Camera` and `Images` Phosphor duotone, green icon wells

**After photo selected → damage detail form (bottom sheet, second step)**
- Large preview of selected image (full width, max-height 200px, rounded 12px)
- **Area*** — text input with suggestions chips: Front bumper · Hood · Driver door · Roof · Wheels · Interior (tap chip fills field)
- **Note** — textarea, placeholder “Describe pre-existing condition…”
- **Date** — defaults to today, date picker
- Optional: **Link to job** — select dropdown if intake happens during a scheduled job
- Primary **Save** (green) · Cancel

**Damage detail (tap existing row)**
- Full-screen or sheet: large image, area, note, date, captured-at
- Actions: **Delete** (red ghost) · **Edit note** · Back

**Vehicle add/edit sheet** (lower priority than damage)
- Photo upload: same **Take photo / Photo library** action sheet (not camera-only)
- Fields: Year, Make, Model*, Color, Color hex optional, VIN, Plate, Type

**Tab: History**
- Full job list (existing job row style with status badge + revenue)

**Tab: Notes**
- Preferences / products / freeform notes as timeline or stacked cards
- “+ Add note” with type: Preference · Product · General

---

### FEATURE 3 — Before/after job photos (HIGH PRIORITY — full redesign mockup)

**Route:** `/jobs/[id]/photos` — enhance existing page; **no new nav tab**.

**Today (reference — replace this visually):** plain 2-column grid, separate “Add before/after” ghost buttons, share in a card at bottom. Your redesign should feel closer to the **client portal photo grid** (polished thumbs, lightbox, labels) while staying operator-focused.

---

#### Frame 3a — Job detail entry row (context)
On `/jobs/[id]`, show a pressable card row:
- Left: `Images` icon in green-tinted square
- Title: **Photos** · subtitle: “4 before · 6 after”
- Right: chevron
- Tap → photos page

---

#### Frame 3b — Photos page header
```
[ ← ]  Photos                    [ 10 ]
       Sarah Mitchell · Full Detail
       Jun 5, 2026
```
- Subtitle: client name + package (muted, 13px)
- Total count badge top-right

**Compare strip (new — optional hero)**
- Side-by-side **mini preview**: first before thumb | divider “→” | first after thumb
- If only one side has photos, show placeholder on empty side
- Label: “Before & after” — gives instant visual payoff

---

#### Frame 3c — Before section
Section header row:
- Label: **BEFORE** (uppercase section label, amber/warm dot or subtle amber left border on section)
- Right: **+ Add** chip (green outline, camera icon)

**Grid:** 2 columns, 8px gap, square thumbs (aspect-ratio 1)
- Thumbs: rounded 10px, object-fit cover, subtle border
- Hover/press state: slight scale or overlay
- **Empty state:** single dashed tile spanning full width OR 2 dashed tiles — “No before photos yet”
- **Add tile:** last cell can be dashed “+” tile (alternative to header chip — pick one pattern and stay consistent)

**Tap thumb → lightbox (Frame 3e)**

---

#### Frame 3d — After section
Same layout as Before but:
- Label: **AFTER** with **green** accent dot / left border (matches portal after styling)
- **+ Add** chip identical behavior

---

#### Frame 3e — Lightbox (match portal pattern)
Full-screen `#000` overlay:
- Top bar: **BEFORE** or **AFTER** pill (amber vs green) · “3 of 8” · **×** close (top right)
- Center: image, max viewport, pinch-zoom hint optional
- Left/right tap zones or arrows for prev/next within same section (before browses before only)
- Bottom bar (operator):
  - **Delete** (trash, red text) — confirm dialog
  - Optional caption display if set (muted, single line)
- Swipe down to close optional

---

#### Frame 3f — Add photo flow (before/after)
Tap **+ Add** in a section → **action sheet** (same pattern as damage photos):

```
Add before photo
· Take photo        (camera, on-site)
· Photo library     (roll / existing shots)
· Cancel
```

After capture → optional **caption sheet** (skippable):
- Preview thumb
- “Caption (optional)” single line — e.g. “Driver side swirl marks”
- **Add to job** primary

*Note: before/after defaults to **Take photo** emphasis for speed on the job, but library is required for operators who batch-upload later.*

---

#### Frame 3g — Sticky share footer
Pinned above bottom safe area (not scrolling away):
- Bar background: `#161616`, top border subtle
- Primary row: **Share with client** (`ShareNetwork` icon) — full width green button OR split button
- Expands to ShareLinkActions pattern: Copy link · Text · Email (mock expanded state as second frame)
- Only visible when `photos.length > 0`

---

#### Visual differentiation summary (before vs after)
| Element | Before | After |
|---------|--------|-------|
| Section accent | Amber `#fbbf24` | Green `#4ade80` |
| Lightbox pill | Amber bg tint | Green bg tint |
| Portal parity | Matches `portal-photo-thumb` | Matches `portal-photo-thumb--after` |

**Do not** mix before/after in one swipe carousel — keep sections separate (operator mental model).

---

### FEATURE 4 — Customer messages (NEW — NOT in Settings)
**Entry:** **Chat icon** in home header, **left of the gear icon** (two top-right icons)

```
[ Good afternoon        ] [ 💬 ] [ ⚙️ ]
[ Friday, June 5, 2026  ]
```

- Chat icon: Phosphor `ChatCircle` duotone, same size/style as gear
- Unread dot optional (small green or amber badge)

**Primary screen: `/messages`**
**Tab bar at top:** **All Messages** | **Auto Messages**

**Tab: Auto Messages (DECIDED UX — mock one card expanded + full list)**

Four stacked cards. **One enable toggle per template** — NOT separate SMS and Email toggles.

Each card contains:
1. **Header row:** Template name (14px semibold) + **master toggle** (right)
2. **Trigger subtitle:** e.g. “24 hours before appointment” (12px muted)
3. **Channel row:** label “Sends via” + **segmented control**: `Auto` | `SMS` | `Email`
   - **Auto** (default): SMS if client has phone, else email — show hint: “Uses phone when available, otherwise email”
   - **SMS**: only send if phone on file; show warning hint if preview client has no phone
   - **Email**: only send if email on file
4. **Preview block** (inset `#161616` surface, 12px radius, 12px padding):
   - Small pill top-left: **SMS** or **Email** reflecting current channel selection
   - Message body styled appropriately:
     - SMS: short, plain text, ~160 char feel
     - Email: greeting + line break + can include “View your portal” link line
   - Sample merge data: Sarah · Full Detail · 9:00 AM · Jun 6

**Templates:**
1. Appointment reminder — 24h before
2. Job completion — when marked complete
3. Review request — 24h after completion
4. Follow-up — 30 days after

**Mock one card in “expanded/editing” state** with channel = SMS and preview showing SMS style, plus full list of 4 cards collapsed.

**Tab: All Messages**
- Chronological list: client name, message preview (2 lines), channel pill (SMS / Email), timestamp, status (Sent / Failed)
- Tap row → read-only detail with full body
- Empty state: “No messages sent yet”

**No** links to this feature inside Settings.

---

### FEATURE 5 — Online booking (DEFER — placeholder only)
Show **one grayed-out card** on a “Coming soon” appendix page OR omit entirely. If included: single card “Online booking — let clients self-schedule” with lock icon. **Do not fully design the booking funnel.**

---

### FEATURE 6 — Inventory visual redesign (IMPLEMENT — high priority)
**Route:** `/inventory` (existing). Replace list-heavy home with **visual product grid** inspired by a tile/catalog aesthetic, while keeping category drill-down.

**Inventory home redesign**
- Header: warehouse icon in green tinted square + “Inventory” + subtitle “24 items · 2 low”
- **Needs attention** section stays (low stock rows) — list style OK here
- **Category grid** (2×2): Chemicals · Equipment · Supplies · Wish list — each cell has icon + count + chevron
- NEW: **Visual catalog strip** or full grid — “Your products”
  - **Square tiles** (~2 per row): 
    - **User-uploaded image** fills top 60% of tile (object-fit cover, rounded top corners)
    - If no image: fallback monogram (2 letters) on colored background OR category icon
    - Name below image
    - Qty line: “3 bottles” with stock bar (green / amber / red by % of max)
  - Tap tile → edit sheet

**Category detail view** (`/inventory` internal state)
- Toggle between **list view** and **grid view** (segmented control in header) — default grid for chemicals/supplies, list optional for equipment

**Add / edit item sheet (critical — FEATURE 8)**
Bottom sheet with:

1. **Image picker** at top (prominent)
   - 96×96 preview, rounded 12px
   - “Choose photo” / “Take photo” — user supplies their own product image
   - Remove image × 

2. Name, category, unit, quantity on hand, reorder at, cost fields (existing)

3. **Acquisition toggle** (NEW — must be visually clear):

```
How did you get this?
┌─────────────────────┬─────────────────────┐
│  💳 Bought new      │  ✓ Already owned    │
│  (counts as expense)│  (no expense)       │
└─────────────────────┴─────────────────────┘
```

- Segmented **two-option toggle** (not a single checkbox)
- **Left selected (Bought new):** show Amount paid*, Vendor, Date → “Will log as business expense” hint in muted text
- **Right selected (Already owned):** hide expense fields → “Adds to inventory only” hint
- For **Equipment** category, default to “Already owned”; for **Chemicals/Supplies**, default to “Bought new”

4. Save button (primary green, full width)

**Restock flow:** keep separate; restock always implies expense (show cost fields).

---

### FEATURE 7 — Recurring jobs (SKIP)
Do not mock up. Omit from deliverables.

---

## Screens checklist for Claude

### P0 — Priority focus (do these first, multiple states each)

| # | Screen | States to mock |
|---|--------|----------------|
| **2b-i** | Vehicle detail — damage list empty | Empty + CTA |
| **2b-ii** | Vehicle detail — damage list populated | 3 rows with thumbs |
| **2b-iii** | Add damage — Take photo / Library action sheet | Sheet open |
| **2b-iv** | Add damage — area + note form | With image preview |
| **2b-v** | Damage row detail / full image view | Delete + edit |
| **3a** | Job detail → Photos entry row | With counts |
| **3b** | Photos page — full layout with compare strip | Populated before+after |
| **3c** | Photos page — before section only | Empty + grid |
| **3d** | Photos page — after section | Populated |
| **3e** | Lightbox — before (amber) and after (green) | 2 frames |
| **3f** | Add before/after — action sheet + optional caption | 2 frames |
| **3g** | Sticky share footer — collapsed + expanded | 2 frames |
| **1d** | Quoted lead — Send quote button | Default card |
| **1e** | Send quote — create client sheet | State A |
| **1f** | Quote detail after send quote flow | State C |
| **4b** | Auto Messages — 4 cards + one expanded with channel | Auto/SMS/Email |

### P1 — Rest of brief

| # | Screen | Viewport |
|---|--------|----------|
| 1a | Quick Action sheet with “New lead” row | Mobile |
| 1b | Lead pipeline — Inquiry stage | Mobile |
| 1c | New lead bottom sheet | Mobile |
| 2a | Client detail — Vehicles tab with photo tiles | Mobile |
| 2c | Client detail — Notes tab | Mobile |
| 4a | Home header with chat + gear icons | Mobile |
| 4c | Messages — All Messages list | Mobile |
| 6a | Inventory home — visual product grid | Mobile |
| 6b | Add inventory sheet — image picker + expense toggle | Mobile |
| 6c | Inventory category grid view | Mobile |

---

## Interaction & accessibility notes
- Minimum tap target: **44×44px**
- Bottom sheets: drag handle, backdrop tap to close
- Forms: labels 11px muted above inputs; inputs use `#1e1e1e` background, subtle border
- Status badges: pill shape, 11px font, semantic background tints (12% opacity)
- Loading: centered “Loading…” muted text (no skeleton required in mockup)
- Empty states: centered icon (duotone, dim) + one line copy + optional CTA

---

## What NOT to do
- No light mode
- No desktop-first layouts (mobile is primary; tablet may show same column centered)
- No Lucide icons — specify Phosphor duotone
- No new features in Settings screen
- No Stripe/checkout UI (booking deferred)
- No recurring jobs UI
- No separate `job_photos` admin — photos stay on job detail path
- No duplicate inventory systems — one `/inventory` with the new visual grid

---

## Reference: existing home header HTML structure (for chat icon placement)

```tsx
<header className="home-header">
  <div>
    <h1 className="home-header__greeting">Good afternoon</h1>
    <p className="home-header__date">Friday, June 5, 2026</p>
  </div>
  {/* ADD: chat button before settings */}
  <button className="home-header__messages" aria-label="Messages">
    <ChatCircle />
  </button>
  <button className="home-header__settings" aria-label="Settings">
    <Gear />
  </button>
</header>
```

Suggest CSS for header actions: flex row, gap 8px, both icons same muted color → green on active/unread.

---

## Output format requested from Claude

**Start your response with the P0 priority screens** (damage photos, before/after photos, send quote flow, auto messages channel UI).

For each P0 screen provide:
1. **Visual mockup** OR detailed ASCII wireframe at 390×844
2. **Interaction notes** (what tap does what)
3. **Suggested CSS class names** (e.g. `damage-doc-row`, `job-photos-compare`, `job-photos-lightbox`, `auto-message-channel`)

Then if space allows:
4. **Flow map** (mermaid or ASCII): Damage add flow · Before/after add → lightbox → share · Send quote → quote detail
5. **Token table confirmation** — colors match spec
6. Any remaining open questions

---

*End of prompt*
