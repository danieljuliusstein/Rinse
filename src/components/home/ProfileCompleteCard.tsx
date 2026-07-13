import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, PrimaryButton } from '@/src/components/ui'
import type { ProfileCompletion } from '@/src/lib/profile-completion'
import { colors, radii, spacing } from '@/src/theme/colors'

type ProfileCompleteCardProps = {
  completion: ProfileCompletion
}

export function ProfileCompleteCard({ completion }: ProfileCompleteCardProps) {
  const router = useRouter()
  const { t } = useTranslation()

  if (completion.isComplete) return null

  const continueHref = completion.nextStep?.href ?? '/settings/business'

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <AppText variant="sectionLabel">{t('home.completeProfile')}</AppText>
        <AppText style={styles.percent}>{completion.percent}%</AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, completion.percent))}%` }]} />
      </View>
      <AppText variant="body" style={styles.next}>
        {t('home.nextStep', { label: completion.nextStep?.label ?? t('home.finishSetup') })}
      </AppText>
      <PrimaryButton
        label={t('home.continueSetup')}
        onPress={() => router.push(continueHref as '/settings/business')}
        style={styles.cta}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  percent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.green,
  },
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#e8e8e5',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  next: {
    fontSize: 15,
  },
  cta: {
    marginTop: 2,
  },
})
