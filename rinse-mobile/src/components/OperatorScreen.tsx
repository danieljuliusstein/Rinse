import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { KpiCard, ScreenShell, type ScreenShellProps } from '@/src/components/ScreenShell'
import { TabDockPaddingProvider, useTabDockPadding } from '@/src/hooks/useTabDockPadding'
import { spacing } from '@/src/theme/colors'

export { KpiCard, useTabDockPadding }

type OperatorScreenProps = ScreenShellProps & {
  /** When false, omit tab-bar dock inset (settings stack, etc.) */
  tabDock?: boolean
  onBack?: () => void
}

/**
 * Tab screens — dock is position:absolute, so we must NOT pad the shell body
 * (that leaves a dead gap above the nav). Scroll views should use
 * `useTabDockPadding()` on contentContainerStyle instead.
 */
export function OperatorScreen({
  tabDock = true,
  bottomPadding,
  onBack,
  headerRight,
  children,
  ...props
}: OperatorScreenProps) {
  const dockPadding = useTabDockPadding(tabDock)
  // Only pad the shell when there is no absolute tab dock (stack/sub screens).
  const shellBottom = bottomPadding ?? (tabDock ? 0 : dockPadding)

  let resolvedRight: ReactNode = headerRight
  if (onBack && headerRight) {
    resolvedRight = (
      <View style={styles.headerRight}>
        {headerRight}
        <DetailHeaderActions onBack={onBack} />
      </View>
    )
  } else if (onBack) {
    resolvedRight = <DetailHeaderActions onBack={onBack} />
  }

  return (
    <TabDockPaddingProvider value={tabDock ? dockPadding : 0}>
      <ScreenShell {...props} headerRight={resolvedRight} bottomPadding={shellBottom}>
        {children}
      </ScreenShell>
    </TabDockPaddingProvider>
  )
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
})
