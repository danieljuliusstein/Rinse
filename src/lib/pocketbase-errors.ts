import { ClientResponseError } from 'pocketbase'
import { dispatchPremiumRequired } from './premium-events'

const SUBSCRIPTION_MSG = 'Active subscription required'
const VAULT_MSG = 'Read-only vault — resubscribe to make changes'

export function isSubscriptionGuardError(err: unknown): boolean {
  if (!(err instanceof ClientResponseError)) return false
  // PB subscription hook uses BadRequestError (400); some paths surface 403.
  if (err.status !== 400 && err.status !== 403) return false
  const msg = `${err.message} ${String((err.response as { message?: string } | undefined)?.message ?? '')}`.toLowerCase()
  return (
    msg.includes('active subscription required') ||
    msg.includes('read-only vault') ||
    msg.includes('organization required')
  )
}

export function formatPocketBaseError(err: unknown, fallback = 'Request failed'): string {
  if (isSubscriptionGuardError(err)) {
    const raw = `${err instanceof ClientResponseError ? err.message : ''} ${String(
      (err instanceof ClientResponseError
        ? (err.response as { message?: string } | undefined)?.message
        : '') ?? '',
    )}`.toLowerCase()
    const vault = raw.includes('read-only vault')
    dispatchPremiumRequired({ mode: vault ? 'vault' : 'lapsed' })
    return vault ? VAULT_MSG : SUBSCRIPTION_MSG
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

    // SDK uses this when fetch itself throws (common with RN FormData file uploads).
    if (!err.status || /something went wrong\.?$/i.test(err.message)) {
      const cause =
        err.originalError instanceof Error
          ? err.originalError.message
          : typeof err.originalError === 'string'
            ? err.originalError
            : ''
      if (cause && !/something went wrong/i.test(cause)) return cause
      return 'Could not upload — check your connection and try again.'
    }

    return err.message || fallback
  }

  // Plain objects shaped like ClientResponseError (from FileSystem.uploadAsync).
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { message?: string; data?: Record<string, { message?: string }> } })
      .response
    const fields = response?.data
    if (fields && typeof fields === 'object') {
      const fieldErrors = Object.entries(fields)
        .map(([k, v]) => (v?.message ? `${k}: ${v.message}` : null))
        .filter(Boolean)
      if (fieldErrors.length > 0) return fieldErrors.join('\n')
    }
    if (response?.message && !/something went wrong/i.test(response.message)) {
      return response.message
    }
  }

  if (err instanceof Error && err.message) {
    if (/something went wrong\.?$/i.test(err.message)) {
      return 'Could not upload — check your connection and try again.'
    }
    return err.message
  }
  return fallback
}

export function throwPocketBaseError(err: unknown, fallback?: string): never {
  throw new Error(formatPocketBaseError(err, fallback))
}
