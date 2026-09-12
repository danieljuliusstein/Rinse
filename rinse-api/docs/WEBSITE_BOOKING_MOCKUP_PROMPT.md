# Website + Booking Calendar — Mockup Prompt for Claude

Copy everything below the line into Claude (or another design tool). Attach your **Atlas logo** (`public/logo.png`) and, if available, screenshots of your **personal site** and the **Atlas Detailing app** Home screen.

---

## Copy everything below this line into Claude

---

You are a senior product designer and brand designer. Create **visual mockups and a system diagram** for a **public marketing + booking website** for **Atlas Detailing** that:

1. Feels like a natural extension of the existing **Atlas Detailing operator app** (dark, clean, mobile-first UI)
2. Links coherently with the owner’s **personal website** (portfolio / professional presence)
3. Includes an **online appointment calendar** that **syncs with the operator app** (bookings on the site appear as scheduled jobs in the app; blocked times on the app hide availability on the site)
4. Uses the **existing Atlas logo and color theme** — do not invent a new brand
5. Includes **print mockups**: business card (front + back) and **door flyer** (hanging door hanger or standard 8.5×11 flyer — pick one and note dimensions)

---

## Brand (use exactly — no redesign)

### Business name
**Atlas Detailing** (short: **Atlas**)

### Logo
- **Primary mark:** Circular badge — black background, white car silhouette + stylized wings + letter **“A”**
- Use the attached logo file as-is; do not redraw unless recreating at higher resolution for print
- App favicon / PWA uses the same mark

### Color palette (match operator app)

| Token | Hex | Usage |
|-------|-----|--------|
| Page background | `#111111` | Site body (dark mode default) |
| Card / surface | `#1a1a1a` | Cards, sections |
| Card raised | `#1e1e1e` | Hero panels |
| Border | `#222222` | Card borders |
| Text primary | `#eeeeee` | Headlines |
| Text secondary | `#555555` | Subtitles, labels |
| Text hint | `#3a3a3a` | Placeholders |
| Accent green | `#4caf50` | CTAs, active states, links |
| Green muted | `#1a3a1a` / `#2a5a2a` | Chip backgrounds, badges |
| Amber | `#f59e0b` | Warnings, “Pending” |
| Blue | `#60a5fa` | Info, “In progress” |
| Red | `#f87171` | Errors only |

