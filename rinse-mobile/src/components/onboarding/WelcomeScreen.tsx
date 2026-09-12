import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { RinseLockupAnimated } from '@/src/components/onboarding/RinseLogo'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <RinseLockupAnimated height={40} />
        <AppText variant="caption" style={styles.eyebrow}>
          Mobile detailing
        </AppText>
        <AppText variant="h1" style={styles.title}>
          Run your business from your phone
        </AppText>
        <AppText style={styles.lead}>
          Book clients, send invoices, and track jobs — built for solo mobile detailers.
        </AppText>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Get started" onPress={() => router.push('/(auth)/login?mode=signup')} />
        <SecondaryButton label="Sign in" onPress={() => router.push('/(auth)/login')} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  eyebrow: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 36,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  footer: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
})
