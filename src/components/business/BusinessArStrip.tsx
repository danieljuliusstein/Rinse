import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { WarningCircle } from '@/src/icons'
import { fmt } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { colors, spacing, webInlinePressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type BusinessArStripProps = {
  openCount: number
  unpaid: number
}

export function BusinessArStrip({ openCount, unpaid }: BusinessArStripProps) {
  const router = useRouter()
  if (openCount <= 0) return null

  const dots = Array.from({ length: Math.min(openCount, 8) })

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <WarningCircle size={17} color="#f43f5e" weight="duotone" />
      </View>
      <View style={styles.body}>
        <AppText style={styles.title}>
          {openCount} unpaid invoice{openCount === 1 ? '' : 's'}
        </AppText>
        <View style={styles.metaRow}>
          {dots.map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
          <AppText style={styles.meta}>{fmt(unpaid)} outstanding</AppText>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/(tabs)/invoices')}
        style={({ pressed }) => [webInlinePressableReset, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Collect unpaid invoices"
      >
        <AppText style={styles.collect}>Collect</AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ffe4e6',
    backgroundColor: 'rgba(255, 241, 242, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
  },
  meta: {
    marginLeft: 2,
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  collect: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: '#16a34a',
  },
  pressed: {
    opacity: 0.7,
  },
})
