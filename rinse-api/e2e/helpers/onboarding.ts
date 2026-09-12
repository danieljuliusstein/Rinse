import type { APIRequestContext, BrowserContext } from '@playwright/test'
import type { PocketBaseSession } from './session'

function pbUrl(): string {
  return (process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '')
}

function escapeFilter(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export interface OnboardingSnapshot {
  settingsId: string
  onboarding_completed_at: string | null
  onboarding_step: number | null
}

export async function readOnboardingSnapshot(
  request: APIRequestContext,
  session: PocketBaseSession,
): Promise<OnboardingSnapshot | null> {
  const orgId = session.record.organization_id
  if (typeof orgId !== 'string' || !orgId) return null

  const filter = encodeURIComponent(`organization_id = "${escapeFilter(orgId)}"`)
  const res = await request.get(`${pbUrl()}/api/collections/app_settings/records?filter=${filter}&perPage=1`, {
    headers: { Authorization: session.token },
  })
  if (!res.ok()) return null

  const data = (await res.json()) as { items?: Array<Record<string, unknown>> }
  const row = data.items?.[0]
  if (!row || typeof row.id !== 'string') return null

  return {
    settingsId: row.id,
    onboarding_completed_at:
      typeof row.onboarding_completed_at === 'string' ? row.onboarding_completed_at.slice(0, 10) : null,
    onboarding_step: typeof row.onboarding_step === 'number' ? row.onboarding_step : null,
  }
}

export async function patchOnboardingState(
  request: APIRequestContext,
  session: PocketBaseSession,
  settingsId: string,
  patch: { onboarding_completed_at?: string | null; onboarding_step?: number },
): Promise<void> {
  const res = await request.patch(`${pbUrl()}/api/collections/app_settings/records/${settingsId}`, {
    headers: { Authorization: session.token, 'Content-Type': 'application/json' },
    data: patch,
  })
  if (!res.ok()) {
    throw new Error(`Failed to patch onboarding (${res.status()}): ${await res.text()}`)
  }
}

export async function installOnboardingSession(
  context: BrowserContext,
  session: PocketBaseSession,
): Promise<void> {
  await context.addInitScript(({ token, record }) => {
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token, record }))
    sessionStorage.setItem('pb_auth_active', '1')

    const settingsKey = 'detailing_settings_v1'
    const raw = localStorage.getItem(settingsKey)
    const settings = raw ? JSON.parse(raw) : {}
    delete settings.onboarding_completed_at
    settings.onboarding_step = 1
    if (!settings.business_phone) settings.business_phone = '(404) 555-0142'
    if (!settings.business_name) settings.business_name = 'Summit Mobile Detail'
    localStorage.setItem(settingsKey, JSON.stringify(settings))
  }, session)
}

export async function prepareNeedsOnboarding(
  request: APIRequestContext,
  session: PocketBaseSession,
): Promise<OnboardingSnapshot> {
  const snapshot = await readOnboardingSnapshot(request, session)
  if (!snapshot) throw new Error('Could not read app_settings for E2E org')

  await patchOnboardingState(request, session, snapshot.settingsId, {
    onboarding_completed_at: '',
    onboarding_step: 1,
  })

  return snapshot
}

export async function restoreOnboardingSnapshot(
  request: APIRequestContext,
  session: PocketBaseSession,
  snapshot: OnboardingSnapshot,
): Promise<void> {
  await patchOnboardingState(request, session, snapshot.settingsId, {
    onboarding_completed_at: snapshot.onboarding_completed_at || '2026-07-01',
    onboarding_step: snapshot.onboarding_step && snapshot.onboarding_step > 0 ? snapshot.onboarding_step : 4,
  })
}
