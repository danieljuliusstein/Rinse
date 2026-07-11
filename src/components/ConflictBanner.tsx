import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '@/src/theme/colors'

interface ConflictBannerProps {
  onRefresh: () => void
  refreshing?: boolean
}

export function ConflictBanner({ onRefresh, refreshing }: ConflictBannerProps) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.copy}>
        <Text style={styles.title}>Newer version on server</Text>
        <Text style={styles.body}>Another device may have updated this record. Refresh to see the latest.</Text>
      </View>
      <Pressable
        onPress={onRefresh}
        disabled={refreshing}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, refreshing && styles.btnDisabled]}
      >
        <Text style={styles.btnLabel}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: spacing.sm,
  },
  copy: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  body: {
    fontSize: 13,
    color: '#a16207',
    lineHeight: 18,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
})
