import { Platform, type ViewStyle } from 'react-native'

/** Operator-light tokens — aligned with detailing-app/src/app/tokens.css */
export const colors = {
  bg: '#f2f2f7',
  bgBase: '#f2f2f7',
  surface: '#ffffff',
  surfaceActive: '#ebebf0',
  text: '#000000',
  textPrimary: '#000000',
  textSecondary: '#3c3c43',
  textMuted: '#8e8e93',
  textDim: '#aeaeb2',
  border: '#e5e5ea',
  green: '#22c55e',
  greenText: '#15803d',
  greenSoft: '#dcf5e3',
  greenBorder: '#bbf7d0',
  danger: '#ef4444',
  amber: '#f59e0b',
  blue: '#2563eb',
  navBg: 'rgba(255, 255, 255, 0.94)',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const radii = {
  md: 12,
  lg: 14,
  sheet: 16,
  pill: 999,
  icon: 10,
} as const

export const layout = {
  maxContentWidth: 428,
  /** Operator column on web — matches bottom nav + screenshot frame. */
  phoneColumnWidth: 390,
  tabBarHeight: 56,
  headerHeight: 52,
  minTapTarget: 44,
} as const

/** RN Web maps accessibilityRole="button" to <button> — reset UA styles so row layouts work. */
export const webPressableReset: ViewStyle = Platform.OS === 'web'
  ? ({
      width: '100%',
      alignSelf: 'stretch',
      textAlign: 'left',
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
    } as unknown as ViewStyle)
  : {}

/** Compact pressables (pills, chips) — no width:100% stretch.
 * Do not set alignSelf here — it pulls FABs/nav buttons off vertical center in flex rows. */
export const webInlinePressableReset: ViewStyle = Platform.OS === 'web'
  ? ({
      cursor: 'pointer',
      appearance: 'none',
      WebkitAppearance: 'none',
      flexShrink: 0,
    } as unknown as ViewStyle)
  : {}

const cardShadowNative: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
}

const cardShadowWeb: ViewStyle = {
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
}

export const shadows = {
  card: Platform.OS === 'web' ? cardShadowWeb : cardShadowNative,
} as const

export type BadgeTone = 'green' | 'yellow' | 'amber' | 'blue' | 'gray' | 'red' | 'draft'
export type ListRowIconTone = 'blue' | 'green' | 'amber' | 'purple'

export const iconTonePalette: Record<ListRowIconTone, { bg: string; fg: string }> = {
  blue: { bg: 'rgba(37, 99, 235, 0.1)', fg: '#2563eb' },
  green: { bg: 'rgba(34, 197, 94, 0.12)', fg: '#15803d' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706' },
  purple: { bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed' },
}

export const badgePalette: Record<BadgeTone, { bg: string; text: string; border?: string }> = {
  green: { bg: 'rgba(34, 197, 94, 0.12)', text: '#15803d' },
  yellow: { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706' },
  blue: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
  red: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
  gray: { bg: '#ebebf0', text: '#8e8e93' },
  draft: { bg: '#ebebf0', text: '#8e8e93', border: '#e5e5ea' },
}
