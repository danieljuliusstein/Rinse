import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { AppText, Card, PrimaryButton, ScreenLoading, SecondaryButton } from '@/src/components/ui'
import {
  emailDeliverabilityProgress,
  normalizeEmailDeliverability,
  type EmailDeliverabilityChecklist,
} from '@/src/lib/email-deliverability'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const RESEND_DOMAINS_URL = 'https://resend.com/domains'
const SPF_HELP =
  'Add a TXT record on your domain (or include Resend’s include). Exact values come from Resend → Domains.'
const DKIM_HELP =
  'Add the CNAME (or TXT) records Resend shows for DKIM so receivers trust your domain.'
const DMARC_HELP =
  'Add a DMARC TXT at _dmarc.yourdomain.com (start with p=none) so mailbox providers know your policy.'

export default function SettingsEmailDomainScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checklist, setChecklist] = useState<EmailDeliverabilityChecklist>(
    normalizeEmailDeliverability(null),
  )

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    setChecklist(normalizeEmailDeliverability(settings.email_deliverability))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const patch = (partial: Partial<EmailDeliverabilityChecklist>) => {
    setChecklist((prev) => ({ ...prev, ...partial }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const next = {
        ...checklist,
        domain: checklist.domain?.trim() ?? '',
        updated_at: new Date().toISOString(),
      }
      await saveSettings({ email_deliverability: next })
      setChecklist(next)
      Alert.alert('Saved', 'Email domain checklist updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="Send from your domain">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  const progress = emailDeliverabilityProgress(checklist)

  return (
    <SettingsScreen title="Send from your domain" subtitle="SPF · DKIM · DMARC">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <AppText style={styles.lead}>
            Quotes and invoices land in spam less often when you send from your own domain. Platform
            mail still works; this checklist productizes the DNS steps (Resend).
          </AppText>
          <AppText variant="caption" style={styles.progress}>
            {progress.done} of {progress.total} steps marked done
          </AppText>
        </Card>

        <Card style={styles.card}>
          <BusinessFilledField
            label="Your domain"
            value={checklist.domain ?? ''}
            onChangeText={(domain) => patch({ domain })}
            optional
          />
          <AppText variant="caption" style={styles.hint}>
            Same domain as your business email when possible (e.g. detailingpro.com).
          </AppText>
        </Card>

        <Card style={styles.card}>
          <AppText style={styles.sectionTitle}>DNS checklist</AppText>
          <SettingsToggleRow
            label="SPF record added"
            hint={SPF_HELP}
            value={checklist.spf_done === true}
            onChange={(spf_done) => patch({ spf_done })}
            showDivider
          />
          <SettingsToggleRow
            label="DKIM records added"
            hint={DKIM_HELP}
            value={checklist.dkim_done === true}
            onChange={(dkim_done) => patch({ dkim_done })}
            showDivider
          />
          <SettingsToggleRow
            label="DMARC policy set"
            hint={DMARC_HELP}
            value={checklist.dmarc_done === true}
            onChange={(dmarc_done) => patch({ dmarc_done })}
            showDivider
          />
          <SettingsToggleRow
            label="Resend shows domain verified"
            value={checklist.resend_verified === true}
            onChange={(resend_verified) => patch({ resend_verified })}
          />
        </Card>

        <SecondaryButton
          label="Open Resend Domains"
          onPress={() => void Linking.openURL(RESEND_DOMAINS_URL)}
        />
        <PrimaryButton label={saving ? 'Saving…' : 'Save checklist'} loading={saving} onPress={() => void save()} />

        <AppText variant="caption" style={styles.footnote}>
          Dedicated IP / full Domains API wiring can come later — this keeps the ops story in-product so
          you don’t rely on a Slack tip.
        </AppText>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  lead: {
    color: colors.textSecondary,
    lineHeight: 21,
    fontSize: 15,
  },
  progress: {
    color: colors.greenText,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  hint: {
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  footnote: {
    color: colors.textMuted,
    lineHeight: 17,
  },
})
