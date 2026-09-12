import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '@/src/theme/colors'

export function DetailHeaderActions({
  onBack,
  onEdit,
}: {
  onBack: () => void
  onEdit?: () => void
}) {
  return (
    <View style={styles.row}>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onBack} hitSlop={8}>
        <Text style={styles.back}>Back</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  edit: {
    color: colors.greenText,
    fontWeight: '600',
    fontSize: 15,
  },
  back: {
    color: colors.greenText,
    fontWeight: '600',
    fontSize: 15,
  },
})
