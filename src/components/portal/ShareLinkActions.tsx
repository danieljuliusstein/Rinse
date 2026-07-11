import { useCallback, useEffect, useState } from 'react'
import { Image, Linking, Platform, StyleSheet, View } from 'react-native'
import { createPortalLink } from '@/src/lib/share'
import { SHARE_LINK_PRESETS, type ShareLinkContext } from '@/src/lib/share-link-presets'
import { loadSettings } from '@/src/lib/settings-store'
import { checkPremiumGate } from '@/src/lib/subscription'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
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
  onPdf,
  pdfLabel = 'Download PDF',
}: ShareLinkActionsProps) {
  const preset = SHARE_LINK_PRESETS[context]
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const ensureLink = useCallback(async () => {
    if (url) return url
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
  }, [clientId, jobId, preset.scope, quoteId, url])

  useEffect(() => {
    void ensureLink().catch(() => setUrl(null))
  }, [ensureLink])

  const handleCopy = async () => {
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
    setBusy(true)
    setMsg('')
    try {
      const settings = await loadSettings()
      const link = await ensureLink()
      const subject = preset.emailSubject({
        businessName: settings.business_name,
        quoteNumber,
        invoiceNumber,
      })
      const body = `${preset.emailMessage}\n\n${link}`
      const mailto = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      await Linking.openURL(mailto)
      setMsg('Email opened')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const qrUri = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`
    : null

  return (
    <View style={styles.root}>
      <AppText variant="sectionLabel">{preset.sectionTitle}</AppText>

      {qrUri ? (
        <View style={styles.qrWrap}>
          <Image source={{ uri: qrUri }} style={styles.qr} accessibilityLabel="QR code for portal link" />
          <AppText variant="caption" style={styles.qrLabel}>
            Scan to open portal
          </AppText>
        </View>
      ) : null}

      <PrimaryButton
        label={preset.primaryActionLabel}
        loading={busy}
        disabled={!clientEmail}
        onPress={() => void handleEmail()}
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
          onPress={() => void handleCopy()}
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
  qrWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  qr: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  qrLabel: {
    color: colors.textMuted,
  },
  hint: {
    color: colors.textMuted,
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
