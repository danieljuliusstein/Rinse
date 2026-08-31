# Requirements: CRM Money Parity (Mobile vs Desktop)

## Introduction

The mobile CRM (`apps/mobile-wave5-crm`) and the desktop CRM (`apps/api`)
display different values for money-related figures (revenue, net profit, P&L,
dashboard KPIs) computed from the same underlying data. This spec defines the
behavior required for both apps to report identical money numbers for the same
organization, date range, and data set.

Root cause (verified during investigation):

1. Duplicated, drifted money logic. Both apps maintain their own copies of the
   money math instead of sharing one source of truth. `packages/core/src/calculations.ts`
   defines the canonical `netProfit`, `totalExpenses`, `marginPct`, and the
   `isActiveJob` / `activeJobs` helpers (which exclude `cancelled` jobs).
   `apps/api/src/lib/calculations.ts` is a near-duplicate that is missing
   `isActiveJob` / `activeJobs` and whose `mapJobStatusForDisplay` has no
   `cancelled` branch. P&L/report math is duplicated in
   `apps/mobile-wave5-crm/src/lib/reports.ts` and `apps/api/src/lib/api/aggregates.ts`.

2. Cancelled (soft-deleted) jobs counted inconsistently. Jobs are soft-cancelled
   (`status = 'cancelled'`) rather than hard-deleted. Mobile excludes cancelled
   jobs at the data layer (`listJobs` / `getClientJobs` query with
   `filter: 'status != "cancelled"'` and wrap results in `activeJobs(...)`).
   Desktop aggregation (`computePLReportForDates`, `computeDashboard`,
   `jobs-revenue.ts`, `month-revenue.ts`, `home-dashboard.ts`) filters only by
   date range and includes cancelled jobs in revenue/profit sums. Net effect:
   for the same data, desktop money totals include cancelled-job revenue that
   mobile omits, producing two different numbers.

3. Two different revenue concepts coexist. Job-based revenue (`revenue + tip`
   summed over jobs) vs. invoice-collected revenue (paid `invoice.total`). Each
   app uses these in different surfaces, and the intended meaning per surface is
   not enforced consistently.

Agreed correct behavior: align every money surface across both apps. Money math
should be sourced from the shared `@rinse/core` package as the single source of
truth, and both apps must exclude cancelled jobs consistently.

## Requirements

### Requirement 1: Cancelled jobs excluded from all money calculations

**User Story:** As an operator, I want cancelled appointments excluded from all
revenue, profit, and P&L figures, so cancelled work never inflates my numbers.

#### Acceptance Criteria
1. WHEN any revenue, net-profit, expense, margin, or job-count figure is computed from jobs THEN the system SHALL exclude jobs with `status = 'cancelled'`.
2. WHEN the desktop CRM computes P&L, dashboard KPIs, job-based month revenue, or jobs-revenue aggregates THEN it SHALL apply the same cancelled-job exclusion the mobile CRM applies.
3. WHEN a job is cancelled in either app THEN the affected money totals SHALL be recalculated and updated on refresh, and both apps SHALL reflect the same updated totals.

### Requirement 2: Single shared source of truth for money math

**User Story:** As a developer, I want one canonical implementation of the money
math, so mobile and desktop cannot drift apart again.

#### Acceptance Criteria
1. WHEN money math is needed (netProfit, totalExpenses, marginPct, P&L aggregation, active-job filtering) THEN both apps SHALL consume it from `@rinse/core` rather than local duplicates, and both apps SHALL switch to `@rinse/core` in the same change with no mixed state where one app uses core while the other keeps a local implementation.
2. WHEN the desktop `apps/api/src/lib/calculations.ts` diverges from `packages/core/src/calculations.ts` THEN the divergence SHALL be removed (desktop re-exports or imports the core implementation).
3. WHEN `mapJobStatusForDisplay` is used in either app THEN it SHALL handle the `cancelled` status identically.

### Requirement 3: Consistent revenue definition per surface

**User Story:** As an operator, I want the same labeled figure (e.g., "Revenue"
for a period) to mean the same thing on mobile and desktop.

#### Acceptance Criteria
1. WHEN job-based revenue for a period is computed THEN both apps SHALL always compute it as the sum of `revenue + tip` over non-cancelled jobs whose date falls in the period, with no conditional variations.
2. WHEN a surface displays invoice-collected revenue THEN both apps SHALL compute it as the sum of paid invoice totals for the period, and SHALL NOT mix this with job-based revenue under the same label.
3. WHEN date-range boundaries are applied for the same range key (this_week, this_month, last_month, this_year, lifetime) THEN both apps SHALL produce the same start/end bounds.

### Requirement 4: Verifiable parity

**User Story:** As a developer, I want automated confirmation that both apps
produce the same money numbers, so regressions are caught.

#### Acceptance Criteria
1. WHEN a shared fixture data set is run through the mobile and desktop money computations THEN the resulting revenue, expenses, net profit, margin, and job count SHALL be exactly equal at all times, with no tolerance for temporary differences.
2. WHEN the fixture includes cancelled jobs THEN their amounts SHALL NOT appear in either app's totals.
3. WHEN the parity test suite runs THEN it SHALL include coverage for cancelled-job exclusion, job-based vs. invoice-collected revenue, and date-range boundary equality, and IF any of these coverage areas is missing THEN the suite SHALL be treated as incomplete and SHALL NOT be considered passing.

## Out of Scope
- Redesigning the reports/dashboard UI.
- Changing how jobs are cancelled or soft-deleted.
- Non-money data parity (e.g., client lists, scheduling display).

## Constraints
- Operator features ship in `apps/mobile-wave5-crm` only; `apps/api` is the API + customer book/portal/admin. Changes to `apps/api` here are limited to correcting its money computations to match the shared source of truth, not building operator UI.
- Follow Expo v57 docs for any mobile-side changes.
