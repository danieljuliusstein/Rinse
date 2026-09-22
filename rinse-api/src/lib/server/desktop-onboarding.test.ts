import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), send: vi.fn() }))
vi.mock("./request-auth", () => ({ authenticateRequestUser: mocks.auth }))
vi.mock("./pocketbase-admin", () => ({
  authenticateServerAdmin: async () => ({ send: mocks.send }),
}))
import { GET, POST } from "../../app/api/desktop/onboarding/route"
import { desktopOnboardingAction } from "./desktop-onboarding"
beforeEach(() => {
  vi.stubEnv("DESKTOP_ONBOARDING_ENABLED", "true")
  mocks.auth.mockReset()
  mocks.send.mockReset()
  mocks.auth.mockResolvedValue({
    organizationId: "trusted-org",
    verified: true,
  })
})
describe("desktop onboarding endpoint", () => {
  it("requires authenticated, verified accounts", async () => {
    mocks.auth.mockResolvedValueOnce(null)
    expect(
      (await GET(new Request("https://api.test/api/desktop/onboarding")))
        .status,
    ).toBe(401)
    mocks.auth.mockResolvedValueOnce({ verified: false })
    expect(
      (await GET(new Request("https://api.test/api/desktop/onboarding")))
        .status,
    ).toBe(403)
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("returns disabled without touching persistence during rollout rollback", async () => {
    vi.stubEnv("DESKTOP_ONBOARDING_ENABLED", "false")
    const result = await GET(
      new Request("https://api.test/api/desktop/onboarding"),
    )
    expect(await result.json()).toEqual({ enabled: false })
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it("derives tenant identity from auth and rejects injected tenant fields", async () => {
    const req = (body: unknown) =>
      new Request("https://api.test/api/desktop/onboarding", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { origin: "https://desk.test" },
      })
    expect(
      (await POST(req({ action: "complete", orgId: "victim" }))).status,
    ).toBe(400)
    mocks.send.mockResolvedValue({ eligible: true })
    const result = await POST(req({ action: "plan", choice: "free" }))
    expect(result.status).toBe(200)
    expect(mocks.send).toHaveBeenCalledWith("/api/rinse/desktop-onboarding", {
      method: "POST",
      body: { action: "plan", choice: "free", orgId: "trusted-org" },
    })
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://desk.test",
    )
    expect(result.headers.get("Cache-Control")).toBe("no-store")
  })
  it("does not turn persistence failure into completed/default state", async () => {
    mocks.send.mockRejectedValue(new Error("offline"))
    expect(
      (await GET(new Request("https://api.test/api/desktop/onboarding")))
        .status,
    ).toBe(503)
  })
  it("validates business and service inputs", () => {
    expect(
      desktopOnboardingAction.safeParse({
        action: "business",
        business: {
          business_name: "",
          business_phone: "",
          business_email: "",
          business_address: "",
          timezone: "invalid",
        },
      }).success,
    ).toBe(false)
    expect(
      desktopOnboardingAction.safeParse({
        action: "prepare",
        service: { name: "Detail", price: -1 },
      }).success,
    ).toBe(false)
    expect(
      desktopOnboardingAction.safeParse({ action: "prepare" }).success,
    ).toBe(true)
  })
})
