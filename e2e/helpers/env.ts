export function requireVisualTestCredentials(): { email: string; password: string; pbUrl: string } {
  const email = process.env.EXPO_PUBLIC_TEST_EMAIL?.trim()
  const password = process.env.EXPO_PUBLIC_TEST_PASSWORD
  const pbUrl = (process.env.EXPO_PUBLIC_PB_URL || '').replace(/\/$/, '')

  if (!email || !password) {
    throw new Error(
      'Set EXPO_PUBLIC_TEST_EMAIL and EXPO_PUBLIC_TEST_PASSWORD in rinse-mobile/.env for visual audit',
    )
  }
  if (!pbUrl) {
    throw new Error('Set EXPO_PUBLIC_PB_URL in rinse-mobile/.env for visual audit')
  }

  return { email, password, pbUrl }
}
