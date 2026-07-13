# Post–Wave 4 backlog (desktop + later)

Rinse’s coded waves **0–4** plus remaining **2/3 finish slices** are done in the native operator app (`apps/mobile`). This doc is the parked product backlog for later — including when you build a **desktop** shell of the same product.

## Already shipped (do not rebuild)

| Wave | Outcome |
|------|---------|
| 0 | SQLite drafts, auto-save, expanded offline sync, server `uploaded_at` |
| 1A–1C | Quote/invoice drafts, arrival windows + buffers, vault read-only + cancel honesty |
| 2A–2C | Hybrid qty×price lines, inspection gate + PDF, transformation PDF + send gates |
| 3A–3C | Twilio SMS (`on_my_way`, `review_request`), quiet hours, EN/ES customer docs + share emails |
| 4 | Parent/sub clients, multi-vehicle quote shell, drive-time pad, CSV column mapping, SPF/DKIM checklist |

### Wave 2/3 finish slices (native — done)

- Client + server **before+after gates** on invoice send / portal invoice·photos·full (`ShareLinkActions`, invoice list/detail, API `transformation-gate`, PB `invoices_sent_transformation.pb.js`)
- Share / mailto copy from **`document_locale`** via `@rinse/core` `share-email`
- Companion **transformation PDF** share after email send when gated scopes apply

Native remains the **operator** source of truth. Desktop should reuse `@rinse/core`, PocketBase, and `apps/api` — not fork business logic into a second CRM.

---

## Parked features (candidates for Wave 5+ / desktop)

Prioritize by shop pain × fit for a larger screen. Desktop is a natural home for denser grids (route packing, multi-tech, tax tables, QBO).

### Strong next bets

1. **Deposit / cancel / no-show policy** — Collect deposit at book; policy copy on cancel; optional auto-fee language. Touches public book + jobs + invoices.
2. **Weather / rain-day reschedule** — One-tap push when outdoor jobs slip (pairs with existing weather readiness).
3. **Route-day packing** — Order the day’s jobs by drive, not only calendar block order. Desktop calendar/list is ideal.
4. **Multi-tech assignment** — Assign jobs to techs/vans; filters on day view. Solo today; 2-van shops churn without this.
5. **Tips on pay link** — After transformation photos; Stripe Checkout tip / gratuity line.
6. **Add-on catalog** — Pet hair, ozone, ceramic as first-class package add-ons (not free-text only).

### Trust / compliance

7. **Jurisdiction sales tax** — Mobile crosses city lines; flat org tax breaks trust. Needs address → rate (or manual jurisdiction picker first).
8. **Dispute-ready audit trail** — Who changed price/status/when (pairs with liability vault).
9. **Photo retention policy** — Explicit retention + export; “never deleted by update” needs product language + jobs.

### Growth / ops

10. **Recurring / membership detailing** — Weekly/biweekly routes beyond one-off B2C (`recurrence_*` exists partially on jobs).
11. **Customer portal self-serve** — Pay, reschedule, photos without texting the owner (portal exists; deepen actions).
12. **SOP / job checklists** — Quality consistency for hired techs.
13. **QuickBooks** — Only after hybrid line model is battle-tested (it is); still Phase-2 integration work.
14. **Live traffic drive-time** — Static OSRM pad exists; live ETA is the upgrade.

### Explicit skips / traps

- **Postcard mail** — Competitor trap; blank cards + charges.
- **Bluetooth card readers** — Hardware hell; prefer Tap to Pay / link pay.
- **R&I / PDR labor guides** — Wrong vertical.

---

## Desktop build notes

**Reuse**

- `@rinse/core` types, billing lines, document i18n, quiet hours, gates
- PocketBase collections + hooks (subscription vault, inspection gate, invoice send gate)
- `apps/api` routes (PDF, portal, SMS, booking, drive-time)

**Prefer native patterns over inventing**

- Operator screens live under `apps/mobile/app/` — port flows, don’t invent parallel status enums
- Client-facing book/portal stay on web (`apps/api` / website); desktop is for **operators**

**Desktop-first UI opportunities**

- Multi-column day board (techs × time)
- Route map + drag reorder
- Bulk CSV / tax table edit
- Side-by-side quote ↔ invoice ↔ photos

**Do not**

- Resume development in legacy `detailing-app` PWA unless explicitly requested
- Duplicate subscription / vault rules client-only — server hooks are source of truth

---

## Suggested Wave 5 kickoff (when ready)

Smallest valuable desktop-friendly slice:

1. Deposit + cancel policy on public book + job detail  
2. Day route order (manual drag → save sequence)  
3. Tip on payment link  

Say **“implement Wave 5: deposits + route order”** (or similar) to start coding.
