import { needsOnboarding } from './onboarding'
import { loadSettings } from './settings-store'

/** Where to send a signed-in user after auth or cold start. */
export async function resolveAuthenticatedRoute(): Promise<'/(tabs)' | '/onboarding'> {
  const settings = await loadSettings()
  return needsOnboarding(settings) ? '/onboarding' : '/(tabs)'
}
