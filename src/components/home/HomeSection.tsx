import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/src/components/ui'
import { spacing } from '@/src/theme/colors'

export function HomeSectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="sectionLabel" style={styles.label}>
      {children}
    </AppText>
  )
}

export function HomeSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <HomeSectionLabel>{label}</HomeSectionLabel>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  label: {
    letterSpacing: 0.6,
  },
})
