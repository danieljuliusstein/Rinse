import { beforeEach, expect, it, vi } from "vitest"
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  billing: vi.fn(),
  retrieveSession: vi.fn(),
  createSession: vi.fn(),
  price: vi.fn(),
  customer: vi.fn(),
  org: vi.fn(),
}))
vi.mock("./request-auth", () => ({ authenticateRequestUser: m.auth }))
vi.mock("./billing-store", () => ({ billingCommand: m.billing }))
vi.mock("./pocketbase-admin", () => ({
  authenticateServerAdmin: async () => ({
    collection: () => ({ getOne: m.org }),
  }),
}))
vi.mock("./stripe", () => ({
  stripeAppOrigin: () => "https://api.test",
  getStripe: () => ({
    checkout: {
      sessions: { retrieve: m.retrieveSession, create: m.createSession },
    },
    prices: { retrieve: m.price },
    customers: { create: m.customer },
  }),
}))
import { POST } from "../../app/api/billing/checkout/route"
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("DESKTOP_APP_ORIGIN", "https://desk.test")
  vi.stubEnv("STRIPE_PRICE_STARTER_MONTHLY", "price_starter")
  vi.stubEnv("STRIPE_PRICE_EARLY_MONTHLY", "price_early")
  m.auth.mockResolvedValue({ organizationId: "org1" })
  m.billing.mockResolvedValue({
    plan: "starter",
    generation: 1,
    expires_at: Date.now() + 2700000,
    return_context: "desktop_onboarding",
  })
  m.org.mockResolvedValue({ stripe_customer_id: "cus_test" })
  m.price.mockImplementation(async (id: string) => ({
    active: true,
    currency: "usd",
    unit_amount: id === "price_early" ? 300 : 600,
    recurring: { interval: "month", interval_count: 1 },
  }))
  m.createSession.mockResolvedValue({
    id: "cs_test",
    url: "https://checkout.test",
  })
})
const req = (body?: unknown) =>
  new Request("https://api.test/api/billing/checkout", {
    method: "POST",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
it("uses desktop return only for the reservation context", async () => {
  const before = Math.floor(Date.now() / 1000)
  expect((await POST(req({ context: "desktop_onboarding" }))).status).toBe(200)
  expect(m.billing.mock.calls[0][0]).toMatchObject({
    orgId: "org1",
    returnContext: "desktop_onboarding",
  })
  const created = m.createSession.mock.calls[0][0]
  expect(created).toMatchObject({
    success_url: "https://desk.test/?desktop_billing=success",
    cancel_url: "https://desk.test/?desktop_billing=cancel",
  })
  expect(created.expires_at).toBeGreaterThanOrEqual(before + 31 * 60)
})
it("reuses an already-open session instead of issuing different idempotent parameters", async () => {
  m.billing.mockResolvedValue({
    session_id: "cs_existing",
    plan: "starter",
    generation: 1,
    return_context: "",
  })
  m.retrieveSession.mockResolvedValue({
    status: "open",
    url: "https://checkout.test/existing",
  })
  expect(
    await (await POST(req({ context: "desktop_onboarding" }))).json(),
  ).toMatchObject({ url: "https://checkout.test/existing" })
  expect(m.createSession).not.toHaveBeenCalled()
})
it("rotates generation when a pending seat has no bound session", async () => {
  m.billing
    .mockResolvedValueOnce({
      plan: "early",
      generation: 2,
      expires_at: Date.now() + 2700000,
      return_context: "desktop_onboarding",
    })
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({
      plan: "early",
      generation: 3,
      expires_at: Date.now() + 2700000,
      return_context: "desktop_onboarding",
    })
    .mockResolvedValueOnce({ ok: true })
  expect((await POST(req({ context: "desktop_onboarding" }))).status).toBe(200)
  expect(m.billing.mock.calls.map((c) => c[0].action)).toEqual([
    "reserve",
    "release",
    "reserve",
    "bind",
  ])
  expect(m.createSession.mock.calls[0][1]).toMatchObject({
    idempotencyKey: expect.stringMatching(/^checkout:rinse:org1:3:/),
  })
})
it("keeps empty-body callers on the original redirect contract", async () => {
  m.billing.mockResolvedValue({
    plan: "starter",
    generation: 1,
    expires_at: Date.now() + 2700000,
  })
  expect((await POST(req())).status).toBe(200)
  expect(m.createSession.mock.calls[0][0]).toMatchObject({
    success_url: "https://api.test/billing/return?result=success",
  })
})
it("rejects unsupported contexts before reserving anything", async () => {
  expect((await POST(req({ context: "https://evil.test" }))).status).toBe(400)
  expect(m.billing).not.toHaveBeenCalled()
})
