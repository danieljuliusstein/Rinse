import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { hasSeenSetupIntro } from '@/src/lib/setup-intro'
import { needsOnboarding } from '@/src/lib/onboarding'
import { loadSettings } from '@/src/lib/settings-store'

type Gate = 'loading' | 'intro' | 'welcome' | 'login' | 'onboarding' | 'tabs'

export default function Index() {
  const { user, loading } = useAuth()
  const [gate, setGate] = useState<Gate>('loading')

  useEffect(() => {
    if (loading) return

    let cancelled = false

    void (async () => {
      if (!user) {
        const seenIntro = await hasSeenSetupIntro()
        if (cancelled) return
        setGate(seenIntro ? 'welcome' : 'intro')
        return
      }

      try {
        const settings = await loadSettings()
        if (cancelled) return
        setGate(needsOnboarding(settings) ? 'onboarding' : 'tabs')
      } catch {
        if (!cancelled) setGate('tabs')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, user])

  if (loading || gate === 'loading') return <LoadingState label="Starting Rinse…" />
  if (gate === 'intro') return <Redirect href="/intro" />
  if (gate === 'welcome') return <Redirect href="/welcome" />
  if (gate === 'login') return <Redirect href="/(auth)/login" />
  if (gate === 'onboarding') return <Redirect href="/onboarding" />
  return <Redirect href="/(tabs)" />
}
