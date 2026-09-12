# Claude prompt — Rinse-tailored onboarding + slide transitions

Copy everything below **PROMPT START** into Claude (Sonnet/Opus). Attach the PNGs listed in the table — they are real Rinse UI captures from the local demo (`/demo`).

**Where the captures live:** `design-references/rinse-site-captures/`

| File | What it shows | Use in onboarding |
|------|---------------|-------------------|
| `01-demo-home.png` | Operator home — revenue, today’s job, green hero card | Phone screen beats 1, 4, 6; closing transition target |
| `02-demo-jobs.png` | Jobs list — This week / Recurring | Phone screen beat 5; timeline step 3 |
| `03-demo-invoice.png` | Invoice detail / send flow | Phone screen beat 2; checklist item |
| `04-demo-booking.png` | Client booking calendar preview | Phone screen beats 1–2; hero + share beat |
| `05-demo-setup-intro.png` | Production `/intro` carousel (slide 1) in demo frame | Reference for copy + dark panel; **not** the 6-beat flow |
| `06-onboarding-claude.png` | Current Scan Hero prototype (slide 1) — wrong copy/colors | **Replace** — structure to keep, content to swap |
| `07-intro-carousel.png` | Full `/intro` slide 1 — lifestyle poster + curve | Poster tone reference; hybrid with dark Scan Hero shell |
| `08-welcome.png` | Light welcome split layout | Post-onboarding destination (or redesign per Scan Hero frame 227) |

**Also attach (optional Scan Hero motion reference):**
- `design-references/scan-hero/scan-hero-pdf-scanner_227.webp` … `_232.webp` (6 frames)

**Code you are editing (do not rewrite from scratch):**
- `src/components/onboarding-claude/onboarding-data.ts` — step copy + icons
- `src/components/onboarding-claude/OnboardingFlow.tsx` — layout, `PHONE_ANGLES`, motion
- `src/components/onboarding-claude/PhoneFrame.tsx` — 3D phone cube + scan beam
- Demo route: `src/app/demo/onboarding-claude/page.tsx`

---

## PROMPT START

You are a senior React + motion designer working on **Rinse** — mobile-first SaaS for solo **mobile auto detailers** (booking link, jobs, clients, invoices, payments).

I attached **screenshots of our real app** and the current **Scan Hero–style onboarding prototype** (6 slides, dark shell, 3D phone). The prototype still has scanner copy and mint green `#34F0A0`. Your job: **Rinse-ify the funnel** and specify **how each slide transitions** (phone angle, scan beam, screen content, text motion).

### Product voice (use everywhere)

- Audience: solo mobile detailer, between jobs, premium but approachable
- Accent: **`#22c55e`** (Rinse green) — replace all `#34F0A0` / Scan Hero lime
- Dark canvas: keep `#1B1D30` / `#24273D` shell OR propose `#0f1117` → `#12141d` if closer to attached `07-intro-carousel.png` bottom panel
- Typography: **Syne** display + **DM Sans** body (already in app) — not Inter
- Icons: prefer **`@phosphor-icons/react`** duotone; only keep `lucide-react` if migration is out of scope

### What to deliver

Return **three sections** in one response:

1. **Updated `onboarding-data.ts`** — full 6-step array with Rinse copy (see mapping below)
2. **`PhoneFrame` screen map** — which real UI crop goes on each slide + how to implement (img src vs inline JSX mock)
3. **Transition spec** — per slide change: phone rotation (`PHONE_ANGLES`), scan beam on/off, text enter/exit, stagger delays

Do **not** redesign the whole component tree. Extend what exists.

---

### 6-beat funnel — Rinse content mapping

Map Scan Hero structure → Rinse features. Green **accent word(s)** in titles where noted.

| # | Kind | Scan Hero (today) | Rinse (target) | Phone screen (from captures) |
|---|------|-------------------|----------------|------------------------------|
| 1 | `hero` | Turn device into scanner | **Run your detailing business from your phone** — eyebrow: Welcome | Crop from `04-demo-booking.png` — calendar + time slots; subtle green glow |
| 2 | `showcase` | Instantly **Scan & Share** | Share your **booking link** — body: clients pick service, date, time | `04-demo-booking.png` or booking link sheet; **scan beam ON** |
| 3 | `checklist` | Scan anything… | Everything in **one app** — accent: What you get | No phone — icon list only; items below |
| 4 | `showcase` | Manage documents **Easily** | **Jobs** and revenue at a glance — body: today’s schedule, MTD numbers | `01-demo-home.png` — home dashboard; angle `organize` |
| 5 | `timeline` | Scan → Sign → Convert → Share | **Book → Job → Invoice → Paid** | Stack or single phone: booking → jobs → invoice crops |
| 6 | `closing` | Ready to digitize paper? | Ready to **grow your detailing business**? | `01-demo-home.png` or logo; scan beam OFF |

