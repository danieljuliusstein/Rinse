import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { ScreenLoading } from '@/src/components/ui'

export default function OnboardingLayout() {
  const { user, loading } = useAuth()

  if (loading) return <ScreenLoading variant="spinner" label="Checking session…" />
  if (!user) return <Redirect href="/(auth)/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
