import { useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Copy } from 'phosphor-react-native'
import { AppText, SecondaryButton } from '@/src/components/ui'
import {
  embedButtonScriptHtml,
  embedCalendarIframeHtml,
  embedCalendarScriptHtml,
  exampleSiteUrl,
  platformSetupSteps,
  PLATFORM_LABELS,
  socialSetupSteps,
  SOCIAL_PLACEMENTS,
  type WebsitePlatform,
} from '@/src/lib/booking-embed'
import { copyTextToClipboard } from '@/src/lib/share'
import { colors, iconTonePalette, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

type Situation = 'social' | 'website'

const PLATFORMS: WebsitePlatform[] = ['wix', 'squarespace', 'wordpress', 'other']

export function WebsiteBookingGuide({
  appOrigin,
  slug,
  bookingUrl,
  brandName,
}: {
  appOrigin: string
  slug: string
  bookingUrl: string
  brandName?: string
}) {
  const displayBrand = brandName?.trim() || 'your business'
  const bookLabel = `Book with ${displayBrand}`

  const [situation, setSituation] = useState<Situation>('social')
  const [platform, setPlatform] = useState<WebsitePlatform>('wix')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedTab, setAdvancedTab] = useState<'button' | 'iframe'>('button')
  const [copied, setCopied] = useState<'link' | 'code' | 'advanced' | null>(null)

  const calendarCode = useMemo(
    () => embedCalendarScriptHtml(appOrigin, slug, displayBrand),
    [appOrigin, displayBrand, slug],
  )

  const advancedCode = useMemo(() => {
    if (advancedTab === 'button') return embedButtonScriptHtml(appOrigin, slug, bookLabel)
    return embedCalendarIframeHtml(appOrigin, slug)
  }, [advancedTab, appOrigin, bookLabel, slug])

  const steps = situation === 'social' ? socialSetupSteps() : platformSetupSteps(platform)
  const copyTarget = situation === 'social' ? bookingUrl : calendarCode
  const copyKey = situation === 'social' ? 'link' : 'code'

  const copyText = async (text: string, key: typeof copied) => {
    try {
      await copyTextToClipboard(text, key === 'link' ? 'Booking link copied.' : 'Code copied.')
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  const demoUrl = exampleSiteUrl(appOrigin, slug, displayBrand)

  return (
    <View style={styles.root}>
      <AppText style={styles.pitch}>
        Keep your website, Instagram, or Google listing. Paste one link or one code block — bookings sync to
        this app in real time.
      </AppText>

      <View style={styles.choices}>
        <Pressable
          style={[styles.choice, situation === 'social' ? styles.choiceActive : null]}
          onPress={() => setSituation('social')}
        >
          <AppText variant="bodySemiBold">Link only</AppText>
          <AppText variant="caption" style={styles.choiceDesc}>
            Instagram, Google, texts — no website needed
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.choice, situation === 'website' ? styles.choiceActive : null]}
          onPress={() => setSituation('website')}
        >
          <AppText variant="bodySemiBold">I have a website</AppText>
          <AppText variant="caption" style={styles.choiceDesc}>
            Add a live calendar to the site you already use
          </AppText>
        </Pressable>
      </View>

      {situation === 'website' ? (
        <View style={styles.platforms}>
          <AppText style={styles.platformsLabel}>What built your site?</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.platformRow}>
            {PLATFORMS.map((p) => (
              <Pressable
                key={p}
                style={[styles.platformChip, platform === p ? styles.platformChipActive : null]}
                onPress={() => setPlatform(p)}
              >
                <AppText variant="bodySemiBold" style={platform === p ? styles.platformChipTextActive : styles.platformChipText}>
                  {PLATFORM_LABELS[p]}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <AppText style={styles.stepNumText}>{index + 1}</AppText>
            </View>
            <AppText style={styles.stepText}>{step}</AppText>
          </View>
        ))}
      </View>

      {situation === 'social' ? (
        <View style={styles.ideas}>
          {SOCIAL_PLACEMENTS.map((place) => (
            <View key={place} style={styles.ideaRow}>
              <AppText style={styles.ideaBullet}>•</AppText>
              <AppText style={styles.ideaText}>{place}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.copyBlock}>
        <AppText style={styles.copyLabel}>
          {situation === 'social' ? 'Your booking link' : 'Paste this on your website'}
        </AppText>
        <AppText style={styles.code} selectable>
          {copyTarget}
        </AppText>
        <View style={styles.actions}>
          <Pressable style={styles.copyBtn} onPress={() => void copyText(copyTarget, copyKey)}>
            <Copy size={16} color="#fff" weight="bold" />
            <AppText variant="bodySemiBold" style={styles.copyBtnText}>
              {copied === copyKey ? 'Copied!' : situation === 'social' ? 'Copy booking link' : 'Copy code'}
            </AppText>
          </Pressable>
          <SecondaryButton label="See example site" onPress={() => void Linking.openURL(demoUrl)} />
        </View>
      </View>

      {situation === 'website' ? (
        <View style={styles.advanced}>
          <Pressable onPress={() => setShowAdvanced((open) => !open)}>
            <AppText style={styles.advancedToggle}>
              {showAdvanced ? 'Hide other options' : 'Other options (popup button, etc.)'}
            </AppText>
          </Pressable>
          {showAdvanced ? (
            <View style={styles.advancedBody}>
              <View style={styles.platformRow}>
                <Pressable
                  style={[styles.platformChip, advancedTab === 'button' ? styles.platformChipActive : null]}
                  onPress={() => setAdvancedTab('button')}
                >
                  <AppText variant="bodySemiBold">Popup button</AppText>
                </Pressable>
                <Pressable
                  style={[styles.platformChip, advancedTab === 'iframe' ? styles.platformChipActive : null]}
                  onPress={() => setAdvancedTab('iframe')}
                >
                  <AppText variant="bodySemiBold">Iframe only</AppText>
                </Pressable>
              </View>
              <AppText style={styles.advancedHelp}>
                {advancedTab === 'button'
                  ? 'Adds a button that opens booking in a popup — good for your header or hero.'
                  : 'Some site builders only allow iframes — paste this block instead of the calendar code.'}
              </AppText>
              <AppText style={styles.code} selectable>
                {advancedCode}
              </AppText>
              <Pressable style={styles.ghostCopy} onPress={() => void copyText(advancedCode, 'advanced')}>
                <Copy size={16} color={colors.greenText} weight="bold" />
                <AppText variant="bodySemiBold" style={styles.ghostCopyText}>
                  {copied === 'advanced' ? 'Copied!' : 'Copy code'}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  pitch: {
    color: colors.textSecondary,
    lineHeight: 21,
  },
  choices: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choice: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  choiceActive: {
    borderColor: colors.green,
    backgroundColor: iconTonePalette.green.bg,
  },
  choiceDesc: {
    color: colors.textSecondary,
  },
  platforms: {
    gap: spacing.sm,
  },
  platformsLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  platformRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  platformChipActive: {
    borderColor: colors.green,
    backgroundColor: iconTonePalette.green.bg,
  },
  platformChipText: {
    color: colors.textPrimary,
  },
  platformChipTextActive: {
    color: colors.greenText,
  },
  steps: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: iconTonePalette.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  ideas: {
    gap: 6,
    paddingLeft: spacing.xs,
  },
  ideaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ideaBullet: {
    color: colors.textMuted,
  },
  ideaText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  copyBlock: {
    gap: spacing.sm,
  },
  copyLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  actions: {
    gap: spacing.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.green,
    minHeight: 48,
  },
  copyBtnText: {
    color: '#fff',
  },
  advanced: {
    gap: spacing.sm,
  },
  advancedToggle: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
  },
  advancedBody: {
    gap: spacing.sm,
  },
  advancedHelp: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ghostCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  ghostCopyText: {
    color: colors.greenText,
  },
})
