import { StyleSheet, View } from 'react-native'
import { Check } from '@/src/icons'
import { AppText } from '@/src/components/ui/AppText'
import { colors, spacing } from '@/src/theme/colors'

interface JobStatusPanelProps {
  eyebrow: string
  heading: string
  statusTone: 'green' | 'blue' | 'amber' | 'red' | 'gray'
}

export function JobStatusPanel({ eyebrow, heading, statusTone }: JobStatusPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.copy}>
        <AppText variant="sectionLabel" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
        <AppText variant="bodySemiBold" style={styles.heading}>
          {heading}
        </AppText>
      </View>
      <View style={[styles.statusDot, toneStyles[statusTone]]}>
        <Check size={15} color={toneIcon[statusTone]} weight="bold" />
      </View>
    </View>
  )
}

const toneStyles = StyleSheet.create({
  green: { backgroundColor: colors.greenSoft },
  blue: { backgroundColor: '#dbeafe' },
  amber: { backgroundColor: '#fef3c7' },
  red: { backgroundColor: '#fee2e2' },
  gray: { backgroundColor: colors.surfaceActive },
})

const toneIcon: Record<JobStatusPanelProps['statusTone'], string> = {
  green: colors.greenText,
  blue: colors.blue,
  amber: colors.amber,
  red: colors.danger,
  gray: colors.textMuted,
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: colors.textMuted,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  statusDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
