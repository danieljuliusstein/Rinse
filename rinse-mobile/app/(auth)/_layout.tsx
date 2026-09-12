import { useEffect, useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { resolveAuthenticatedRoute } from '@/src/lib/onboarding-route'

export default function AuthLayout() {
  const { user, loading } = useAuth()
  const [destination, setDestination] = useState<'/(tabs)' | '/onboarding' | null>(null)

  useEffect(() => {
    if (!user) {
      setDestination(null)
      return
    }
    let cancelled = false
    void resolveAuthenticatedRoute().then((route) => {
      if (!cancelled) setDestination(route)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) return <LoadingState label="Checking session…" />
  if (user) {
    if (!destination) return <LoadingState label="Loading your account…" />
    return <Redirect href={destination} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  )
}
