# Rinse Desk — Onboarding Tour Handoff

> **Live path (default):** Tour chrome overlays the real Desk shell (`App.tsx` Sidebar + pages).
> Data comes from `useData()` via [`TourDataProvider`](../src/data/tour/TourDataProvider.tsx).
> Entry: [`TourSession`](../src/components/tour/OnboardingTour.tsx) — first-run + Help → “Take the tour”.
> Persistence: `desk.onboardingTourDone` via [`onboarding-tour.ts`](../src/lib/onboarding-tour.ts).
> Dev-only: jump bar + agent overlay (`import.meta.env.DEV`).

## Mental model

| Concern | Lives in | Edit to… |
| --- | --- | --- |
| **Config** (stops, copy, targets) | `components/tour/tour-stops.ts` | add / remove / reorder stops |
| **Chrome** (spotlight, coach) | `tour-chrome.tsx`, `tour-provider.tsx` | rarely |
| **Live hooks** | real pages + `useCreateActions` | `data-tour-target` + `notifyCreated` / `completeStop` |
| **Invoice create** | `lib/api.ts` → `createInvoiceForJob` | Desk parity with mobile |

## Stops (live)

1. **orient** — click Dashboard (`nav-dashboard`)
2. **contacts** — `createContact` → `notifyCreated('contact')`
3. **deals** — add deal or advance stage → `notifyCreated('deal')`
4. **calendar** — `createJob` → `notifyCreated('job')`
5. **invoices** — ensure draft via `createInvoiceForJob` / `ensureDraftInvoiceForJob`, then Mark sent (photo gate waived during tour)

## Invoice create (Desk ↔ mobile parity)

```ts
// rinse-desk/src/lib/api.ts
createInvoiceForJob(jobId)       // PB create draft + link job
ensureDraftInvoiceForJob(jobId, invoices)
```

UI: Invoices empty state + header **Create invoice** (job picker when multiple).
Tour auto-creates a draft from the latest job when entering the invoices stop.

## Arming model

While `phase === 'tour'`, the shell has `pointer-events: none`. Controls with
`data-tour-target` that match `isArmed(id)` get `.tour-armed` (`pointer-events: auto`).
`FormModal` / alerts live outside the locked shell (UiProvider) so create forms work.

## Pre-ship checklist

- [x] TourDataProvider → `useData()`, mode `live-ready`
- [x] Real Sidebar + pages, not ghost canvas
- [x] Stub routes/campaigns removed from `TOUR_STOPS`
- [x] Help → Take the tour
- [x] `createInvoiceForJob` on Desk + tour ensure-draft + Mark sent
