import { useCallback, useState } from 'react'
import { Alert, StyleSheet } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import type { JobWithRelations } from '@rinse/core'
import { fmt } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText, EmptyState, ListRow, ScreenLoading, SectionGroup } from '@/src/components/ui'
import { listJobs } from '@/src/lib/api'
import { createInvoiceForJob } from '@/src/lib/invoices-api'
import { checkPremiumGate } from '@/src/lib/subscription'
import { trackProductEvent } from '@/src/lib/telemetry'
import { colors, spacing } from '@/src/theme/colors'

function jobAmount(job: JobWithRelations): number {
  return job.revenue + job.tip
}

function jobSubtitle(job: JobWithRelations): string {
  const date = job.date
  const pkg = job.package?.name ?? 'Service'
  return `${date} · ${pkg}`
}

export default function InvoicesNewScreen() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listJobs(200)
      const open = rows
        .filter((j) => !j.invoice_id)
        .sort((a, b) => b.date.localeCompare(a.date))
      setJobs(open)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const createForJob = async (job: JobWithRelations) => {
    setBusyId(job.id)
    try {
      const gate = await checkPremiumGate('create_invoice')
      if (!gate.allowed) return
      const created = await createInvoiceForJob(job.id)
      trackProductEvent('invoice_created', {
        job_id: job.id,
        amount: jobAmount(job),
      })
      router.replace(`/invoices/${created.id}`)
    } catch (e) {
      Alert.alert('Create invoice', e instanceof Error ? e.message : 'Could not create invoice')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppSheet title="Create invoice" subtitle="Pick a job without an invoice">
      {loading ? (
        <ScreenLoading variant="list" />
      ) : error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : jobs.length === 0 ? (
        <EmptyState
          illustration="jobs"
          title="No jobs to invoice"
          description="Complete a job first, then create an invoice from it."
          actionLabel="Open jobs"
          onAction={() => router.push('/(tabs)/jobs')}
        />
      ) : (
        <SectionGroup title={`${jobs.length} ready`}>
          {jobs.map((job, index) => (
            <ListRow
              key={job.id}
              title={job.client?.name ?? 'Client'}
              subtitle={jobSubtitle(job)}
              meta={busyId === job.id ? 'Creating…' : fmt(jobAmount(job))}
              showChevron={busyId !== job.id}
              isLast={index === jobs.length - 1}
              onPress={() => {
                if (busyId) return
                void createForJob(job)
              }}
            />
          ))}
        </SectionGroup>
      )}
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    paddingVertical: spacing.sm,
  },
})
