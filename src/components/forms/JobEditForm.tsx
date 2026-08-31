import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { jobEditFormSchema, jobHasPreJobInspection, requiresPreJobInspection, type JobEditFormValues, type JobWithRelations } from '@rinse/core'
import { FormField } from '@/src/components/FormField'
import { FormRow } from '@/src/components/forms/FormRow'
import { formatMoneyInput, parseMoneyInput } from '@/src/lib/money-input'
import { confirmUnblockDayIfNeeded } from '@/src/lib/confirm-unblock-day'
import { AffixField } from '@/src/components/ui/AffixField'
import { PillGroup } from '@/src/components/ui/PillGroup'
import { SectionGroup } from '@/src/components/ui/SectionGroup'
import { SheetSubmitButton } from '@/src/components/ui/SheetSubmitButton'
import { spacing } from '@/src/theme/colors'

const JOB_STATUSES = [
  { value: 'scheduled' as const, label: 'Scheduled' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'completed' as const, label: 'Completed' },
  { value: 'invoiced' as const, label: 'Invoiced' },
  { value: 'paid' as const, label: 'Paid' },
]

interface JobEditFormProps {
  job: JobWithRelations
  onSubmit: (values: JobEditFormValues) => Promise<void>
}

export function JobEditForm({ job, onSubmit }: JobEditFormProps) {
  const router = useRouter()
  const [done, setDone] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<JobEditFormValues>({
    resolver: zodResolver(jobEditFormSchema) as Resolver<JobEditFormValues>,
    defaultValues: {
      date: job.date,
      revenue: job.revenue,
      tip: job.tip,
      hours_worked: job.hours_worked,
      start_time: job.start_time ?? '',
      notes: job.notes ?? '',
      status: (JOB_STATUSES.some((s) => s.value === job.status)
        ? job.status
        : 'scheduled') as (typeof JOB_STATUSES)[number]['value'],
    },
    mode: 'onChange',
  })

  const save = handleSubmit(async (values) => {
    try {
      if (
        requiresPreJobInspection(job.status, values.status) &&
        !jobHasPreJobInspection(job)
      ) {
        Alert.alert(
          'Walkthrough required',
          'Complete the pre-job liability walkthrough before setting status to In progress.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open walkthrough',
              onPress: () => router.push(`/jobs/${job.id}/inspection` as never),
            },
          ],
        )
        return
      }

      const unblocked = await confirmUnblockDayIfNeeded(values.date)
      if (!unblocked) return

      await onSubmit(values)
      setDone(true)
      setTimeout(() => router.back(), 450)
    } catch (e) {
      Alert.alert('Could not save job', e instanceof Error ? e.message : 'Try again')
    }
  })

  return (
    <View style={styles.root}>
      <SectionGroup inset>
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <PillGroup
              label="Status"
              options={JOB_STATUSES}
              value={value}
              onChange={onChange}
              error={errors.status?.message}
            />
          )}
        />

        <FormRow>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <FormField label="Date" value={value} onChangeText={onChange} error={errors.date?.message} />
            )}
          />
          <Controller
            control={control}
            name="start_time"
            render={({ field: { value, onChange } }) => (
              <FormField
                label="Start time"
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="HH:MM"
                error={errors.start_time?.message}
              />
            )}
          />
        </FormRow>

        <FormRow>
          <Controller
            control={control}
            name="revenue"
            render={({ field: { value, onChange } }) => (
              <AffixField
                label="Revenue"
                value={formatMoneyInput(value)}
                onChangeText={(t) => onChange(parseMoneyInput(t))}
                error={errors.revenue?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="tip"
            render={({ field: { value, onChange } }) => (
              <AffixField
                label="Tip"
                value={formatMoneyInput(value)}
                onChangeText={(t) => onChange(parseMoneyInput(t))}
                error={errors.tip?.message}
              />
            )}
          />
        </FormRow>

        <Controller
          control={control}
          name="hours_worked"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Hours worked"
              value={value ? String(value) : ''}
              onChangeText={(t) => onChange(parseMoneyInput(t))}
              keyboardType="decimal-pad"
              error={errors.hours_worked?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Notes"
              value={value ?? ''}
              onChangeText={onChange}
              multiline
              error={errors.notes?.message}
            />
          )}
        />
      </SectionGroup>

      <SheetSubmitButton
        label="Save changes"
        ready={isValid}
        done={done}
        loading={isSubmitting}
        onPress={() => void save()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
})
