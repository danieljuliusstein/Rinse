import type { ReactNode } from 'react'
import { useNavigation, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SettingsHeader } from '@/src/components/ui/BackHeaderButton'
import { OperatorScreen } from '@/src/components/OperatorScreen'
import { ScreenShell, type ScreenShellProps } from '@/src/components/ScreenShell'
import { safeGoBack } from '@/src/lib/safe-go-back'
import { spacing } from '@/src/theme/colors'

type SettingsScreenProps = Omit<ScreenShellProps, 'title'> & {
  title: string
  children: ReactNode
  /** When the stack has no history (e.g. deep link), navigate here instead of back(). */
  fallbackHref?: Href
  /**
   * Settings hub opened from another screen (not only the tab entry).
   * Back returns to that screen via navigation history.
   */
  hub?: boolean
  /** Settings hub inside the bottom-tab navigator (keeps the dock visible). */
  tabRoot?: boolean
  /**
   * Extra space under body content. Defaults to safe-area + md.
   * Pass 0 for full-bleed tools (invoice editor) that own their own bottom inset.
   */
  bottomPadding?: number
  invoiceSurface?: boolean
}

export function SettingsScreen({
  title,
  subtitle,
  children,
  headerRight,
  fallbackHref,
  hub = false,
  tabRoot = false,
  bottomPadding,
  invoiceSurface,
}: SettingsScreenProps) {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  // Prefer history so Home/Jobs/Clients/Business → Settings → Back returns there.
  const backFallback: Href = fallbackHref ?? (tabRoot || hub ? '/(tabs)' : '/(tabs)/settings')

  const goBack = () => {
    safeGoBack(navigation, backFallback)
  }

  const header = (
    <SettingsHeader title={title} subtitle={subtitle} onBack={goBack} right={headerRight} />
  )

  if (tabRoot) {
    return (
      <OperatorScreen customHeader={header} invoiceSurface={invoiceSurface}>
        {children}
      </OperatorScreen>
    )
  }

  return (
    <ScreenShell
      customHeader={header}
      bottomPadding={bottomPadding ?? insets.bottom + spacing.md}
      invoiceSurface={invoiceSurface}
    >
      {children}
    </ScreenShell>
  )
}
