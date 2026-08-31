# Implementation Plan: CRM Money Parity (Mobile vs Desktop)

- [x] 1. Write a failing money-parity exploration test that reproduces the bug
  - Create a shared fixture with jobs (including at least one `cancelled` job with non-zero `revenue`/`tip`), invoices (paid + unpaid), overhead, and business expenses.
  - Assert that mobile P&L output (`apps/mobile-wave5-crm/src/lib/reports.ts` `computePLReportForDates`) and desktop P&L output (`apps/api/src/lib/api/aggregates.ts` `computePLReportForDates`) are EQUAL for revenue, totalExpenses, netProfit, marginPct, and jobCount on the same fixture and range.
  - Also assert `rangeFor('lifetime')` start/end bounds are equal across the two apps.
  - This test is EXPECTED TO FAIL on current code (desktop counts the cancelled job; lifetime bounds differ). The failure confirms the root cause.
  - _Requirements: 1.1, 1.2, 3.3, 4.1, 4.2_

- [x] 2. Add the canonical reports/money module to `@rinse/core`
- [x] 2.1 Create `packages/core/src/reports.ts` with shared range + P&L logic
  - Add `DateRangeKey`, `rangeFor`, `priorRangeFor`, `jobInRange`, `lifetimeActivityStart`, `reportBoundsFor`, `computePLReportForDates`, `computePLReport`, `getPLReportBundle`, and the `PLReport` interface.
  - `computePLReportForDates` MUST exclude cancelled jobs internally via `activeJobs`/`isActiveJob` from `./calculations`, so exclusion holds regardless of caller input.
  - Use the activity-clamped lifetime behavior (first job/expense day), matching current mobile `reportBoundsFor`.
  - _Requirements: 1.1, 2.1, 3.1, 3.3_
- [x] 2.2 Export the new module and add core unit tests
  - Export `./reports` from `packages/core/src/index.ts`.
  - Add `packages/core/src/reports.test.ts` covering: cancelled-job exclusion, job-based revenue formula (`revenue + tip` over non-cancelled jobs), and range boundaries for all keys incl. activity-clamped lifetime.
  - Run `packages/core` tests (Vitest) and confirm green.
  - _Requirements: 1.1, 3.1, 3.3, 4.2, 4.3_

- [x] 3. Point the desktop app at `@rinse/core` (part of the simultaneous switch)
- [x] 3.1 Replace desktop duplicate money math with core imports
  - `apps/api/src/lib/calculations.ts`: re-export `netProfit`, `totalExpenses`, `marginPct`, `isActiveJob`, `activeJobs`, `mapJobStatusForDisplay`, and formatters from `@rinse/core`; keep only genuinely api-only helpers.
  - Ensure desktop `mapJobStatusForDisplay` now handles `cancelled` (via core).
  - _Requirements: 2.1, 2.2, 2.3_
- [x] 3.2 Replace desktop P&L aggregation with core and guard orchestration
  - `apps/api/src/lib/api/aggregates.ts`: import `computePLReportForDates`, `computePLReport`, `rangeFor`, `priorRangeFor`, `jobInRange`, `PLReport` from `@rinse/core`; remove the local duplicates.
  - Make `computeDashboard`, `computeWeekDays`, `computeJobsForDate` exclude cancelled jobs via `activeJobs`.
  - `apps/api/src/lib/api/reports.ts`: re-export `DateRangeKey` from core.
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.3_
- [x] 3.3 Exclude cancelled jobs on desktop job-based revenue helpers and fetch reads
  - `apps/api/src/lib/jobs-revenue.ts` and `apps/api/src/lib/month-revenue.ts`: exclude cancelled jobs from job-based revenue aggregation.
  - `apps/api/src/lib/api/pocketbase.ts` money/dashboard/report reads (`fetchJobsRaw`, `fetchJobsExpanded` consumers): add cancelled exclusion (query filter and/or via the core aggregation guard).
  - Confirm invoice-collected revenue helpers (`apps/api/src/lib/invoice-month-revenue.ts`) remain invoice-based and are not conflated with job-based revenue.
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 4. Point the mobile app at `@rinse/core` (same change as step 3)
- [x] 4.1 Migrate mobile reports to core
  - `apps/mobile-wave5-crm/src/lib/reports.ts`: re-export `computePLReportForDates`, `computePLReport`, `rangeFor`, `priorRangeFor`, `jobInRange`, `reportBoundsFor`, `lifetimeActivityStart`, and `PLReport` from `@rinse/core`; keep mobile-only pieces (`parseReportDate`, `REPORT_FILTER_CHIPS`).
  - Keep the `listJobs` `status != "cancelled"` fetch filter as the primary mobile exclusion.
  - _Requirements: 1.1, 2.1, 3.1, 3.3_
- [x] 4.2 Align mobile job-based month revenue with core exclusion
  - Ensure mobile job-based revenue helpers (`apps/mobile-wave5-crm/src/lib/jobs-revenue.ts`) exclude cancelled jobs, and that invoice-collected month revenue stays invoice-based.
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 5. Make the exploration test pass and add the full parity suite
- [x] 5.1 Re-run the step-1 test against migrated code
  - With both apps now on core, the step-1 parity test MUST pass (equal totals; equal lifetime bounds).
  - _Requirements: 1.1, 1.2, 3.3, 4.1_
- [x] 5.2 Complete required parity coverage
  - Ensure the suite covers all three areas: cancelled-job exclusion, job-based vs invoice-collected revenue, and date-range boundary equality (all range keys). If any area is missing, the suite is incomplete and must not be treated as passing.
  - Add desktop tests near `apps/api/src/lib/calculations.test.ts` asserting desktop consumes core and excludes cancelled jobs.
  - Add a mobile test (mobile uses `tsx`) asserting mobile aggregation equals the core baseline on the shared fixture.
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Verify builds and full test runs for all three packages
  - Run type-check/build and tests for `packages/core`, `apps/api` (`npm run test`), and `apps/mobile-wave5-crm` (`npm run typecheck` + the new test).
  - Confirm no remaining local money-math duplicates and no mixed state (both apps import from `@rinse/core`).
  - _Requirements: 2.1, 2.2, 4.1, 4.3_
