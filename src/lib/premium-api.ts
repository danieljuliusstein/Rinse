export const PREMIUM_REQUIRED_CODE = 'premium_required'
export const PREMIUM_REQUIRED_EVENT = 'rinse-premium-required'

export function dispatchPremiumRequired(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PREMIUM_REQUIRED_EVENT))
}

/** Returns true when the response was a premium paywall (402). */
export function isPremiumRequiredResponse(status: number, body?: { code?: string }): boolean {
  return status === 402 && body?.code === PREMIUM_REQUIRED_CODE
}

export async function handleApiResponsePremiumGate(res: Response): Promise<boolean> {
  if (res.status !== 402) return false
  const body = (await res.clone().json().catch(() => ({}))) as { code?: string }
  if (!isPremiumRequiredResponse(res.status, body)) return false
  dispatchPremiumRequired()
  return true
}

export const PREMIUM_REQUIRED_MESSAGE = 'Active subscription required'

export function isPremiumRequiredPocketBaseError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { status?: number; message?: string; response?: { message?: string } }
  if (e.status !== 403) return false
  const msg = `${e.message ?? ''} ${e.response?.message ?? ''}`.toLowerCase()
  return msg.includes('active subscription required')
}

/** Re-throw after opening paywall when PocketBase blocks a lapsed org create. */
export function rethrowPremiumPocketBaseError(err: unknown): never {
  if (isPremiumRequiredPocketBaseError(err)) {
    dispatchPremiumRequired()
    throw new Error(PREMIUM_REQUIRED_MESSAGE)
  }
  throw err
}
