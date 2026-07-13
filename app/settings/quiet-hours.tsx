import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import {
  COMMON_TIME_ZONES,
  DEFAULT_QUIET_END_HOUR,
  DEFAULT_QUIET_START_HOUR,
  detectDeviceTimeZone,
  formatQuietHoursLabel,
  normalizeTimeZone,
} from '@rinse/core'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { ScheduleTimeField, ScheduleTimeGrid } from '@/src/components/settings/ScheduleTimeField'
import { SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { AppText, Card, PillGroup, PrimaryButton, ScreenLoading } from '@/src/components/ui'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import { colors, spacing } from '@/src/theme/colors'

function hourToTime(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function timeToHour(value: string, fallback: number): number {
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(value.trim())
  if (!match) return fallback
  const hour = Number(match[1])
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return fallback
  return Math.floor(hour)
}

export default function SettingsQuietHoursScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [timeZone, setTimeZone] = useState(detectDeviceTimeZone())
  const [startTime, setStartTime] = useState(hourToTime(DEFAULT_QUIET_START_HOUR))
  const [endTime, setEndTime] = useState(hourToTime(DEFAULT_QUIET_END_HOUR))

  const refresh = useCallback(async () => {
    const settings = await loadSettings()
    setEnabled(settings.quiet_hours_enabled !== false)
    setTimeZone(normalizeTimeZone(settings.timezone || detectDeviceTimeZone()))
    setStartTime(hourToTime(settings.quiet_start_hour ?? DEFAULT_QUIET_START_HOUR))
    setEndTime(hourToTime(settings.quiet_end_hour ?? DEFAULT_QUIET_END_HOUR))
  }, [])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const zoneOptions = useMemo(() => {
    const device = detectDeviceTimeZone()
    const base = COMMON_TIME_ZONES.map((z) => ({ value: z.value, label: z.label }))
    if (!base.some((z) => z.value === device)) {
      base.unshift({ value: device, label: `Device (${device})` })
    }
    return base
  }, [])

  const summary = formatQuietHoursLabel({
    enabled,
    timeZone,
    startHour: timeToHour(startTime, DEFAULT_QUIET_START_HOUR),
    endHour: timeToHour(endTime, DEFAULT_QUIET_END_HOUR),
  })

  const save = async () => {
    setSaving(true)
    try {
      await saveSettings({
        quiet_hours_enabled: enabled,
        timezone: timeZone,
        quiet_start_hour: timeToHour(startTime, DEFAULT_QUIET_START_HOUR),
        quiet_end_hour: timeToHour(endTime, DEFAULT_QUIET_END_HOUR),
      })
      Alert.alert('Saved', 'Quiet hours updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsScreen title="Quiet hours">
        <ScreenLoading />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Quiet hours" subtitle={summary}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="caption" style={styles.lede}>
          Auto emails (reminders, follow-ups, review requests) wait until morning in your timezone.
          Manual sends are unaffected.
        </AppText>

        <Card style={styles.card}>
          <SettingsToggleRow
            label="Quiet hours"
            value={enabled}
            onChange={setEnabled}
            hint="Default 9:00 PM – 8:00 AM"
          />
        </Card>

        {enabled ? (
          <>
            <AppText variant="sectionLabel" style={styles.section}>
              Timezone
            </AppText>
            <PillGroup
              options={zoneOptions}
              value={timeZone}
              onChange={(v) => setTimeZone(normalizeTimeZone(v))}
            />

            <AppText variant="sectionLabel" style={styles.section}>
              Window
            </AppText>
            <ScheduleTimeGrid>
              <ScheduleTimeField label="Starts" value={startTime} onChange={setStartTime} />
              <ScheduleTimeField label="Ends" value={endTime} onChange={setEndTime} />
            </ScheduleTimeGrid>
            <AppText variant="caption" style={styles.hint}>
              Messages that would send during this window are queued and delivered after the end
              time (on the next cron run).
            </AppText>
          </>
        ) : null}

        <View style={styles.save}>
          <PrimaryButton label="Save quiet hours" onPress={() => void save()} loading={saving} />
        </View>
      </ScrollView>
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  lede: {
    color: colors.textMuted,
    lineHeight: 18,
  },
  card: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  section: {
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
  },
  save: {
    marginTop: spacing.md,
  },
})