### Typography
- **Headings:** [Syne](https://fonts.google.com/specimen/Syne), weight 600
- **Body / UI:** [DM Sans](https://fonts.google.com/specimen/DM+Sans)
- Section labels: 11px, uppercase, letter-spacing 0.07em, `#555555`

### UI patterns (match operator app)
- Dark-first; optional **light hero band** on marketing pages is OK if it still feels on-brand
- Cards: `border-radius: 14px`, 0.5px border `#222`, 13–16px padding
- Filter **chips:** pill shape, green fill when active
- Primary button: green `#4caf50`, dark text or white icon
- Icons: Phosphor duotone style (~20px)
- Max content width: **390px** on mobile; **960–1100px** on desktop marketing pages
- Clean, minimal — no stock photo clutter; use subtle gradients or solid surfaces

---

## Personal site integration

**Owner personal site URL:** `[FILL IN — e.g. https://danieljuliusstein.com]`

The personal site and Atlas site should feel like **one family**:

| Personal site | Atlas Detailing site |
|---------------|----------------------|
| About, resume, projects | Services, gallery, pricing, **Book now** |
| Footer link: “Detailing →” | Footer link: “← Back to [Name]” or subtle “Personal site” |
| Lighter or neutral theme OK | Dark theme (Atlas app match) |

**Mock up:**
- Personal site **header/footer** with a clear **“Book detailing”** CTA that goes to `book.atlasdetailing.com` or `/detailing` on the same domain
- Atlas site **minimal header**: logo + Services · Gallery · Book · Contact
- Show **both sites side-by-side** (desktop) or **linked flow** (mobile): Personal → tap Book → Atlas booking page

---

## Operator app context (what the website must sync with)

The owner already runs **Atlas Detailing** — a Next.js PWA with:

- **Home:** week strip calendar, today’s jobs, upcoming appointments
- **Jobs:** scheduled / in-progress / paid pipeline
- **Clients:** CRM with vehicles, damage photos, portal links
- **Money:** P&L reports
- **Backend:** PocketBase (`jobs`, `clients`, `packages` collections)
- **Job fields relevant to booking:** `date`, `start_time`, `status` (starts as `scheduled`), `client_id`, `package_id`, `vehicle_type`, `location_type` (mobile vs shop), address
- **Client portal:** existing share link for quotes, photos, invoices (`/portal/[token]`)

**Integration requirement (design + diagram):**

```
Customer (website)                    Atlas operator app
─────────────────────                 ────────────────────
Pick service + date/time    ──POST──►  New job (scheduled)
Enter name, phone, vehicle            Appears on Home week strip
Confirm booking                       Appears in Jobs list
Receive confirmation email/SMS        Push notification optional

Operator blocks time in app ──API──►   Slot hidden on public calendar
Operator completes job      ──sync──►  Status → completed (website shows history in portal only)
```

Mock this as a **simple architecture diagram** (boxes + arrows) plus **3 user journeys** with screen frames.

---

## Website pages to mock (priority order)

### 1. Home / landing
- Hero: logo, one-line value prop (“Premium mobile detailing in [City/Region]”), **Book appointment** CTA
- 3 service cards (e.g. Full Detail · Interior · Maintenance) with starting price
- Social proof row (optional stars or “Insured · Mobile · By appointment”)
- Footer: phone, Instagram, link to personal site

**Desktop + mobile (390×844) frames**

### 2. Book appointment — calendar flow (MOST IMPORTANT)

Design **4–6 frames** for the full flow:

| Step | Screen |
|------|--------|
| A | Choose **service** (package cards — match app package names) |
| B | Choose **location** — Mobile (address field) vs Shop |
| C | **Calendar** — month view + available time slots (green = open, gray = taken/blocked) |
| D | **Your details** — name, phone, email, vehicle type, notes |
| E | **Confirmation** — summary card, “Add to calendar” link, portal link preview |
| F | **Error / waitlist** — slot taken while booking; offer next available |

Calendar UI should visually rhyme with the app’s **week strip** (green highlight on selected day, dots for busy days).

### 3. Services & pricing
- Table or cards aligned with app `packages` collection
- Each service: duration estimate, what’s included, from-price

### 4. Gallery (optional)
- Before/after grid — same card style as app job photos

### 5. Contact
- Click-to-call, text, email, service area map placeholder

---

## Sync mockup — operator view (show linkage)

Include **one composite mockup** split left/right or top/bottom:

**Left:** Website confirmation — “Booked · Full Detail · Sat Jun 14 · 10:00 AM”  
**Right:** App Home screen — same job appears under **Today’s jobs** with matching client name, time, and “Scheduled” badge

Label arrows: “Same PocketBase `jobs` record” or “Real-time sync (< 30s)”

---

## Print deliverables

### Business card (3.5 × 2 in, 300 DPI spec)
- **Front:** Logo centered or left; “Atlas Detailing”; tagline (e.g. “Mobile · By appointment”)
- **Back:** Name, phone, email, QR code → booking URL, optional Instagram
- Show on **dark card stock** mockup (matte black) with white/green ink — on-brand
- Provide **print-ready notes**: bleed 0.125 in, safe zone, CMYK or rich black guidance

### Door flyer / door hanger
Pick **one format** and mock both sides if hanger:
- **Option A — Door hanger:** 4.25 × 11 in, hole at top; front = bold offer + QR; back = services + booking URL
- **Option B — Flyer:** 8.5 × 11 in; hero image area + QR + “Scan to book” + 3 bullet services

Use logo, green accent, dark background; high contrast for porch/door visibility.

---

## Technical notes for realism (do not implement — for diagram labels only)

- Public site: Next.js on subdomain `book.[domain]` or path `/detailing`
- Booking API creates `clients` + `jobs` (status: `scheduled`) in PocketBase
- Availability API reads scheduled jobs + operator “blocked hours” settings
- Confirmation: email via Resend (already in app stack)
- Optional: Google Calendar one-way export for operator (app already supports `.ics` per job)

---

## Deliverables checklist

Claude, produce:

1. **Mobile mockups** (390×844) — Home, Book flow (all steps), Confirmation  
2. **Desktop mockups** (1440×900) — Home + Book calendar step  
3. **Integration diagram** — website ↔ PocketBase ↔ operator app  
4. **Personal site ↔ Atlas link mockup** — navigation between the two  
5. **Business card** — front + back, print specs  
6. **Door flyer or hanger** — front (+ back if hanger)  
7. **Short interaction notes** per screen (1–3 bullets)  
8. **Component list** with suggested CSS class names matching app conventions (`page-header`, `stat-card`, `chip`, `job-card`, etc.)

**Do not:** invent a new logo, switch to a light-only SaaS aesthetic, or use generic blue/purple startup gradients.

**Do:** keep the same calm, dark, professional feel as the Atlas Detailing operator app mockups (Home · Jobs · Clients · Money).

---

## Assets to attach when prompting

- `public/logo.png` — Atlas circular logo  
- Screenshot: app Home screen (week strip + today’s jobs)  
- Screenshot: app Jobs list (optional)  
- Personal site URL or screenshot (if available)  
- Service area / city name: `[FILL IN]`  
- Phone / Instagram: `[FILL IN]`

---

## Example opening line for Claude

> “Using the attached Atlas Detailing logo and the design system below, create mobile and desktop mockups for a public booking website that syncs appointments to my existing operator app, plus business card and door flyer print mockups. Start with the booking calendar flow and the integration diagram.”
