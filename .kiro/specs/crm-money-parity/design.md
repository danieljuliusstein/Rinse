# Design: CRM Money Parity (Mobile vs Desktop)

## Overview

Both the mobile CRM (`apps/mobile-wave5-crm`) and the desktop CRM (`apps/api`)
compute money figures from PocketBase `jobs` and `invoices`, but each keeps its
own copy of the math. They have drifted, and cancelled (soft-deleted) jobs are
excluded on mobile but included on desktop. This design makes `@rinse/core` the
single source of truth for money math and applies a consistent cancelled-job
exclusion across both apps.

Both apps already depend on the shared package via
`"@rinse/core": "file:../../packages/core"`, so no new dependency wiring is
needed.

## Current State (verified)

### Shared core (`packages/core/src/calculations.ts`)
- Canonical `netProfit`, `totalExpenses`, `marginPct`.
- `isActiveJob(job)` => `job.status !== 'cancelled'` and `activeJobs(jobs)`.
- `mapJobStatusForDisplay` handles `cancelled`.

### Mobile (`apps/mobile-wave5-crm`)
- `src/lib/api.ts` `listJobs` / `getClientJobs`: PocketBase query uses
  `filter: 'status != "cancelled"'` AND wraps results in `activeJobs(...)`
  (belt-and-suspenders). Cancelled jobs never reach the money math.
- `src/lib/reports.ts` `computePLReportForDates` filters only by date range
  (relies on the fetch layer already excluding cancelled).
- `src/lib/reports.ts` `rangeFor('lifetime')` returns `[2000-01-01, now]`, but
  `reportBoundsFor` / `lifetimeActivityStart` clamp lifetime to the first
  job/expense day.

### Desktop (`apps/api`)
- `src/lib/calculations.ts` is a near-duplicate of core, MISSING
  `isActiveJob` / `activeJobs`, and its `mapJobStatusForDisplay` has NO
  `cancelled` branch.
- `src/lib/api/aggregates.ts` `computePLReportForDates`, `computeDashboard`,
  `computeWeekDays`, `computeJobsForDate` filter only by date range; cancelled
  jobs are summed into revenue/profit/counts.
- `src/lib/api/pocketbase.ts` `fetchJobsRaw` / `fetchJobsExpanded` and
  `src/lib/api/local.ts` `getJobs` / `getJobsRaw` fetch ALL jobs with no
  cancelled filter.
- `src/lib/api/aggregates.ts` `rangeFor('lifetime')` returns `[2000-01-01, now]`
  with no activity clamping (differs from mobile lifetime behavior).
- `src/lib/jobs-revenue.ts` and `src/lib/month-revenue.ts` aggregate
  `revenue + tip` with no cancelled filter.

## Root Cause Summary

1. Duplicated money math (two copies of `calculations.ts`, two copies of the P&L
   aggregation) that have drifted.
2. Cancelled-job exclusion exists only on mobile.
3. Lifetime range boundary differs (activity-clamped on mobile, fixed
   2000-01-01 on desktop).

## Design Goals

- One canonical implementation of money math in `@rinse/core`.
- Cancelled jobs excluded consistently in both apps, at a single well-defined
  point per app (defense-in-depth: fetch layer + aggregation guard).
- Identical date-range boundaries for the same range key, including lifetime.
- A cross-app parity test proving equal outputs on shared fixtures.

## Approach

### 1. Centralize money math in `@rinse/core`

Move the canonical P&L aggregation and range logic into core so both apps import
it rather than maintaining copies.

- Add to `@rinse/core` (new module, e.g. `packages/core/src/reports.ts`):
  - `DateRangeKey`
  - `rangeFor`, `priorRangeFor`
  - `jobInRange`
  - `lifetimeActivityStart`, `reportBoundsFor` (activity-clamped lifetime)
  - `computePLReportForDates`, `computePLReport`, `getPLReportBundle`
  - `PLReport` interface
- These functions MUST call `activeJobs(...)` (or `isActiveJob`) internally so
  cancelled jobs are excluded regardless of what the caller passes in. This is
  the single authoritative exclusion point for aggregation.
- Export the new module from `packages/core/src/index.ts`.

### 2. Remove desktop's duplicate calculations

- `apps/api/src/lib/calculations.ts`: re-export the money functions from
  `@rinse/core` (`netProfit`, `totalExpenses`, `marginPct`, `isActiveJob`,
  `activeJobs`, `mapJobStatusForDisplay`, formatters) instead of redefining them.
  Any api-only helpers (e.g. `formatScheduledLabel` if it must stay local) are
  kept, but the money math and `mapJobStatusForDisplay` come from core.
