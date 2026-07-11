import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScreenShell } from '@/src/components/ScreenShell'
import { DetailHeaderActions } from '@/src/components/DetailHeaderActions'
import { AppText } from '@/src/components/ui'
import { createInvoiceForJob, getInvoiceByJobId } from '@/src/lib/invoices-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { colors, spacing } from '@/src/theme/colors'

/** Thin bridge for PWA-style `/jobs/[id]/invoice` deep links. */
export default function JobInvoiceBridgeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!id) {
      setError('Missing job')
      return
    }
    try {
      const existing = await getInvoiceByJobId(id)
      if (existing) {
        router.replace(`/invoices/${existing.id}`)
        return
      }
      const gate = await checkPremiumGate('create_invoice')
      if (!gate.allowed) {
        setError('Upgrade required to create invoices')
        return
      }
      const created = await createInvoiceForJob(id)
      router.replace(`/invoices/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open invoice')
    }
  }, [id, router])

  useEffect(() => {
    void run()
  }, [run])

  return (
    <ScreenShell title="Invoice" headerRight={<DetailHeaderActions onBack={() => router.back()} />}>
      <View style={styles.body}>
        {error ? (
          <AppText variant="body" style={styles.error}>
            {error}
          </AppText>
        ) : (
          <>
            <ActivityIndicator color={colors.green} />
            <AppText variant="caption" style={styles.hint}>
              Opening invoice…
            </AppText>
          </>
        )}
      </View>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  hint: {
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
})
