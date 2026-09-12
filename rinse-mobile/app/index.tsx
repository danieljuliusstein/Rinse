import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/src/providers/AuthProvider'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { hasSeenSetupIntro } from '@/src/lib/setup-intro'
import { needsOnboarding } from '@/src/lib/onboarding'
import { loadSettings } from '@/src/lib/settings-store'

type Gate = 'loading' | 'intro' | 'welcome' | 'login' | 'onboarding' | 'tabs'

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

export default function Index() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const [gate, setGate] = useState<Gate>('loading')

  useEffect(() => {
    if (loading) return

    let cancelled = false

    void (async () => {
      if (!user) {
        const seenIntro = await withTimeout(hasSeenSetupIntro(), 3000, true)
        if (cancelled) return
        setGate(seenIntro ? 'welcome' : 'intro')
        return
      }

      try {
        const settings = await withTimeout(loadSettings(), 8000, null)
        if (cancelled) return
        setGate(settings && needsOnboarding(settings) ? 'onboarding' : 'tabs')
      } catch {
        if (!cancelled) setGate('tabs')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, user])

  if (loading || gate === 'loading') {
    return <LoadingState label={t('auth.starting')} variant="spinner" />
  }
  if (gate === 'intro') return <Redirect href="/intro" />
  if (gate === 'welcome') return <Redirect href="/welcome" />
  if (gate === 'login') return <Redirect href="/(auth)/login" />
  if (gate === 'onboarding') return <Redirect href="/onboarding" />
  return <Redirect href="/(tabs)" />
}
