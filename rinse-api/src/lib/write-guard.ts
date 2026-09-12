import { isPocketBaseAuthenticated } from './pb-auth'
import { isPocketBaseConfigured } from './pocketbase'

export class SignInRequiredError extends Error {
  readonly code = 'SIGN_IN_REQUIRED' as const

  constructor(message = 'Sign in to save changes') {
    super(message)
    this.name = 'SignInRequiredError'
  }
}

/** True when the operator can create or update business data. */
export function canWriteData(): boolean {
  if (!isPocketBaseConfigured()) return true
  return isPocketBaseAuthenticated()
}

export function assertCanWrite(): void {
  if (!canWriteData()) {
    throw new SignInRequiredError()
  }
}
