# Invoice Fly — ScreenDesigns replays

**App:** Invoice Maker · Invoice Fly  
**Frames:** 218 webp files  
**Frame IDs:** `274877` – `275179` (mostly +2 per frame)  
**Filename pattern:** `invoice-maker-invoice-fly_{id}.webp`  
**Mapped:** Phase 0 complete (2026-07-02)

Exported from ScreenDesigns. Sequential IDs = animation frames. Scrub 5–10 consecutive frames to see motion.

---

## Replay timeline (screen index)

| # | Screen / flow | Frame range | Archetypes | Motion wave | Setup UX wave |
|---|---------------|-------------|------------|-------------|---------------|
| 1 | Splash / app logo | 274877 | — | — | — |
| 2 | Welcome + ATT tracking dialog | 274878–274879 | — | 48 | 2 |
| 3 | Onboarding hero carousel (“Invoice in seconds”, “Get paid faster”, “Scan receipts”) | 274880–274883 | `step-enter` | 48 | 3 |
| 4 | Business setup — business info | 274883–274884 | `step-enter` | 48 | 5–6 |
| 4b | Industry picker (search + list) | 274884 | — | — | — skip |
| 5 | Business setup — upload logo + progress bar | 274885–274887 | `progress-fill`, `sheet-enter` | 48 | 7 |
| 5b | Image picker sheet + photo gallery | 274886–274888 | `sheet-enter`, `sheet-exit` | 41, 48 | 7 |
| 5c | Logo crop editor | 274889 | — | — | 7 opt |
| 6 | Logo upload complete + success badge | 274890 | `success-pop` | 48 | 7 |
| 7 | AI estimate builder + confetti | 274892 | `success-pop`, `attention-pulse` | 53 | — |
| 8 | Rating prompt + App Store dialog | 274893–274895 | `sheet-enter` | 48 | 12 |
| 9 | Account created hero | 274896 | `success-pop`, `empty-enter` | 48 | 8–9 |
| 9b | Preview & customize invoice | 274903 | — | — | 9 defer |
| 10 | Device mockup promo | 274905 | — | — | — |
| 11 | New invoice + coachmark tooltip | 274921 | `attention-pulse` | 44, 46 | — |
| 12 | Invoice preview + duplicate confirm modal | 274937 | `sheet-enter`, `press-depth` | 46 | 9 |
| 13 | New line item sheet | 274953 | `sheet-enter` | 41, 51 | — |
| 14 | Attachments (images/PDFs) | 274969 | `list-stagger` | 50 | — |
| 15 | Signature canvas | 274985 | `press-depth` | 46, 52 | — |
| 16 | Invoice preview + send sheet (email/link/PDF) | 275001 | `sheet-enter` ⭐ | 41, 46 | — |
| 17 | Share contacts permission sheet | 275016 | `sheet-enter` | 45 | — |
| 18 | Text-to-invoice sheet + keyboard | 275032 | `sheet-enter` | 41 | — |
| 19 | Voice to invoice — recording + waveform | 275040 | `attention-pulse` | 41, 53 | — |
| 20 | Invoice actions sheet (PDF, duplicate, delete) | 275048 | `sheet-enter`, `swipe-reveal` | 41, 46 | — |
| 21 | Cost estimator accordion | 275064 | `list-stagger`, `press-depth` | 49 | — |
| 22 | Add client sheet | 274921, 275074 | `sheet-enter` | 41, 45 | — |
| 23 | Expense scanner promo modal | 275082 | `sheet-enter`, `attention-pulse` | 50 | — |
| 24 | Add expense (OCR receipt) | 275090 | `success-pop` | 50 | — |
| 25 | Expenses list + category detail | 275098–275099 | `list-stagger` | 50 | — |
| 26 | Expenses + iOS share sheet | 275100 | `sheet-enter` | 50 | — |
| 27 | Create invoice from time | 275106 | `sheet-enter`, `pill-spring` | 46 | — |
| 28 | Widget how-to (tabs + steps) | 275114 | `tab-active` | 53 | — |
| 29 | AI chat + set logo confirmation sheet | 275122–275130 | `sheet-enter`, `success-pop` | 53 | — |
| 30 | AI history — select + context menu sheet | 275138–275140 | `list-stagger`, `sheet-enter` | 49 | — |
| 31 | Invoices dashboard (chart + KPI + list) | 275146 | `list-stagger`, `counter` ⭐ | 43, 46 | — |
| 32 | Clients revenue (donut chart + list) | 275154 | `list-stagger`, `counter` | 43, 45 | — |
| 33 | Tax and currency settings | 275162 | `press-depth` | 47 | — |
| 34 | My team | 275170 | `list-stagger`, `press-depth` | 47 | — |
| 35 | App settings + voice picker sheet | 275179 | `sheet-enter` ⭐ | 41, 47 | — |

⭐ = hero moment (see below)

---

## 5 hero moments (implement first)

Highest impact for Rinse, lowest risk — mapped to Style Waves 41–43:

| Priority | Moment | Frames | Archetype | Rinse target | Wave |
|----------|--------|--------|-----------|--------------|------|
| 1 | Send invoice sheet (email/link/PDF) | 275001 (+ 5 frames) | `sheet-enter` | `BottomSheet` / inv-sheet | 41 |
| 2 | Invoices dashboard load (chart + list) | 275146 (+ 5 frames) | `list-stagger` | Home / `/invoices` | 43, 46 |
| 3 | Account created success | 274896 (+ 5 frames) | `success-pop` | Onboarding first-invoice | 48 motion · **8–9 layout** |
| 4 | Voice/settings picker sheet | 275179 (+ 5 frames) | `sheet-enter` | Settings pickers / `VaulSheet` | 41, 47 |
| 5 | Logo upload progress + complete | 274886–274890 | `progress-fill`, `success-pop` | Onboarding business step | 48 motion · **7 layout** |

**Setup layout waves:** see [`../SETUP_UX_PLAN.md`](../SETUP_UX_PLAN.md).

---

## Pattern checklist

- [x] Sheet spring enter + scrim fade
- [x] List/card stagger on load
- [x] Row press depth (scale + bg)
- [x] Segmented control / pill spring
- [x] Progress bar animated fill
- [x] Success / checkmark / confetti moment
- [x] Empty state illustration (Wave 53 — `EmptyIllustration` + `ui-empty--illustrated`)
- [x] KPI / number counter (invoice dashboard)
- [ ] FAB / nav tab active pop (not prominent in this replay)
- [x] Swipe row reveal (invoice actions)

---

## How to browse

1. Sort files by name (IDs are sequential, step +2)
2. Open 5–10 consecutive frames for one animation
3. Reference archetype names from `../MOTION_SPEC.md`
4. Check `../STYLE_PLAN.md` (motion) or `../SETUP_UX_PLAN.md` (setup layout) for wave assignment
