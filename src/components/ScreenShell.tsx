import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText } from '@/src/components/ui/AppText'
import { colors, layout, radii, shadows, spacing } from '@/src/theme/colors'

export interface ScreenShellProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  headerRight?: React.ReactNode
  bottomPadding?: number
  /** Replaces the default title row (used by settings back-header layout). */
  customHeader?: React.ReactNode
}

export function ScreenShell({
  title,
  subtitle,
  children,
  headerRight,
  bottomPadding = 0,
  customHeader,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.inner, { maxWidth: layout.maxContentWidth, alignSelf: 'center', width: '100%' }]}>
        {customHeader ?? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {title ? <AppText variant="h1">{title}</AppText> : null}
              {subtitle ? <AppText variant="caption" style={styles.subtitle}>{subtitle}</AppText> : null}
            </View>
            {headerRight}
          </View>
        )}
        {customHeader && headerRight ? (
          <View style={styles.customHeaderRight}>{headerRight}</View>
        ) : null}
        <View style={[styles.body, bottomPadding > 0 ? { paddingBottom: bottomPadding } : null]}>{children}</View>
      </View>
    </SafeAreaView>
  )
}

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <AppText variant="sectionLabel">{label}</AppText>
      <AppText variant="h2" style={styles.kpiValue}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  subtitleBelowCustom: {
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textSecondary,
  },
  customHeaderRight: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    zIndex: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  kpiValue: {
    marginTop: 6,
  },
})