- `apps/api/src/lib/api/aggregates.ts`: replace its local
  `computePLReportForDates` / `computePLReport` / `rangeFor` / `priorRangeFor` /
  `jobInRange` with imports from `@rinse/core`. Keep the desktop-only
  orchestration (`computeDashboard`, `computeWeekDays`, `computeJobsForDate`,
  CSV helpers), but make them filter cancelled jobs via `activeJobs(...)`.
- `apps/api/src/lib/api/reports.ts`: keep as a thin wrapper; its
  `DateRangeKey` re-exports the core type.

### 3. Migrate mobile to core aggregation

- `apps/mobile-wave5-crm/src/lib/reports.ts`: re-export
  `computePLReportForDates`, `computePLReport`, `rangeFor`, `priorRangeFor`,
  `jobInRange`, `reportBoundsFor`, `lifetimeActivityStart`, and `PLReport` from
  `@rinse/core`. Preserve mobile-only bits (e.g. `parseReportDate`,
  `REPORT_FILTER_CHIPS` i18n keys) locally.
- Mobile's `listJobs` cancelled filter stays as the primary fetch-layer
  exclusion. Core aggregation adds a second guard.

### 4. Exclude cancelled jobs on desktop fetch (defense-in-depth)

- `apps/api/src/lib/api/pocketbase.ts`: the money paths use `fetchJobsRaw` and
  `fetchJobsExpanded`. Add a cancelled filter for money/dashboard/report reads.
  Two options are acceptable; the design uses the aggregation-layer guard as the
  authoritative exclusion so results are correct even if a raw fetch is reused
  for a non-money purpose. Optionally also add `status != "cancelled"` to the
  PocketBase query for the money-specific reads to reduce payload.
- `apps/api/src/lib/api/local.ts`: same guard applies through the shared
  aggregation functions.

Rationale: putting the authoritative exclusion inside the core aggregation
functions guarantees Requirement 1 holds no matter which fetch path feeds them,
while the fetch-layer filter is an optimization and consistency aid.

### 5. Unify revenue definitions per surface

- Job-based revenue = sum of `revenue + tip` over non-cancelled jobs in range
  (used by P&L, dashboard revenue KPIs, jobs-revenue, job-based month carousel).
- Invoice-collected revenue = sum of paid `invoice.total` in range (used by the
  invoice month carousel). Keep these labeled distinctly; do not mix.
- Ensure both apps' month-revenue helpers exclude cancelled jobs for the
  job-based variant.

## Simultaneous switch

Per Requirement 2.1, the change lands as one unit: core gains the shared module,
and BOTH apps are updated to import it in the same change. No intermediate state
where one app uses core and the other keeps a local implementation.

## Data / Type Considerations

- `JobStatus` already includes `'cancelled'` in `@rinse/core` types; both apps
  import job types from core, so no type changes are required.
- Desktop and mobile use structurally identical `PLReport` shapes today; moving
  to a single core `PLReport` type removes the duplication.

## Testing Strategy

Add a parity test suite (shared fixtures) that runs the same job/invoice data
through the core money functions and asserts equality of revenue, expenses,
net profit, margin, and job count.

Coverage required before the suite is considered passing (Requirement 4.3):
1. Cancelled-job exclusion: fixtures include cancelled jobs; their amounts must
   not appear in any total.
2. Job-based vs invoice-collected revenue: assert each is computed from its own
   source and not conflated.
3. Date-range boundary equality: for each range key (this_week, this_month,
   last_month, this_year, lifetime) assert identical start/end bounds, including
   activity-clamped lifetime.

Test placement:
- Core unit tests in `packages/core` (Vitest) for the shared functions.
- Desktop: extend existing Vitest tests (e.g. alongside
  `apps/api/src/lib/calculations.test.ts` / a new `reports` test) to assert the
  desktop consumes core and excludes cancelled jobs.
- Mobile: add a Vitest/tsx-run test (mobile uses `tsx` scripts) asserting mobile
  aggregation matches core outputs on the shared fixture.

Parity is asserted by feeding one canonical fixture into both apps' entry points
for money math and comparing to the core baseline; results must be exactly equal
(Requirement 4.1).

## Risks & Mitigations

- Risk: desktop had subtly different behavior somewhere that depended on counting
  cancelled jobs. Mitigation: cancelled jobs are soft-deleted (schedule removals),
  so excluding them from money is the intended behavior; parity tests lock it in.
- Risk: lifetime boundary change alters desktop historical totals. Mitigation:
  this is the correction that makes desktop match mobile; call it out in the PR.
- Risk: circular import when desktop `calculations.ts` re-exports core.
  Mitigation: import directly from `@rinse/core` package entry, not relative
  cross-package paths.

## Out of Scope

- Reports/dashboard UI redesign.
- Changing how jobs are cancelled/soft-deleted.
- Non-money data parity.
