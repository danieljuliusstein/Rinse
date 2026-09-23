import {
  FREE_ACTIVE_JOB_LIMIT,
  hasStarterAccess,
} from "../../../packages/core/src/pricing"
import { getPocketBase } from "./pocketbase"
import { orgFilter } from "./org"
import { fetchOrgSubscription } from "./subscription"
export { FREE_ACTIVE_JOB_LIMIT }
export async function loadJobAllowance() {
  const org = await fetchOrgSubscription(true, true)
  if (hasStarterAccess(org))
    return { paid: true, count: 0, limit: FREE_ACTIVE_JOB_LIMIT }
  const jobs = await getPocketBase()
    .collection("jobs")
    .getList(1, 1, {
      filter: `${orgFilter()} && (status = "scheduled" || status = "in_progress")`,
      fields: "id",
      requestKey: null,
    })
  return { paid: false, count: jobs.totalItems, limit: FREE_ACTIVE_JOB_LIMIT }
}
export function isJobCapError(error: unknown): boolean {
  const value = error as {
    response?: { message?: unknown }
    message?: unknown
  } | null
  return [value?.response?.message, value?.message].some(
    (message) =>
      typeof message === "string" &&
      message.startsWith("Free includes 5 active jobs."),
  )
}
export const JOB_CAP_MESSAGE =
  "Free includes 5 active jobs. Complete or cancel a job, or open Settings → Account → Billing to upgrade to Pro."
