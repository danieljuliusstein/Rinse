import { createContext, useContext } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { layout, spacing } from '@/src/theme/colors'

const TabDockPaddingContext = createContext<number | null>(null)

export const TabDockPaddingProvider = TabDockPaddingContext.Provider

/** Matches OperatorBottomNav dockSafeBottom — icons sit closer to the home indicator. */
export function tabDockSafeBottom(insetBottom: number): number {
  if (insetBottom <= 0) return spacing.sm
  return Math.max(insetBottom - 14, 10)
}

/** Bottom inset so scroll content clears the absolute operator tab dock. */
export function useTabDockPadding(enabled = true): number {
  const fromContext = useContext(TabDockPaddingContext)
  const insets = useSafeAreaInsets()
  if (!enabled) return insets.bottom + spacing.md
  if (fromContext != null) return fromContext
  return layout.tabBarHeight + tabDockSafeBottom(insets.bottom) + spacing.sm
}
