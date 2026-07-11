import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { fmt } from '@rinse/core'
import type { QuoteWithRelations } from '@rinse/core'
import { LoadingState } from '@/src/components/ui/ScreenLoading'
import { AppText } from '@/src/components/ui/AppText'
import { Badge } from '@/src/components/ui/Badge'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui/Button'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { acceptQuote, getQuote, updateQuoteStatus } from '@/src/lib/quotes-api'
import { createPortalLink, sharePortalUrl } from '@/src/lib/share'
import { colors, radii, shadows, spacing } from '@/src/theme/colors'

interface QuoteDetailBodyProps {
  quoteId: string
  onClose?: () => void
  variant?: 'screen' | 'overlay'
  onRefresh?: () => void
}

function formatQuoteDateLabel(dateStr?: string): string {
  if (!dateStr?.trim()) return 'Date TBD'
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return 'Date TBD'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function QuoteDetailBody({ quoteId, onClose, variant = 'overlay', onRefresh }: QuoteDetailBodyProps) {
  const { openJob } = useDetailNavigation()
  const [quote, setQuote] = useState<QuoteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

  const canSend = quote != null && (quote.status === 'draft' || quote.status === 'sent')

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
      onRefresh?.()
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
        onRefresh?.()
        onClose?.()
        openJob(result.jobId)
      } else {
        Alert.alert('Accept', 'Could not convert quote to job')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (!quote) {
    return (
      <View style={styles.empty}>
        <AppText variant="body" style={styles.muted}>
          Quote not found
        </AppText>
      </View>
    )
  }

  const proposedLabel = formatQuoteDateLabel(quote.date)
  const validLabel = quote.valid_until ? formatQuoteDateLabel(quote.valid_until.split('T')[0]) : null
  const canAccept = !quote.job_id && quote.status !== 'declined' && quote.status !== 'expired'

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="h2" style={styles.quoteNumber}>
            {quote.quote_number || 'Quote'}
          </AppText>
          <Badge status={quote.status} />
        </View>

        <AppText variant="body" style={styles.clientName}>
          {quote.client?.name ?? 'Client'}
        </AppText>

        <View style={styles.docCard}>
          <AppText variant="bodySemiBold" style={styles.service}>
            {quote.package?.name ?? 'Service'} · {capitalize(quote.vehicle_type)}
          </AppText>
          <AppText variant="caption" style={styles.meta}>
            Proposed {proposedLabel}
          </AppText>
          <AppText variant="caption" style={styles.meta}>
            Valid until {validLabel ?? 'Date TBD'}
          </AppText>
          <AppText variant="bodySemiBold" style={styles.amount}>
            {fmt(quote.subtotal)}
          </AppText>
          {quote.notes ? (
            <AppText variant="caption" style={styles.notes}>
              {quote.notes}
            </AppText>
          ) : null}
        </View>

        {message ? (
          <AppText variant="caption" style={styles.success}>
            {message}
          </AppText>
        ) : null}

        {quote.job_id ? (
          <SecondaryButton
            label="View scheduled job"
            onPress={() => {
              onClose?.()
              openJob(quote.job_id!)
            }}
          />
        ) : null}

        {canAccept && quote.status === 'sent' ? (
          <SecondaryButton label="Accept & schedule job" loading={busy} onPress={() => void handleAccept()} />
        ) : null}
      </ScrollView>

      {canSend ? (
        <View style={[styles.dock, variant === 'overlay' ? styles.dockOverlay : null]}>
          <PrimaryButton label="Send" loading={busy} onPress={() => void handleSend()} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quoteNumber: {
    flex: 1,
  },
  clientName: {
    color: colors.textSecondary,
  },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.card,
  },
  service: {
    marginBottom: 2,
  },
  meta: {
    color: colors.textMuted,
  },
  amount: {
    fontSize: 28,
    lineHeight: 34,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  notes: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  success: {
    color: colors.greenText,
  },
  muted: {
    color: colors.textMuted,
  },
  dock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  dockOverlay: {
    paddingBottom: spacing.lg,
  },
})
