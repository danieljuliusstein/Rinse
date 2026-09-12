import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { colors, spacing } from '@/src/theme/colors'

export function SettingsSectionHead({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>{title}</AppText>
      {description ? <AppText style={styles.description}>{description}</AppText> : null}
    </View>
  )
}

export function SettingsField({ children }: { children: ReactNode }) {
  return <View style={styles.field}>{children}</View>
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  field: {
    gap: spacing.xs,
  },
})
