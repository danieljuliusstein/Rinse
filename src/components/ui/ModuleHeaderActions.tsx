import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { MagnifyingGlass } from 'phosphor-react-native'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import { colors, spacing } from '@/src/theme/colors'

type ModuleHeaderActionsProps = {
  /** Module-specific actions (add, import, …) — rendered left of Search. */
  children?: ReactNode
  onSearchPress?: () => void
  searchActive?: boolean
}

/**
 * Standard module header cluster: [actions…] [Search?].
 * Settings lives in the tab bar for now — omit the gear shortcut.
 */
export function ModuleHeaderActions({
  children,
  onSearchPress,
  searchActive = false,
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
