import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { GearSix, MagnifyingGlass } from '@/src/icons'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import { colors, spacing } from '@/src/theme/colors'

type ModuleHeaderActionsProps = {
  /** Module-specific actions (add, routes, …) — rendered left of Search. */
  children?: ReactNode
  onSearchPress?: () => void
  searchActive?: boolean
  onSettingsPress?: () => void
  settingsDot?: boolean
  settingsLabel?: string
}

/**
 * Standard module header cluster: [actions…] [Search?] [Settings?].
 */
export function ModuleHeaderActions({
  children,
  onSearchPress,
  searchActive = false,
  onSettingsPress,
  settingsDot = false,
  settingsLabel = 'Settings',
}: ModuleHeaderActionsProps) {
  return (
    <View style={styles.row}>
      {children}
      {onSearchPress ? (
        <IconHeaderButton label="Search" onPress={onSearchPress} active={searchActive}>
          <MagnifyingGlass
            size={18}
            color={searchActive ? colors.greenText : colors.textSecondary}
            weight="duotone"
          />
        </IconHeaderButton>
      ) : null}
      {onSettingsPress ? (
        <IconHeaderButton label={settingsLabel} onPress={onSettingsPress} dot={settingsDot}>
          <GearSix size={18} color={colors.textSecondary} weight="duotone" />
        </IconHeaderButton>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    flexShrink: 0,
  },
})
