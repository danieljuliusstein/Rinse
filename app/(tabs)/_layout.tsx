import { useEffect, useState } from 'react'
import { Tabs, Redirect } from 'expo-router'
import { View } from 'react-native'
import { useAuth } from '@/src/providers/AuthProvider'
import { QuickActionProvider } from '@/src/providers/QuickActionProvider'
import { OperatorBottomNav } from '@/src/components/OperatorBottomNav'
import { QuickActionMenu } from '@/src/components/QuickActionMenu'
import { ProductTour } from '@/src/components/ProductTour'
import { ScreenLoading } from '@/src/components/ui'
import { needsOnboarding } from '@/src/lib/onboarding'
import { loadSettings } from '@/src/lib/settings-store'

const hiddenTab = { href: null, headerShown: false }

export default function TabLayout() {
  const { user, loading } = useAuth()
  const [onboardingRequired, setOnboardingRequired] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      setOnboardingRequired(null)
      return
    }
    let cancelled = false
    void loadSettings()
      .then((settings) => {
        if (!cancelled) setOnboardingRequired(needsOnboarding(settings))
      })
      .catch(() => {
        if (!cancelled) setOnboardingRequired(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) return <ScreenLoading variant="spinner" />
  if (!user) return <Redirect href="/(auth)/login" />
  if (onboardingRequired === null) return <ScreenLoading variant="spinner" label="Loading…" />
  if (onboardingRequired) return <Redirect href="/onboarding" />

  return (
    <QuickActionProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => <OperatorBottomNav {...props} />}
          // Remember prior tab so Back on Tools/Invoices/etc. returns to Home/Settings.
          backBehavior="history"
          screenOptions={{
            headerShown: false,
            // Positioning lives on OperatorBottomNav (custom tabBar ignores tabBarStyle).
            safeAreaInsets: { bottom: 0 },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
          <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
          <Tabs.Screen name="reports" options={{ title: 'Business' }} />
          <Tabs.Screen name="settings" options={hiddenTab} />
          <Tabs.Screen name="invoices" options={hiddenTab} />
          <Tabs.Screen name="pipeline" options={hiddenTab} />
          <Tabs.Screen name="messages" options={hiddenTab} />
          <Tabs.Screen name="inventory" options={hiddenTab} />
          <Tabs.Screen name="tools" options={hiddenTab} />
          <Tabs.Screen name="quotes" options={hiddenTab} />
        </Tabs>
        <QuickActionMenu />
        <ProductTour />
      </View>
    </QuickActionProvider>
  )
}
