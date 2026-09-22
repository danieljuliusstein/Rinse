import { describe, expect, it, vi } from "vitest"
vi.mock("./app-api", () => ({ appApiJson: vi.fn() }))
import { setupStep, requiresDesktopSetup } from "./desktop-onboarding"
describe("desktop setup gate", () => {
  it("requires new organizations, exempts existing and completed ones", () => {
    expect(requiresDesktopSetup({ enabled: true, eligible: true })).toBe(true)
    expect(requiresDesktopSetup({ enabled: true, eligible: false })).toBe(false)
    expect(requiresDesktopSetup({ enabled: false, eligible: true })).toBe(false)
    expect(
      requiresDesktopSetup({
        enabled: true,
        eligible: true,
        completedAt: "2026-09-22",
      }),
    ).toBe(false)
  })
  it("resumes the earliest incomplete prerequisite", () => {
    expect(setupStep({ enabled: true, businessSaved: true })).toBe(0)
    expect(setupStep({ enabled: true, planChoice: "free" })).toBe(1)
    expect(
      setupStep({ enabled: true, planChoice: "paid", businessSaved: true }),
    ).toBe(2)
    expect(
      setupStep({
        enabled: true,
        planChoice: "free",
        businessSaved: true,
        prepared: true,
      }),
    ).toBe(3)
  })
})
