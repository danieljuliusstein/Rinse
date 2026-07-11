import { ClientResponseError } from 'pocketbase'
import { dispatchPremiumRequired } from './premium-events'

const SUBSCRIPTION_MSG = 'Active subscription required'

export function isSubscriptionGuardError(err: unknown): boolean {
  if (!(err instanceof ClientResponseError)) return false
  if (err.status !== 403) return false
  const msg = `${err.message} ${String((err.response as { message?: string } | undefined)?.message ?? '')}`.toLowerCase()
  return msg.includes('active subscription required') || msg.includes('organization required')
}

export function formatPocketBaseError(err: unknown, fallback = 'Request failed'): string {
  if (isSubscriptionGuardError(err)) {
    dispatchPremiumRequired({ mode: 'lapsed' })
    return SUBSCRIPTION_MSG
  }

  if (err instanceof ClientResponseError) {
    const fieldErrors: string[] = []
    const data = err.response as { data?: Record<string, { message?: string; code?: string }> } | undefined
    const fields = data?.data
    if (fields && typeof fields === 'object') {
      for (const [key, value] of Object.entries(fields)) {
        if (value?.message) fieldErrors.push(`${key}: ${value.message}`)
      }
    }

    if (fieldErrors.length > 0) return fieldErrors.join('\n')

    if (err.status === 403) {
      return err.message || 'You do not have permission to save this record. Try signing out and back in.'
    }

    if (err.status === 400 && err.message === 'Failed to create record.') {
      return 'Could not save — check you are signed in with an operator account linked to your business.'
    }

    return err.message || fallback
  }

  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function throwPocketBaseError(err: unknown, fallback?: string): never {
  throw new Error(formatPocketBaseError(err, fallback))
}
