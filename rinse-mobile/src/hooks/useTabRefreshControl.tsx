import type { ReactElement } from 'react'
import { RefreshControl } from 'react-native'
import { useQuickAction } from '@/src/providers/QuickActionProvider'
import { colors } from '@/src/theme/colors'

/**
 * Tab-list RefreshControl that stays mounted while the center-plus menu is open.
 * Omitting the control (returning undefined) remounts ScrollView content on web/Android
 * when the menu closes — which looks like the page behind the sheet reloading.
 */
export function useTabRefreshControl(
  refreshing: boolean,
  onRefresh: () => void,
): ReactElement {
  const { menuOpen } = useQuickAction()
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={menuOpen ? () => {} : onRefresh}
      enabled={!menuOpen}
      tintColor={colors.green}
    />
  )
}
