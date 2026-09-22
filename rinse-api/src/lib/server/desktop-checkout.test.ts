import { afterEach, expect, it, vi } from "vitest"
import { checkoutReturnUrls } from "./desktop-checkout"
afterEach(() => vi.unstubAllEnvs())
it("keeps existing checkout callers on their existing return page", () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://api.rinse.test")
  expect(checkoutReturnUrls(new Request("https://api.test"))).toEqual({
    success_url: "https://api.rinse.test/billing/return?result=success",
    cancel_url: "https://api.rinse.test/billing/return?result=cancel",
  })
})
it("uses the configured desktop origin, never a caller-controlled redirect", () => {
  vi.stubEnv("DESKTOP_APP_ORIGIN", "https://desk.rinse.test")
  expect(
    checkoutReturnUrls(
      new Request("https://evil.test/?return=https://evil.test"),
      "desktop_onboarding",
    ).success_url,
  ).toBe("https://desk.rinse.test/?desktop_billing=success")
})
it.each([
  "https://user:password@desk.test",
  "https://desk.test/other",
  "http://desk.test",
  "https://desk.test/?redirect=evil",
])("rejects unsafe configured origins: %s", (origin) => {
  vi.stubEnv("DESKTOP_APP_ORIGIN", origin)
  expect(() =>
    checkoutReturnUrls(new Request("https://api.test"), "desktop_onboarding"),
  ).toThrow()
})
