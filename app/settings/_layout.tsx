import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/src/providers/AuthProvider'
import { ScreenLoading } from '@/src/components/ui'

export default function SettingsLayout() {
  const { user, loading } = useAuth()

  if (loading) return <ScreenLoading variant="spinner" label="Checking session…" />
  if (!user) return <Redirect href="/(auth)/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="access" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="business" />
      <Stack.Screen name="business-expenses" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="expenses" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="invoicing" />
      <Stack.Screen name="overhead" />
      <Stack.Screen name="packages" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="support" />
    </Stack>
  )
}
