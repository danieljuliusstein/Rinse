import { useCallback, useState } from 'react'
import { AppState, StyleSheet, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { AppText, Badge, Card, SecondaryButton } from '@/src/components/ui'
import {
  fetchStripeConnectStatus,
  startStripeConnectOnboard,
  type StripeConnectStatus,
} from '@/src/lib/stripe-connect-api'
import { colors, spacing } from '@/src/theme/colors'

export function StripeConnectCard() {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnNotice, setReturnNotice] = useState<'checking' | 'incomplete' | 'complete' | null>(
    null,
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchStripeConnectStatus()
      setStatus(next)
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load Stripe status')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') void load()
      })
      return () => sub.remove()
    }, [load]),
  )

  const handleConnect = async () => {
    setBusy(true)
    setError(null)
    setReturnNotice(null)
    try {
      const url = await startStripeConnectOnboard()
      await WebBrowser.openBrowserAsync(url)
      setReturnNotice('checking')
      const next = await load()
      setReturnNotice(next?.ready ? 'complete' : 'incomplete')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open Stripe')
    } finally {
      setBusy(false)
    }
  }

  const ready = status?.ready === true

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AppText variant="bodySemiBold" style={styles.title}>
          Accept payments online
        </AppText>
        {!loading ? (
          <Badge tone={ready ? 'green' : 'amber'} label={ready ? 'Connected' : 'Setup needed'} />
        ) : null}
      </View>
      <AppText variant="body" style={styles.lead}>
        Connect your Stripe account so clients pay you directly when they tap Pay online on invoices.
        Available on Free. You pay applicable Stripe processing costs; Rinse adds no transaction commission. Subscription billing is separate.
      </AppText>

      {returnNotice === 'checking' ? (
        <AppText variant="body" style={styles.msg}>
          Returned from Stripe — checking status…
        </AppText>
      ) : null}
      {returnNotice === 'incomplete' ? (
        <AppText variant="body" style={styles.warn}>
          Stripe setup is not finished yet. Tap Connect Stripe to continue where you left off.
        </AppText>
      ) : null}
      {returnNotice === 'complete' ? (
        <AppText variant="body" style={styles.msg}>
          Stripe is connected — client invoices can accept Pay online.
        </AppText>
      ) : null}

      {!loading && status && !ready ? (
        <AppText variant="body" style={styles.status}>
          {status.accountId
            ? 'Finish Stripe onboarding to enable Pay online on client invoices.'
            : 'Connect Stripe to turn on Pay online for your portal invoices.'}
        </AppText>
      ) : null}
      {!loading && !ready ? (
        <AppText variant="caption" style={styles.hint}>
          Stripe opens in your browser. Use a real business email in Settings → Your business.
        </AppText>
      ) : null}
      {!loading && ready ? (
        <AppText variant="body" style={styles.status}>
          {status?.payoutsEnabled ? 'Payouts enabled. View payout dates, amounts, refunds and disputes in your Stripe dashboard.' : 'Payments enabled; payouts are pending Stripe verification. Open Stripe to review requirements.'}
        </AppText>
      ) : null}

      <SecondaryButton
        label={ready ? 'Open Stripe dashboard' : 'Connect Stripe'}
        onPress={() => void handleConnect()}
        loading={busy || loading}
        disabled={busy || loading}
        style={styles.cta}
      />
      {error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.text,
  },
  lead: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  status: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  msg: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  warn: {
    color: colors.amber,
    marginBottom: spacing.xs,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.sm,
  },
})
