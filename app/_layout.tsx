import 'react-native-reanimated'
import { useEffect } from 'react'
import { Text, TextProps } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans'
import { Syne_600SemiBold, Syne_700Bold, useFonts as useSyne } from '@expo-google-fonts/syne'
import { PostHogProvider } from 'posthog-react-native'
import { AuthProvider } from '@/src/providers/AuthProvider'
import { OfflineProvider } from '@/src/providers/OfflineProvider'
import { DataRefreshProvider } from '@/src/providers/DataRefreshProvider'
import { DetailOverlayProvider } from '@/src/providers/DetailOverlayProvider'
import { PaywallGateProvider } from '@/src/providers/PaywallGateProvider'
import { ScreenshotModeBootstrap } from '@/src/components/ScreenshotModeBootstrap'
import { getPostHog } from '@/src/lib/posthog'
import { initSentry, wrapRoot } from '@/src/lib/sentry'

import { fonts } from '@/src/theme/typography'

initSentry()

function setDefaultTextFont() {
  const textDefaults = (Text as typeof Text & { defaultProps?: Partial<TextProps> }).defaultProps ?? {}
  ;(Text as typeof Text & { defaultProps?: Partial<TextProps> }).defaultProps = {
    ...textDefaults,
    style: [{ fontFamily: fonts.body }, textDefaults.style],
  }
}
setDefaultTextFont()

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync()

const sheetScreenOptions = {
  presentation: 'transparentModal' as const,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
  // Let AppSheet own bottom inset — otherwise the modal stops above the home
  // indicator and clips the footer (same gap we fixed on the tab dock).
  safeAreaInsets: { bottom: 0 },
}

function RootLayout() {
  const [syneLoaded] = useSyne({ Syne_600SemiBold, Syne_700Bold })
  const [dmLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  })

  const loaded = syneLoaded && dmLoaded
  const posthog = getPostHog()

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) return null

  const tree = (
    <AuthProvider>
      <OfflineProvider>
        <DataRefreshProvider>
          <DetailOverlayProvider>
            <PaywallGateProvider>
              <ScreenshotModeBootstrap />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="intro" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="jobs/new" options={sheetScreenOptions} />
                <Stack.Screen name="jobs/edit/[id]" options={sheetScreenOptions} />
                <Stack.Screen name="jobs/[id]/invoice" options={{ presentation: 'card' }} />
                <Stack.Screen name="clients/new" options={sheetScreenOptions} />
                <Stack.Screen name="clients/edit/[id]" options={sheetScreenOptions} />
                <Stack.Screen name="clients/import" options={sheetScreenOptions} />
                <Stack.Screen name="clients/[id]/vehicles/new" options={sheetScreenOptions} />
                <Stack.Screen name="clients/[id]/vehicles/edit/[vehicleId]" options={sheetScreenOptions} />
                <Stack.Screen name="inventory/new" options={sheetScreenOptions} />
                <Stack.Screen name="inventory/buy" options={sheetScreenOptions} />
                <Stack.Screen name="inventory/supply/[id]" options={sheetScreenOptions} />
                <Stack.Screen name="inventory/equipment/[id]" options={sheetScreenOptions} />
                <Stack.Screen name="inventory/wishlist/[id]" options={sheetScreenOptions} />
                <Stack.Screen name="expenses/new" options={sheetScreenOptions} />
                <Stack.Screen name="invoices/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="invoices/new" options={sheetScreenOptions} />
                <Stack.Screen name="quotes/new" options={sheetScreenOptions} />
                <Stack.Screen name="quotes/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="leads/new" options={sheetScreenOptions} />
                <Stack.Screen name="pipeline/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="settings" />
              </Stack>
            </PaywallGateProvider>
          </DetailOverlayProvider>
        </DataRefreshProvider>
      </OfflineProvider>
    </AuthProvider>
  )

  if (!posthog) return tree

  return (
    <PostHogProvider client={posthog} autocapture={false}>
      {tree}
    </PostHogProvider>
  )
}

export default wrapRoot(RootLayout)
