import { formatLiabilityTimestamp, liabilityTimestamp, type DamageRecord } from '@rinse/core'
import { Image, StyleSheet } from 'react-native'
import { Image as ImageIcon } from 'phosphor-react-native'
import { AppText } from '@/src/components/ui/AppText'
import { ListRow } from '@/src/components/ui/ListRow'
import { colors } from '@/src/theme/colors'

interface DamageListRowProps {
  damage: DamageRecord
  onPress: () => void
  grouped?: boolean
  isLast?: boolean
}

export function DamageListRow({ damage, onPress, grouped = true, isLast = false }: DamageListRowProps) {
  const thumb = damage.photo_url ? (
    <Image source={{ uri: damage.photo_url }} style={styles.thumb} resizeMode="cover" />
  ) : (
    <ImageIcon size={20} color={colors.amber} weight="duotone" />
  )

  const stamped = liabilityTimestamp(damage)
  const trailingLabel = stamped
    ? formatLiabilityTimestamp(stamped)
    : damage.uploaded_at
      ? formatLiabilityTimestamp(damage.uploaded_at)
      : 'Uploading…'

  return (
    <ListRow
      grouped={grouped}
      isLast={isLast}
      icon={thumb}
      iconTone="amber"
      title={damage.area}
      subtitle={damage.note || undefined}
      trailing={
        <AppText variant="caption" style={styles.date}>
          {trailingLabel}
        </AppText>
      }
      onPress={onPress}
    />
  )
}

const styles = StyleSheet.create({
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 110,
    textAlign: 'right',
  },
})
