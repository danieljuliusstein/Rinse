import { Pressable, StyleSheet, View } from 'react-native'
import { Warning, WarningCircle } from '@/src/icons'
import { AppText } from '@/src/components/ui'
import type { InventoryAlertData } from '@/src/lib/home-dashboard'
import { colors, spacing } from '@/src/theme/colors'
import { homeCardStyles } from './homeCardStyles'

interface InventoryAlertCardProps {
  alert: InventoryAlertData
  onPress?: () => void
}

export function InventoryAlertCard({ alert, onPress }: InventoryAlertCardProps) {
  const danger = alert.variant === 'danger'
  const Icon = danger ? WarningCircle : Warning

  return (
    <Pressable
      style={({ pressed }) => [
        homeCardStyles.card,
        danger ? styles.cardDanger : styles.cardWarning,
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Icon size={20} color={danger ? colors.danger : '#d97706'} weight="duotone" />
      <View style={styles.body}>
        <AppText variant="bodySemiBold">{alert.title}</AppText>
        <AppText variant="caption" style={styles.sub}>
          {alert.subtitle}
        </AppText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  cardDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  cardPressed: {
    opacity: 0.92,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  sub: {
    color: colors.textSecondary,
  },
})
