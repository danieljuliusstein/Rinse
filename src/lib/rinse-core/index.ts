/**
 * Desk-local mirror of `@rinse/core` P&L helpers.
 * Keep in sync with Detailing `packages/core` (reports / calculations / money types).
 */
export {
  computePLReport,
  computePLReportForDates,
  getPLReportBundle,
  jobInRange,
  lifetimeActivityStart,
  priorRangeFor,
  rangeFor,
  reportBoundsFor,
  type DateRangeKey,
  type PLReport,
} from './reports'
export { activeJobs, netProfit, totalExpenses } from './calculations'
export type {
  BusinessExpense,
  ExpenseLine,
  Job,
  LocationType,
  OverheadExpense,
  VehicleType,
} from './types'
