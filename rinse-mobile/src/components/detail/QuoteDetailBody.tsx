import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { useNavigation } from 'expo-router'
import {
  fmt,
  formatBillingLineDetail,
  lineAmount,
  normalizeBillingLines,
  sumLineAmounts,
} from '@rinse/core'
import type { QuoteWithRelations } from '@rinse/core'
import {
  CalendarBlank,
  Car,
  CaretDown,
  CheckCircle,
  ClockCountdown,
  FileText,
  Note,
  PaperPlaneTilt,
  Plus,
  Trash,
  Wrench,
} from '@/src/icons'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { AppText } from '@/src/components/ui/AppText'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { acceptQuote, deleteQuote, getQuote, updateQuoteStatus } from '@/src/lib/quotes-api'
import { createPortalLink, sharePortalUrl } from '@/src/lib/share'
import { selectionHaptic } from '@/src/lib/haptics'
import { safeGoBack } from '@/src/lib/safe-go-back'
import { useDataRefresh } from '@/src/providers/DataRefreshProvider'
import { colors, shadows, spacing, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

interface QuoteDetailBodyProps {
  quoteId: string
  onClose?: () => void
  onRefresh?: () => void
}

function formatQuoteDateLabel(dateStr?: string): string {
  if (!dateStr?.trim()) return 'Date TBD'
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return 'Date TBD'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function statusLabel(status: string): string {
  if (!status) return 'Draft'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusColor(status: string): string {
  switch (status) {
    case 'sent':
    case 'accepted':
      return colors.greenText
    case 'declined':
      return colors.danger
    case 'expired':
      return colors.textDim
    default:
      return colors.textMuted
  }
}

export function QuoteDetailBody({ quoteId, onClose, onRefresh }: QuoteDetailBodyProps) {
  const navigation = useNavigation()
  const { openJob } = useDetailNavigation()
  const { bump } = useDataRefresh()
  const [quote, setQuote] = useState<QuoteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dismiss = useCallback(() => {
    if (onClose) onClose()
    else safeGoBack(navigation, '/(tabs)')
  }, [navigation, onClose])

  const notifyRefresh = useCallback(() => {
    bump()
    onRefresh?.()
  }, [bump, onRefresh])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setQuote(await getQuote(quoteId))
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSend = async () => {
    if (!quote) return
    setBusy(true)
    setMessage(null)
    try {
      if (quote.status === 'draft') {
        const updated = await updateQuoteStatus(quote.id, 'sent')
        if (updated) setQuote({ ...quote, ...updated })
      }
      const link = await createPortalLink({
        clientId: quote.client_id,
        scope: 'quote',
        quoteId: quote.id,
      })
      await sharePortalUrl(link.url, `Quote ${quote.quote_number} for ${quote.client?.name ?? 'client'}`)
      setMessage('Quote ready to send')
      notifyRefresh()
    } catch (e) {
      Alert.alert('Send', e instanceof Error ? e.message : 'Could not send quote')
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    if (!quote) return
    setBusy(true)
    try {
      const result = await acceptQuote(quote.id)
      if (result) {
        notifyRefresh()
        dismiss()
        openJob(result.jobId)
      } else {
        Alert.alert('Accept', 'Could not convert quote to job')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!quote) return
    setBusy(true)
    try {
      const ok = await deleteQuote(quote.id)
      if (!ok) {
        Alert.alert('Delete', 'Could not delete quote')
        return
      }
      notifyRefresh()
      dismiss()
    } catch (e) {
      Alert.alert('Delete', e instanceof Error ? e.message : 'Could not delete quote')
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const title = quote?.quote_number || 'Quote'
  const subtitle = quote ? statusLabel(quote.status) : undefined

  return (
    <AppSheet title={title} subtitle={subtitle} onClose={onClose}>
      {loading ? (
        <ScreenLoading label="Loading quote…" />
      ) : !quote ? (
        <AppText variant="body" style={styles.muted}>
          Quote not found
        </AppText>
      ) : (
        <QuoteDetailContent
          quote={quote}
          busy={busy}
          message={message}
          showDetails={showDetails}
          confirmDelete={confirmDelete}
          onToggleDetails={() => {
            selectionHaptic()
            setShowDetails((v) => !v)
          }}
          onSend={() => void handleSend()}
          onAccept={() => void handleAccept()}
          onAskDelete={() => {
            selectionHaptic()
            setConfirmDelete(true)
          }}
          onCancelDelete={() => setConfirmDelete(false)}
          onConfirmDelete={() => void handleDelete()}
          onViewJob={() => {
            dismiss()
            openJob(quote.job_id!)
          }}
        />
      )}
    </AppSheet>
  )
}

function QuoteDetailContent({
  quote,
  busy,
  message,
  showDetails,
  confirmDelete,
  onToggleDetails,
  onSend,
  onAccept,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onViewJob,
}: {
  quote: QuoteWithRelations
  busy: boolean
  message: string | null
  showDetails: boolean
  confirmDelete: boolean
  onToggleDetails: () => void
  onSend: () => void
  onAccept: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onViewJob: () => void
}) {
  const proposedLabel = formatQuoteDateLabel(quote.date)
  const validLabel = quote.valid_until
    ? formatQuoteDateLabel(quote.valid_until.split('T')[0])
    : null
  const extras = normalizeBillingLines(quote.extra_line_items)
  const packageAmount = Math.max(0, quote.subtotal - sumLineAmounts(extras))
  const canSend = quote.status === 'draft' || quote.status === 'sent'
  const canAccept =
    !quote.job_id && quote.status !== 'declined' && quote.status !== 'expired'
  const canDelete = !quote.job_id && quote.status !== 'accepted'
  const isConverted = Boolean(quote.job_id)

  return (
    <View style={styles.root}>
      <AppText style={[styles.status, { color: statusColor(quote.status) }]}>
        {statusLabel(quote.status)}
      </AppText>

      <View style={styles.card}>
        <AppText style={styles.clientName}>{quote.client?.name ?? 'Client'}</AppText>
        <View style={styles.metaRow}>
          <AppText style={styles.metaStrong}>{quote.package?.name ?? 'Service'}</AppText>
          <AppText style={styles.metaDot}>·</AppText>
          <AppText style={styles.meta}>{proposedLabel}</AppText>
        </View>
        <View style={styles.vehicleRow}>
          <Car size={14} color={colors.textDim} weight="duotone" />
          <AppText style={styles.vehicleLabel}>{capitalize(quote.vehicle_type)}</AppText>
        </View>
      </View>

      <View style={styles.card}>
        <AppText style={styles.totalEyebrow}>Total</AppText>
        <AppText style={styles.totalAmount}>{fmt(quote.subtotal)}</AppText>
      </View>

      <View style={styles.cardFlush}>
        <Pressable
          onPress={onToggleDetails}
          style={({ pressed }) => [styles.discloseBtn, webPressableReset, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showDetails }}
        >
          <View style={styles.discloseLeft}>
            <FileText size={16} color={colors.textMuted} weight="duotone" />
            <AppText style={styles.discloseLabel}>Offer details</AppText>
          </View>
          <View style={{ transform: [{ rotate: showDetails ? '180deg' : '0deg' }] }}>
            <CaretDown size={16} color={colors.textDim} weight="bold" />
          </View>
        </Pressable>

        {showDetails ? (
          <View style={styles.discloseBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <ClockCountdown size={14} color={colors.textMuted} weight="duotone" />
                <AppText style={styles.detailMuted}>Valid until</AppText>
              </View>
              <AppText style={styles.detailValue}>{validLabel ?? 'Date TBD'}</AppText>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Wrench size={14} color={colors.textDim} weight="duotone" />
                <AppText style={styles.detailMuted}>{quote.package?.name ?? 'Package'}</AppText>
              </View>
              <AppText style={styles.detailValue}>{fmt(packageAmount)}</AppText>
            </View>

            {extras.map((line) => (
              <View key={line.id} style={styles.detailRow}>
                <View style={[styles.detailLeft, styles.detailLeftFlex]}>
                  <Plus size={14} color={colors.textDim} weight="bold" />
                  <View style={styles.lineCopy}>
                    <AppText style={styles.detailMuted}>{line.description}</AppText>
                    {formatBillingLineDetail(line) ? (
                      <AppText style={styles.lineDetail}>{formatBillingLineDetail(line)}</AppText>
                    ) : null}
                  </View>
                </View>
                <AppText style={styles.detailValue}>{fmt(lineAmount(line))}</AppText>
              </View>
            ))}

            {quote.notes ? (
              <View style={styles.notesBlock}>
                <View style={styles.detailLeft}>
                  <Note size={14} color={colors.textMuted} weight="duotone" />
                  <AppText style={styles.notesEyebrow}>Notes</AppText>
                </View>
                <AppText style={styles.notesBody}>{quote.notes}</AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {message ? <AppText style={styles.success}>{message}</AppText> : null}

      <View style={styles.actions}>
        {canSend ? (
          <Pressable
            onPress={onSend}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryBtn,
              webPressableReset,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <PaperPlaneTilt size={16} color="#ffffff" weight="bold" />
                <AppText style={styles.primaryLabel}>
                  {quote.status === 'sent' ? 'Resend to client' : 'Send to client'}
                </AppText>
              </>
            )}
          </Pressable>
        ) : null}

        {isConverted ? (
          <Pressable
            onPress={onViewJob}
            style={({ pressed }) => [styles.primaryBtn, webPressableReset, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <CalendarBlank size={16} color="#ffffff" weight="bold" />
            <AppText style={styles.primaryLabel}>View scheduled job</AppText>
          </Pressable>
        ) : null}

        {canAccept && !isConverted ? (
          <Pressable
            onPress={onAccept}
            disabled={busy}
            style={({ pressed }) => [
              styles.secondaryBtn,
              webPressableReset,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <CheckCircle size={16} color={colors.textMuted} weight="duotone" />
                <AppText style={styles.secondaryLabel}>Accept & create job</AppText>
              </>
            )}
          </Pressable>
        ) : null}

        {canDelete && !confirmDelete ? (
          <Pressable
            onPress={onAskDelete}
            disabled={busy}
            style={({ pressed }) => [styles.secondaryBtn, webPressableReset, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Trash size={16} color={colors.textDim} weight="duotone" />
            <AppText style={styles.deleteLabel}>Delete quote</AppText>
          </Pressable>
        ) : null}

        {confirmDelete ? (
          <View style={styles.deleteConfirm}>
            <AppText style={styles.deleteConfirmCopy}>
              Delete this quote? This can’t be undone.
            </AppText>
            <View style={styles.deleteConfirmRow}>
              <Pressable
                onPress={onCancelDelete}
                style={({ pressed }) => [styles.keepBtn, webPressableReset, pressed && styles.pressed]}
              >
                <AppText style={styles.keepLabel}>Keep quote</AppText>
              </Pressable>
              <Pressable
                onPress={onConfirmDelete}
                disabled={busy}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  webPressableReset,
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Trash size={14} color="#ffffff" weight="bold" />
                    <AppText style={styles.deleteBtnLabel}>Delete</AppText>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {(quote.status === 'declined' || quote.status === 'expired') && !confirmDelete ? (
          <AppText style={styles.readOnlyHint}>
            {quote.status === 'declined'
              ? 'Client declined this quote.'
              : 'This quote has expired.'}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    paddingBottom: spacing.sm,
  },
  status: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...shadows.card,
  },
  cardFlush: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  clientName: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  metaStrong: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  metaDot: {
    fontSize: 13.5,
    color: colors.textDim,
  },
  meta: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vehicleLabel: {
    fontSize: 12.5,
    color: colors.textDim,
    fontFamily: fonts.body,
  },
  totalEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
    fontFamily: fonts.body,
  },
  discloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  discloseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discloseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  discloseBody: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLeftFlex: {
    flex: 1,
    minWidth: 0,
  },
  detailMuted: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    fontFamily: fonts.body,
  },
  lineCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  lineDetail: {
    fontSize: 11,
    color: colors.textDim,
    fontFamily: fonts.body,
  },
  notesBlock: {
    gap: 6,
    paddingTop: 4,
  },
  notesEyebrow: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: fonts.body,
  },
  notesBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontFamily: fonts.body,
    paddingLeft: 22,
  },
  success: {
    color: colors.greenText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  muted: {
    color: colors.textMuted,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: fonts.body,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  deleteLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  deleteConfirm: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  deleteConfirmCopy: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keepBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  deleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: fonts.body,
  },
  readOnlyHint: {
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: fonts.body,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
})
