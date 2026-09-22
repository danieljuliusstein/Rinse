import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ subscription: vi.fn(), list: vi.fn() }))
vi.mock("./subscription", () => ({ fetchOrgSubscription: mocks.subscription }))
vi.mock("./pocketbase", () => ({
  getPocketBase: () => ({ collection: () => ({ getList: mocks.list }) }),
}))
vi.mock("./org", () => ({ orgFilter: () => 'organization_id = "org1"' }))
import { isJobCapError, loadJobAllowance } from "./job-allowance"
beforeEach(() => {
  vi.clearAllMocks()
})
describe("job allowance", () => {
  it("uses an organization-wide count instead of calendar records", async () => {
    mocks.subscription.mockResolvedValue({
      plan: "free",
      founding_member: false,
      subscription_status: "none",
    })
    mocks.list.mockResolvedValue({ totalItems: 5 })
    expect(await loadJobAllowance()).toEqual({
      paid: false,
      count: 5,
      limit: 5,
    })
    expect(mocks.list.mock.calls[0][2].filter).toBe(
      'organization_id = "org1" && (status = "scheduled" || status = "in_progress")',
    )
  })
  it("bypasses the count for verified paid accounts", async () => {
    mocks.subscription.mockResolvedValue({
      plan: "starter",
      subscription_status: "active",
      current_period_end: "2035-01-01",
    })
    expect((await loadJobAllowance()).paid).toBe(true)
    expect(mocks.list).not.toHaveBeenCalled()
  })
  it("propagates failed reads instead of showing a false zero", async () => {
    mocks.subscription.mockRejectedValue(new Error("offline"))
    await expect(loadJobAllowance()).rejects.toThrow("offline")
  })
  it("does not mistake arbitrary access errors for a cap", () => {
    expect(
      isJobCapError({
        response: {
          message:
            "Free includes 5 active jobs. Complete or cancel a job, or upgrade to Starter.",
        },
      }),
    ).toBe(true)
    expect(isJobCapError({ status: 403, message: "Not allowed" })).toBe(false)
  })
})
