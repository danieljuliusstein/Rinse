import { appApiJson } from "./app-api"
export type BusinessBasics = {
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  timezone: string
}
export type DesktopSetup = {
  enabled: boolean
  eligible?: boolean
  planChoice?: string
  businessSaved?: boolean
  prepared?: boolean
  completedAt?: string
  business?: BusinessBasics
  services?: { id: string; name: string; price: number }[]
}
export const SETUP_STEPS = [
  "Your plan",
  "Business basics",
  "First job",
  "Ready to go",
] as const
export function setupStep(state: DesktopSetup): number {
  if (!state.planChoice) return 0
  if (!state.businessSaved) return 1
  if (!state.prepared) return 2
  return 3
}
export function requiresDesktopSetup(state: DesktopSetup): boolean {
  return state.enabled && !!state.eligible && !state.completedAt
}
export function loadDesktopSetup() {
  return appApiJson<DesktopSetup>("/api/desktop/onboarding")
}
export function saveDesktopSetup(action: Record<string, unknown>) {
  return appApiJson<DesktopSetup>("/api/desktop/onboarding", {
    method: "POST",
    body: JSON.stringify(action),
  })
}
export function requestDesktopSetup() {
  window.dispatchEvent(new Event("desktop-setup-open"))
}
