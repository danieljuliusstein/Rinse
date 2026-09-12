import { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native'
import { formatShareEmailBody, transformationPdfMissingMessage } from '@rinse/core'
import { createPortalLink, shareTransformationPdf } from '@/src/lib/share'
import { SHARE_LINK_PRESETS, type ShareLinkContext } from '@/src/lib/share-link-presets'
import { loadSettings } from '@/src/lib/settings-store'
import { checkPremiumGate } from '@/src/lib/subscription'
import { AppText, PrimaryButton, SecondaryButton, ShareQrCode } from '@/src/components/ui'
import { TipsSheet } from '@/src/components/invoice/TipsSheet'
import { DEFAULT_TIP_PREFS, normalizeTipPrefs } from '@/src/lib/wave5-prefs'
import type { TipPrefs } from '@rinse/core'
import { colors, spacing } from '@/src/theme/colors'

export interface ShareLinkActionsProps {
  clientId: string
  clientEmail?: string
  clientName: string
  jobId?: string
  quoteId?: string
  context?: ShareLinkContext
  invoiceNumber?: string
  quoteNumber?: string
  /** When context requires transformation, parent supplies readiness. */
  hasBeforeAndAfter?: boolean
  onRequirePhotos?: () => void
  onPdf?: () => void
  pdfLabel?: string
}

export function ShareLinkActions({
  clientId,
  clientEmail,
  jobId,
  quoteId,
  context = 'full',
  invoiceNumber,
  quoteNumber,
  hasBeforeAndAfter = true,
  onRequirePhotos,
  onPdf,
  pdfLabel = 'Download PDF',
}: ShareLinkActionsProps) {
  const preset = SHARE_LINK_PRESETS[context]
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [tipPrefs, setTipPrefs] = useState<TipPrefs>({
    ...DEFAULT_TIP_PREFS,
    presets: [...DEFAULT_TIP_PREFS.presets],
  })
  const [tipsOpen, setTipsOpen] = useState(false)
  const [pendingShare, setPendingShare] = useState<'copy' | 'email' | null>(null)

  useEffect(() => {
    void loadSettings().then((s) => setTipPrefs(normalizeTipPrefs(s.tip_prefs)))
  }, [])

  const transformationBlocked =
    Boolean(preset.requiresTransformation && (!jobId || !hasBeforeAndAfter))

  const ensureTransformation = useCallback((): boolean => {
    if (!transformationBlocked) return true
    Alert.alert('Before & after required', transformationPdfMissingMessage(), [
      { text: 'Cancel', style: 'cancel' },
      ...(onRequirePhotos ? [{ text: 'Add photos', onPress: onRequirePhotos }] : []),
    ])
    return false
  }, [onRequirePhotos, transformationBlocked])

  const ensureLink = useCallback(async () => {
    if (url) return url
    if (transformationBlocked) {
      throw new Error(transformationPdfMissingMessage())
    }
    const gate = await checkPremiumGate('share_portal')
    if (!gate.allowed) {
      throw new Error('Active subscription required')
    }
    const link = await createPortalLink({
      clientId,
      scope: preset.scope,
      jobId,
      quoteId,
    })
    setUrl(link.url)
    return link.url
  }, [clientId, jobId, preset.scope, quoteId, transformationBlocked, url])

  useEffect(() => {
    if (transformationBlocked) {
      setUrl(null)
      return
    }
    void ensureLink().catch(() => setUrl(null))
  }, [ensureLink, transformationBlocked])

  const handleCopy = async () => {
    if (!ensureTransformation()) return
    setBusy(true)
    setMsg('')
    try {
      const link = await ensureLink()
      if (Platform.OS === 'web' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const { Share } = await import('react-native')
        await Share.share({ message: link, url: link })
      }
      setMsg('Link copied')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleEmail = async () => {
    if (!clientEmail) {
      setMsg('Add a client email to send from here')
      return
    }
    if (!ensureTransformation()) return
    setBusy(true)
    setMsg('')
    try {
      const settings = await loadSettings()
      const link = await ensureLink()
      const locale = settings.document_locale
      const subject = preset.emailSubject({
        businessName: settings.business_name,
        quoteNumber,
        invoiceNumber,
        locale,
      })
      const body = formatShareEmailBody(preset.emailMessage(locale), link)
      const mailto = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      await Linking.openURL(mailto)
      if (preset.requiresTransformation && jobId) {
        try {
          await shareTransformationPdf(jobId)
        } catch {
          // Mailto already opened; PDF share is best-effort companion.
        }
      }
      setMsg('Email opened')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const maybeTipsThen = (action: 'copy' | 'email') => {
    if (!ensureTransformation()) return
    if (
      tipPrefs.suggest_on_pay_link &&
      !transformationBlocked &&
      (context === 'invoice' || context === 'full')
    ) {
      setPendingShare(action)
      setTipsOpen(true)
      return
    }
    if (action === 'copy') void handleCopy()
    else void handleEmail()
  }

  return (
    <View style={styles.root}>
      <AppText variant="sectionLabel">{preset.sectionTitle}</AppText>

      {transformationBlocked ? (
        <AppText variant="caption" style={styles.warn}>
          Add before & after photos before sharing the portal or invoice link.
        </AppText>
      ) : null}

      {url ? <ShareQrCode url={url} size={120} label="Scan to open portal" /> : null}

      <PrimaryButton
        label={preset.primaryActionLabel}
        loading={busy}
        disabled={!clientEmail || transformationBlocked}
        onPress={() => maybeTipsThen('email')}
      />

      {!clientEmail ? (
        <AppText variant="caption" style={styles.hint}>
          Add a client email to send from here, or copy the link below.
        </AppText>
      ) : null}

      <View style={styles.secondary}>
        <SecondaryButton
          label={msg === 'Link copied' ? 'Copied' : 'Copy link'}
          loading={busy}
          disabled={transformationBlocked}
          onPress={() => maybeTipsThen('copy')}
          style={styles.secondaryBtn}
        />
        {onPdf ? (
          <SecondaryButton label={pdfLabel} loading={busy} onPress={onPdf} style={styles.secondaryBtn} />
        ) : null}
      </View>

      {msg ? <AppText variant="caption" style={styles.msg}>{msg}</AppText> : null}
      {url ? (
        <AppText variant="caption" style={styles.url} selectable>
          {url}
        </AppText>
      ) : null}

      <TipsSheet
        visible={tipsOpen}
        onClose={() => {
          setTipsOpen(false)
          setPendingShare(null)
        }}
        tipPrefs={tipPrefs}
        busy={busy}
        onContinue={() => {
          const next = pendingShare
          setTipsOpen(false)
          setPendingShare(null)
          if (next === 'copy') void handleCopy()
          else if (next === 'email') void handleEmail()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hint: {
    color: colors.textMuted,
  },
  warn: {
    color: colors.danger,
  },
  secondary: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
  },
  msg: {
    color: colors.greenText,
  },
  url: {
    color: colors.textMuted,
    fontSize: 11,
  },
})
