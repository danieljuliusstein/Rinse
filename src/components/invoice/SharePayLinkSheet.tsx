import { useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native'
import { Share } from 'react-native'
import { fmt, type TipPrefs } from '@rinse/core'
import type { JobWithRelations } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { FormField } from '@/src/components/FormField'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { openSms } from '@/src/lib/api'
import { createPortalLink } from '@/src/lib/share'
import { checkPremiumGate } from '@/src/lib/subscription'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

export function SharePayLinkSheet({
  visible,
  onClose,
  job,
  tipPrefs,
  invoiceTotal,
  hasBeforeAndAfter,
  onRequirePhotos,
}: {
  visible: boolean
  onClose: () => void
  job: JobWithRelations
  tipPrefs: TipPrefs
  invoiceTotal: number
  hasBeforeAndAfter: boolean
  onRequirePhotos?: () => void
}) {
  const presets = tipPrefs.presets.length > 0 ? tipPrefs.presets : [15, 18, 20]
  const [enabled, setEnabled] = useState(tipPrefs.suggest_on_pay_link)
  const [selected, setSelected] = useState<string>(String(presets[1] ?? presets[0] ?? 18))
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setEnabled(tipPrefs.suggest_on_pay_link)
    setSelected(String(presets[1] ?? presets[0] ?? 18))
    setCustom('')
    setUrl(null)
  }, [visible, tipPrefs.suggest_on_pay_link, tipPrefs.presets])

  const tipPercent = !enabled
    ? null
    : selected === 'custom'
      ? Math.max(0, Number(custom.replace(/[^0-9.]/g, '')) || 0)
      : Math.max(0, Number(selected) || 0)

  const tipAmount =
    tipPercent != null && tipPercent > 0 ? Math.round(((invoiceTotal * tipPercent) / 100) * 100) / 100 : 0
  const payTotal = invoiceTotal + tipAmount

  const tipOptions = useMemo(
    () => [...presets.map((p) => ({ value: String(p), label: `${p}%` })), { value: 'custom', label: 'Custom' }],
    [presets],
  )

  const ensureLink = async () => {
    if (url) return url
    if (!hasBeforeAndAfter) {
      throw new Error('Add before & after photos before sharing the pay link.')
    }
    const gate = await checkPremiumGate('share_portal')
    if (!gate.allowed) throw new Error('Active subscription required')
    const link = await createPortalLink({
      clientId: job.client_id,
      scope: 'invoice',
      jobId: job.id,
    })
    setUrl(link.url)
    return link.url
  }

  const handleCopy = async () => {
    if (!hasBeforeAndAfter) {
      Alert.alert('Before & after required', 'Add transformation photos before sharing.', [
        { text: 'Cancel', style: 'cancel' },
        ...(onRequirePhotos ? [{ text: 'Add photos', onPress: onRequirePhotos }] : []),
      ])
      return
    }
    setBusy(true)
    try {
      const link = await ensureLink()
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        await Share.share({ message: link, url: link })
      }
      Alert.alert('Link ready', 'Pay link copied / shared.')
      onClose()
    } catch (e) {
      Alert.alert('Share', e instanceof Error ? e.message : 'Could not copy link')
    } finally {
      setBusy(false)
    }
  }

  const handleSms = async () => {
    if (!hasBeforeAndAfter) {
      Alert.alert('Before & after required', 'Add transformation photos before sharing.', [
        { text: 'Cancel', style: 'cancel' },
        ...(onRequirePhotos ? [{ text: 'Add photos', onPress: onRequirePhotos }] : []),
      ])
      return
    }
    const phone = job.client?.phone
    if (!phone) {
      Alert.alert('SMS', 'Add a client phone number to send the pay link.')
      return
    }
    setBusy(true)
    try {
      const link = await ensureLink()
      const tipNote =
        tipPercent != null ? ` Tip suggestion: ${tipPercent}%.` : ''
      await Linking.openURL(openSms(phone, `Pay for your detail: ${link}${tipNote}`))
      onClose()
    } catch (e) {
      Alert.alert('Share', e instanceof Error ? e.message : 'Could not send link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Share Pay Link"
      subtitle={job.client?.name ?? 'Client'}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <SecondaryButton label="Copy link" loading={busy} onPress={() => void handleCopy()} style={styles.footerBtn} />
          <PrimaryButton
            label="Send via SMS"
            loading={busy}
            onPress={() => void handleSms()}
            style={styles.footerPrimary}
          />
        </View>
      }
    >
      <View
        style={[
          styles.gate,
          hasBeforeAndAfter ? styles.gateOk : styles.gateWarn,
        ]}
      >
        <AppText variant="caption" style={hasBeforeAndAfter ? styles.gateOkText : styles.gateWarnText}>
          {hasBeforeAndAfter
            ? 'Transformation photos ✓ — gate cleared'
            : 'Add before & after photos before sharing'}
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.tipHeader}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySemiBold">Suggest tip on pay link</AppText>
            <AppText variant="caption" style={styles.muted}>
              {tipPrefs.tips_go_to ? `Tips go to ${tipPrefs.tips_go_to}` : 'Optional tip chips on portal pay'}
            </AppText>
          </View>
          <Pressable
            onPress={() => setEnabled((v) => !v)}
            style={[styles.toggle, enabled && styles.toggleOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
          >
            <View style={[styles.knob, enabled && styles.knobOn]} />
          </Pressable>
        </View>
        {enabled ? (
          <View style={styles.tipBody}>
            <AppText variant="caption" style={styles.muted}>
              Preset tip amounts
            </AppText>
            <PillGroup options={tipOptions} value={selected} onChange={setSelected} />
            {selected === 'custom' ? (
              <FormField label="Custom tip %" value={custom} onChangeText={setCustom} keyboardType="decimal-pad" />
            ) : null}
          </View>
        ) : null}
      </View>

      <AppText variant="sectionLabel">Customer sees</AppText>
      <View style={styles.preview}>
        <AppText variant="caption" style={styles.muted}>
          {job.package?.name ?? 'Detail'} · {job.client?.name ?? 'Client'}
        </AppText>
        <AppText variant="h1" style={styles.previewTotal}>
          {fmt(invoiceTotal)}
          <AppText variant="caption" style={styles.muted}>
            {' '}
            total
          </AppText>
        </AppText>
        {enabled && tipPercent != null ? (
          <>
            <AppText variant="caption" style={[styles.muted, { marginBottom: spacing.xs }]}>
              Add a tip?
            </AppText>
            <View style={styles.previewTips}>
              {presets.slice(0, 3).map((pct) => {
                const on = selected === String(pct)
                const amt = Math.round(((invoiceTotal * pct) / 100) * 100) / 100
                return (
                  <View key={pct} style={[styles.previewTip, on && styles.previewTipOn]}>
                    <AppText variant="bodySemiBold" style={on ? styles.previewTipTextOn : undefined}>
                      {pct}%
                    </AppText>
                    <AppText variant="caption" style={on ? styles.previewTipTextOn : styles.muted}>
                      {fmt(amt)}
                    </AppText>
                  </View>
                )
              })}
            </View>
            {tipAmount > 0 ? (
              <View style={styles.tipLine}>
                <AppText variant="caption" style={styles.muted}>
                  Tip ({tipPercent}%)
                </AppText>
                <AppText variant="caption" style={styles.muted}>
                  +{fmt(tipAmount)}
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
        <View style={styles.payMock}>
          <AppText variant="bodySemiBold" style={styles.payMockText}>
            Pay {fmt(enabled ? payTotal : invoiceTotal)}
          </AppText>
        </View>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 2 },
  gate: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gateOk: {
    backgroundColor: iconTonePalette.green.bg,
    borderColor: colors.green,
  },
  gateWarn: {
    backgroundColor: iconTonePalette.amber.bg,
    borderColor: iconTonePalette.amber.fg,
  },
  gateOkText: { color: colors.greenText, fontWeight: '600' },
  gateWarnText: { color: iconTonePalette.amber.fg, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tipBody: { paddingVertical: spacing.sm, gap: spacing.xs },
  muted: { color: colors.textMuted },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: colors.green },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  knobOn: { alignSelf: 'flex-end' },
  preview: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  previewTotal: { marginBottom: spacing.sm },
  previewTips: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm },
  previewTip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  previewTipOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  previewTipTextOn: { color: '#fff' },
  tipLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  payMock: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  payMockText: { color: '#fff' },
})
