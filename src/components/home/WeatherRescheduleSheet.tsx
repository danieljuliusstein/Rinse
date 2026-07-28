import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { CloudRain } from 'phosphor-react-native'
import type { JobWithRelations } from '@rinse/core'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText, PillGroup, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { updateJob } from '@/src/lib/api'
import { sendSmsTemplate } from '@/src/lib/messages-api'
import { jobsForDate } from '@/src/lib/home-dashboard'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

function dateChips(from = new Date()): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (let i = 1; i <= 5; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const value = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    out.push({ value, label })
  }
  return out
}

export function WeatherRescheduleSheet({
  visible,
  onClose,
  jobs,
  today,
  onDone,
  rainChancePct = 80,
}: {
  visible: boolean
  onClose: () => void
  jobs: JobWithRelations[]
  today: string
  onDone?: () => void
  /** Optional risk copy; defaults to Make mock 80%. */
  rainChancePct?: number
}) {
  const outdoor = useMemo(
    () =>
      jobsForDate(jobs, today).filter(
        (j) =>
          j.location_type === 'mobile' &&
          (j.status === 'scheduled' || j.status === 'in_progress'),
      ),
    [jobs, today],
  )
  const chips = useMemo(() => dateChips(), [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [newDate, setNewDate] = useState(chips[0]?.value ?? today)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!visible) return
    setSelectedIds(outdoor.map((j) => j.id))
    setNewDate(chips[0]?.value ?? today)
  }, [visible, outdoor, chips, today])

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const newDateLabel = useMemo(() => {
    try {
      return new Date(`${newDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return newDate
    }
  }, [newDate])

  const todayLabel = useMemo(() => {
    try {
      return new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return today
    }
  }, [today])

  const send = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Reschedule', 'Select at least one job.')
      return
    }
    setBusy(true)
    try {
      for (const id of selectedIds) {
        const job = outdoor.find((j) => j.id === id)
        if (!job) continue
        await updateJob(id, {
          date: newDate,
          packageId: job.package_id,
          vehicleType: job.vehicle_type,
          locationType: job.location_type,
          revenue: job.revenue,
          tip: job.tip,
          hours_worked: job.hours_worked,
          start_time: job.start_time,
          status: job.status,
          notes: job.notes,
          weather_hold: true,
        })
        if (job.client_id) {
          try {
            await sendSmsTemplate({
              templateId: 'appointment_reminder',
              clientId: job.client_id,
              jobId: job.id,
              force: true,
            })
          } catch {
            // SMS best-effort
          }
        }
      }
      Alert.alert('Rescheduled', `${selectedIds.length} job(s) moved to ${newDate}.`)
      onDone?.()
      onClose()
    } catch (e) {
      Alert.alert('Reschedule', e instanceof Error ? e.message : 'Could not reschedule')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppSheet
      presentation="modal"
      visible={visible}
      title="Rain Day — Reschedule Jobs"
      subtitle="Move outdoor jobs and notify clients"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <SecondaryButton label="Skip" onPress={onClose} disabled={busy} style={styles.footerBtn} />
          <PrimaryButton
            label="Send SMS & Reschedule"
            loading={busy}
            onPress={() => void send()}
            style={styles.footerPrimary}
          />
        </View>
      }
    >
      <View style={styles.banner}>
        <CloudRain size={22} color={iconTonePalette.amber.fg} weight="duotone" />
        <View style={{ flex: 1 }}>
          <AppText variant="bodySemiBold" style={styles.bannerTitle}>
            {rainChancePct}% chance of rain · {todayLabel}
          </AppText>
          <AppText variant="caption" style={styles.bannerSub}>
            {outdoor.length} outdoor job{outdoor.length === 1 ? '' : 's'} affected
          </AppText>
        </View>
      </View>

      <AppText variant="sectionLabel">Select jobs to reschedule</AppText>
      {outdoor.length === 0 ? (
        <AppText variant="body" style={styles.muted}>
          No mobile jobs today to reschedule.
        </AppText>
      ) : (
        <View style={styles.card}>
          {outdoor.map((job, i) => {
            const on = selectedIds.includes(job.id)
            return (
              <Pressable
                key={job.id}
                onPress={() => toggle(job.id)}
                style={[styles.row, i < outdoor.length - 1 && styles.rowBorder]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.check, on && styles.checkOn]}>
                  {on ? (
                    <AppText variant="caption" style={styles.checkMark}>
                      ✓
                    </AppText>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemiBold">{job.client?.name ?? 'Client'}</AppText>
                  <AppText variant="caption" style={styles.muted}>
                    {job.start_time ? `${job.start_time} · ` : ''}
                    {job.package?.name ?? 'Detail'}
                  </AppText>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}

      <AppText variant="sectionLabel" style={styles.label}>
        Move to
      </AppText>
      <PillGroup
        options={chips.map((c) => ({ value: c.value, label: c.label }))}
        value={newDate}
        onChange={setNewDate}
      />

      <AppText variant="sectionLabel" style={styles.label}>
        Message preview
      </AppText>
      <View style={styles.preview}>
        <AppText variant="body">
          Hi {'{name}'} — due to weather we need to move your appointment to {newDateLabel}. Reply if that works!
        </AppText>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: iconTonePalette.amber.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: iconTonePalette.amber.fg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  bannerTitle: { color: '#92400e' },
  bannerSub: { color: '#b45309' },
  muted: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkMark: { color: '#fff', fontWeight: '700' },
  label: { marginTop: spacing.md, marginBottom: spacing.xs },
  preview: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
})
