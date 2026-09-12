import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import type { JobEditData, JobEditFormValues, JobWithRelations } from '@rinse/core'
import { getJob, updateJob } from '@/src/lib/api'
import { useOffline } from '@/src/providers/OfflineProvider'
import { JobEditForm } from '@/src/components/forms/JobEditForm'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText } from '@/src/components/ui/AppText'
import { ScreenLoading } from '@/src/components/ui/ScreenLoading'
import { colors, spacing } from '@/src/theme/colors'

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { refresh: refreshQueue } = useOffline()
  const [job, setJob] = useState<JobWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void getJob(id)
      .then((row) => {
        if (!cancelled) setJob(row)
      })
      .catch((e) => {
        if (!cancelled) Alert.alert('Load failed', e instanceof Error ? e.message : 'Try again')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSubmit = async (values: JobEditFormValues) => {
    if (!id || !job) return

    const editData: JobEditData = {
      date: values.date,
      packageId: job.package_id,
      vehicleType: job.vehicle_type,
      locationType: job.location_type,
      revenue: values.revenue,
      tip: values.tip ?? 0,
      hours_worked: values.hours_worked ?? job.hours_worked,
      status: values.status,
      notes: values.notes,
      start_time: values.start_time,
      travel_cost: job.travel_cost,
      marketing_cost: job.marketing_cost,
      equipment_depreciation: job.equipment_depreciation,
    }

    await updateJob(id, editData)
    await refreshQueue()
  }

  if (loading) {
    return (
      <AppSheet title="Edit job">
        <ScreenLoading label="Loading job…" />
      </AppSheet>
    )
  }

  if (!job) {
    return (
      <AppSheet title="Edit job">
        <AppText variant="body" style={{ color: colors.danger, padding: spacing.md }}>
          Job not found
        </AppText>
      </AppSheet>
    )
  }

  return (
    <AppSheet title="Edit job" subtitle={job.client?.name ?? job.date}>
      <JobEditForm job={job} onSubmit={handleSubmit} />
    </AppSheet>
  )
}