**Checklist items (slide 3):**
- Online booking link (`Calendar` / `Link` icon)
- Jobs & schedule (`Briefcase`)
- Clients & vehicles (`Users`)
- Invoices & payments (`Receipt` / `CurrencyDollar`)
- Share via text or QR (`ShareNetwork`)
- Works on the go (`Car`)

**Timeline items (slide 5):**
1. Client books online
2. Job appears on your schedule
3. Send invoice when done
4. Get paid — Stripe / tap to pay

CTAs: slide 1 & 6 → **Get started** (or **Continue** to match `/intro`).

---

### Phone 3D + scan beam (existing behavior — respect it)

`PhoneFrame` uses a **CSS 3D cube** (6 faces) with `translateZ` depth. Scan beam is a child with **inline `transform: translateZ(28px)`**; keyframes animate **only `top` + `opacity`** — never `transform` in `@keyframes` (breaks stacking).

Current angles in `OnboardingFlow.tsx`:

```ts
const PHONE_ANGLES = {
  hero:       { x: 8,  y: -18, z: -4 },
  scanShare:  { x: -6, y:  20, z:  5 },
  organize:   { x: 10, y: -22, z: -6 },
  closing:    { x: -8, y:  16, z:  6 },
}
```

Propose **per-step angle + beam** table and any small angle tweaks (±3° max unless justified).

| Transition | Phone motion | Scan beam | Text motion |
|------------|--------------|-----------|-------------|
| 0 → 1 | hero → scanShare: yaw left, pitch down | beam fades in over 400ms | title crossfade up 28px, 280ms spring |
| 1 → 2 | phone scales down / exits; checklist has no phone | beam off | list rows `list-stagger` 60ms |
| 2 → 3 | phone re-enters from bottom with `organize` angle | beam off | showcase title + green accent word pop |
| 3 → 4 | optional dual-phone or stepped morph | beam off | timeline labels slide in from left |
| 4 → 5 | `closing` angle, phone settles center | beam off | closing question fade; CTA pulse once |

Use **motion archetypes** from our spec: `sheet-enter`, `list-stagger`, `pill-spring`, `press-depth`. Duration ~280–320ms, easing `[0.22, 1, 0.36, 1]`. Include `@media (prefers-reduced-motion: reduce)` notes.

---

### Replacing faux document inside `PhoneFrame`

Today the phone shows a **generic white card + blue bar** (Scan Hero placeholder). Replace with **real Rinse UI**:

**Option A (fast):** `<img>` crops from attached PNGs, `object-fit: cover`, rounded to screen inset, `pointer-events: none`.

**Option B (better):** Simplified JSX mock matching captures — light gray `#f4f4f5` app background, white cards, `#22c55e` CTAs, sample copy from screenshots (James Rivera · Full Detail · $285).

For each slide, specify A or B and exact crop region (e.g. “top 70% of `01-demo-home.png`, hide bottom nav”).

---

### Bridge to production `/intro` (3 slides)

We also have a **3-slide photo carousel** (`07-intro-carousel.png`) with lifestyle posters and `SetupHeroCurve`. In a short appendix, say whether to:

- **Replace** `/intro` with this 6-beat flow, or
- **Keep both** (marketing intro → auth → welcome), or
- **Merge** (3 photo slides then 3 product slides)

Recommend one path for a solo detailer funnel.

---

### Final transition: onboarding → app

Describe one **exit transition** when user taps **Get started** on slide 6:

1. Dark shell scrim fades
2. Phone **un-tilts** to flat front-facing
3. Phone screen content **crossfades** to full `01-demo-home.png` layout
4. Shell background **lightens** to operator `#f4f4f5` (or navigate to `/welcome` light split per `08-welcome.png`)

Provide Framer Motion pseudo-code or CSS keyframe names — not a full new page.

---

### Constraints

- Demo route only unless I say merge to production
- No new npm packages
- Match existing `OnboardingFlow` COLORS object — update values in place
- Keep Skip (top-right) and back chevron on slides 2+
- File outputs: give complete `onboarding-data.ts` and a bullet **implementation checklist** for `PhoneFrame.tsx` + `OnboardingFlow.tsx` edits

## PROMPT END
