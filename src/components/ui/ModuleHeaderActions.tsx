import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { GearSix, MagnifyingGlass } from 'phosphor-react-native'
import { IconHeaderButton } from '@/src/components/ui/IconHeaderButton'
import { colors, spacing } from '@/src/theme/colors'

type ModuleHeaderActionsProps = {
  /** Module-specific actions (add, import, …) — rendered left of Search/Settings. */
  children?: ReactNode
  onSearchPress?: () => void
  searchActive?: boolean
  settingsDot?: boolean
}

/**
 * Standard module header cluster: [actions…] [Search?] [Settings].
 * Settings is always rightmost.
 */
export function ModuleHeaderActions({
  children,
  onSearchPress,
  searchActive = false,
  settingsDot = false,
}: ModuleHeaderActionsProps) {
  const router = useRouter()

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
      <IconHeaderButton
        label="Settings"
        onPress={() => router.push('/(tabs)/settings')}
        dot={settingsDot}
      >
        <GearSix size={18} color={colors.textSecondary} weight="duotone" />
      </IconHeaderButton>
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
