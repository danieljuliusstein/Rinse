import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ org: "a", get: vi.fn() }))
vi.mock("./org", () => ({ requireOrganizationId: () => mocks.org }))
vi.mock("./pocketbase", () => ({
  getPocketBase: () => ({ collection: () => ({ getOne: mocks.get }) }),
}))
vi.mock("./app-api", () => ({ AppApiError: Error }))
import { clearOrgSubscriptionCache, fetchOrgSubscription } from "./subscription"
beforeEach(() => {
  clearOrgSubscriptionCache()
  mocks.org = "a"
  mocks.get.mockReset()
})
it("never shares entitlement cache across organizations", async () => {
  mocks.get
    .mockResolvedValueOnce({ plan: "starter", subscription_status: "active" })
    .mockResolvedValueOnce({ plan: "free" })
  expect((await fetchOrgSubscription())?.plan).toBe("starter")
  mocks.org = "b"
  expect((await fetchOrgSubscription())?.plan).toBe("free")
  expect(mocks.get).toHaveBeenCalledTimes(2)
})
it("strict billing confirmation does not fall back to stale access", async () => {
  mocks.get
    .mockResolvedValueOnce({ plan: "starter" })
    .mockRejectedValue(new Error("offline"))
  await fetchOrgSubscription()
  await expect(fetchOrgSubscription(true, true)).rejects.toThrow("offline")
  expect(await fetchOrgSubscription(true)).toBeNull()
})
