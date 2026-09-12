import { SignInRequiredError } from './write-guard'

export function isSignInRequiredError(error: unknown): error is SignInRequiredError {
  return error instanceof SignInRequiredError
}
