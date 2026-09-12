import { useCallback } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText } from '@/src/components/ui'
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED } from '@/src/lib/privacy-content'
import { buildPrivacyMailto, getPrivacyEmail } from '@/src/lib/support-config'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

export default function PrivacyPolicyScreen() {
  const privacyEmail = getPrivacyEmail()
  const privacyMailto = buildPrivacyMailto()

  const openPrivacyEmail = useCallback(() => {
    if (!privacyMailto) return
    void Linking.openURL(privacyMailto)
  }, [privacyMailto])

  return (
    <SettingsScreen title="Privacy policy" subtitle={`Last updated ${PRIVACY_POLICY_UPDATED}`}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText style={styles.sectionTitle}>{section.title}</AppText>
            {section.paragraphs?.map((paragraph) => (
              <AppText key={paragraph} variant="body" style={styles.paragraph}>
                {paragraph}
              </AppText>
            ))}
            {section.bullets ? (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <AppText style={styles.bulletDot}>•</AppText>
                    <AppText variant="body" style={styles.bulletText}>
                      {bullet}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {privacyEmail && privacyMailto ? (
          <Pressable
            accessibilityRole="link"
            onPress={openPrivacyEmail}
            style={({ pressed }) => [styles.contactCard, pressed && styles.contactPressed]}
          >
            <AppText variant="bodyMedium">Email {privacyEmail}</AppText>
          </Pressable>
        ) : (
          <AppText variant="caption" style={styles.fallback}>
            Contact your detailer or the address listed in your business settings.
          </AppText>
        )}
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  paragraph: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bulletList: {
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  contactCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  contactPressed: {
    opacity: 0.88,
  },
  fallback: {
    color: colors.textMuted,
    lineHeight: 20,
  },
})
