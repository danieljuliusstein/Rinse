import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SubScreen } from '@/src/components/SubScreen'
import { formatJobDate } from '@/src/lib/format-dates'
import { AppText, CurrencyAmount, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { acceptQuote, deleteQuote, getQuote, updateQuoteStatus } from '@/src/lib/quotes-api'
import { createPortalLink, sharePortalUrl } from '@/src/lib/share'
import { colors, spacing } from '@/src/theme/colors'

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof getQuote>>>(null)

  useEffect(() => {
    if (!id) return
    void getQuote(id).then(setQuote)
  }, [id])

  if (!quote) {
    return (
      <SubScreen title="Quote" tabDock={false}>
        <AppText variant="body" style={styles.muted}>
          Loading…
        </AppText>
      </SubScreen>
    )
  }

  const handleSend = async () => {
    setBusy(true)
    try {
      const updated = await updateQuoteStatus(quote.id, 'sent')
      if (updated) setQuote({ ...quote, ...updated })
      const link = await createPortalLink({ clientId: quote.client_id, scope: 'quote', quoteId: quote.id })
      await sharePortalUrl(link.url, `Quote for ${quote.client?.name ?? 'client'}`)
    } catch (e) {
      Alert.alert('Send', e instanceof Error ? e.message : 'Could not send quote')
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    setBusy(true)
    try {
      const result = await acceptQuote(quote.id)
      if (result) router.replace(`/(tabs)/jobs/${result.jobId}`)
      else Alert.alert('Accept', 'Could not convert quote to job')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SubScreen title={quote.quote_number || 'Quote'} subtitle={quote.status} tabDock={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="bodySemiBold">{quote.client?.name}</AppText>
        <AppText variant="caption" style={styles.muted}>
          {quote.package?.name} · {formatJobDate(quote.date)}
        </AppText>
        <CurrencyAmount value={quote.subtotal} variant="neutral" size="stat" style={styles.amount} />
        {quote.notes ? <AppText variant="body">{quote.notes}</AppText> : null}

        {quote.status === 'draft' || quote.status === 'sent' ? (
          <PrimaryButton label="Send to client" loading={busy} onPress={() => void handleSend()} />
        ) : null}
        {!quote.job_id && quote.status !== 'declined' ? (
          <SecondaryButton label="Accept & create job" loading={busy} onPress={() => void handleAccept()} />
        ) : null}
        {quote.job_id ? (
          <SecondaryButton label="View job" onPress={() => router.push(`/(tabs)/jobs/${quote.job_id}`)} />
        ) : null}
        <SecondaryButton
          label="Delete quote"
          onPress={() => {
            Alert.alert('Delete quote?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => void deleteQuote(quote.id).then(() => router.back()),
              },
            ])
          }}
        />
      </ScrollView>
    </SubScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  muted: {
    color: colors.textMuted,
  },
  amount: {
    marginVertical: spacing.sm,
  },
})
