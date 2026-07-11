import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Plus } from 'phosphor-react-native'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AddTimeOffSheet } from '@/src/components/settings/AddTimeOffSheet'
import { BusinessFilledField } from '@/src/components/settings/BusinessFilledField'
import { ScheduleTimeField, ScheduleTimeGrid } from '@/src/components/settings/ScheduleTimeField'
import { SettingsPanelDivider, SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { WorkDayPills } from '@/src/components/settings/WorkDayPills'
import {
  AppText,
  Card,
  PillGroup,
  PrimaryButton,
  ScreenLoading,
  SwipeableRow,
} from '@/src/components/ui'
import { bookingPageUrl } from '@/src/lib/booking-embed'
import { DEFAULT_BOOKING_SCHEDULE, lunchBreakEnabled, SLOT_INTERVALS, type BookingSchedule } from '@/src/lib/booking-schedule'
import { formatStartTimeLabel } from '@/src/lib/home-dashboard'
import { appOrigin, loadOrganizationSlug } from '@/src/lib/org-slug'
import { loadSettings, saveSettings } from '@/src/lib/settings-store'
import {
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlocks,
  type TimeBlock,
} from '@/src/lib/time-blocks-api'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatBlockDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatBlockTime(block: TimeBlock): string {
  if (block.all_day) return 'All day'
  if (block.start_time && block.end_time) {
    const start = formatStartTimeLabel(block.start_time) ?? block.start_time
    const end = formatStartTimeLabel(block.end_time) ?? block.end_time
    return `${start} – ${end}`
  }
  return 'Blocked'
}

const INTERVAL_OPTIONS = SLOT_INTERVALS.map((mins) => ({
  value: String(mins),
  label: `${mins} min`,
}))

export default function SettingsScheduleScreen() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<BookingSchedule>({ ...DEFAULT_BOOKING_SCHEDULE })
  const [travelRate, setTravelRate] = useState('')
  const [slug, setSlug] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [openRowId, setOpenRowId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [blockDate, setBlockDate] = useState(todayIso())
  const [blockAllDay, setBlockAllDay] = useState(true)
  const [blockStart, setBlockStart] = useState('09:00')
  const [blockEnd, setBlockEnd] = useState('12:00')
  const [blockLabel, setBlockLabel] = useState('')
  const [savingBlock, setSavingBlock] = useState(false)

  const lunchEnabled = lunchBreakEnabled(schedule)

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true)
    try {
      const from = todayIso()
      const to = addDays(from, 30)
      setBlocks(await getTimeBlocks(from, to))
    } finally {
      setBlocksLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    const [settings, orgSlug] = await Promise.all([loadSettings(), loadOrganizationSlug()])
    setSchedule(settings.booking_schedule ?? { ...DEFAULT_BOOKING_SCHEDULE })
    setTravelRate(
      settings.travel_rate_per_mile != null && settings.travel_rate_per_mile > 0
        ? String(settings.travel_rate_per_mile)
        : '',
    )
    setSlug(orgSlug)
  }, [])

  useEffect(() => {
    void Promise.all([refresh(), loadBlocks()]).finally(() => setLoading(false))
  }, [loadBlocks, refresh])

  const bookingUrl = useMemo(() => {
    if (!slug) return null
    return bookingPageUrl(appOrigin(), slug)
  }, [slug])

  const patchSchedule = (patch: Partial<BookingSchedule>) => {
    setSchedule((prev) => ({ ...prev, ...patch }))
  }

  const toggleWorkDay = (day: number) => {
    const next = schedule.work_days.includes(day)
      ? schedule.work_days.filter((d) => d !== day)
      : [...schedule.work_days, day].sort((a, b) => a - b)
    patchSchedule({ work_days: next })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsedRate = travelRate.trim() ? Number(travelRate) : undefined
      await saveSettings({
        booking_schedule: schedule,
        travel_rate_per_mile: parsedRate && !Number.isNaN(parsedRate) ? parsedRate : undefined,
      })
      Alert.alert('Saved', 'Schedule updated.')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBlock = async () => {
    if (!blockDate) return
    setSavingBlock(true)
    try {
      await createTimeBlock({
        date: blockDate,
        all_day: blockAllDay,
        start_time: blockAllDay ? undefined : blockStart,
        end_time: blockAllDay ? undefined : blockEnd,
        label: blockLabel.trim() || undefined,
      })
      setAddOpen(false)
      setBlockDate(todayIso())
      setBlockLabel('')
      setBlockAllDay(true)
      await loadBlocks()
    } catch (e) {
      Alert.alert('Could not add time off', e instanceof Error ? e.message : 'Try again')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleDeleteBlock = (block: TimeBlock) => {
    Alert.alert(
      'Remove time off?',
      `Remove time off on ${formatBlockDate(block.date)}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteTimeBlock(block.id)
              setOpenRowId(null)
              await loadBlocks()
            })()
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <SettingsScreen title="Schedule & time off" subtitle="Booking hours">
        <ScreenLoading variant="list" />
      </SettingsScreen>
    )
  }

  return (
    <SettingsScreen title="Schedule & time off" subtitle="Booking hours">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.panel}>
          <View style={styles.section}>
            <AppText style={styles.sectionHead}>Work days</AppText>
            <AppText style={styles.sectionDesc}>Days clients can book online.</AppText>
            <WorkDayPills selected={schedule.work_days} onToggle={toggleWorkDay} />
            {bookingUrl ? (
              <Pressable onPress={() => void Linking.openURL(bookingUrl)}>
                <AppText style={styles.previewLink}>Preview booking calendar →</AppText>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionHead}>Business hours</AppText>
            <ScheduleTimeGrid>
              <ScheduleTimeField
                label="Start"
                value={schedule.start_time}
                onChange={(start_time) => patchSchedule({ start_time })}
              />
              <ScheduleTimeField
                label="End"
                value={schedule.end_time}
                onChange={(end_time) => patchSchedule({ end_time })}
              />
            </ScheduleTimeGrid>
          </View>

          <SettingsToggleRow
            label="Lunch break"
            hint="Block a daily lunch window from booking."
            value={lunchEnabled}
            onChange={(on) =>
              patchSchedule(
                on
                  ? { lunch_start: '12:00', lunch_end: '13:00' }
                  : { lunch_start: '', lunch_end: '' },
              )
            }
          />

          {lunchEnabled ? (
            <ScheduleTimeGrid>
              <ScheduleTimeField
                label="Lunch start"
                value={schedule.lunch_start ?? ''}
                onChange={(lunch_start) => patchSchedule({ lunch_start })}
              />
              <ScheduleTimeField
                label="Lunch end"
                value={schedule.lunch_end ?? ''}
                onChange={(lunch_end) => patchSchedule({ lunch_end })}
              />
            </ScheduleTimeGrid>
          ) : null}

          <View style={styles.section}>
            <AppText style={styles.sectionHead}>Booking slot interval</AppText>
            <PillGroup
              inline
              options={INTERVAL_OPTIONS}
              value={String(schedule.slot_interval_minutes)}
              onChange={(value) => patchSchedule({ slot_interval_minutes: Number(value) })}
            />
          </View>

          <View style={styles.section}>
            <BusinessFilledField
              label="Travel rate ($/mile)"
              value={travelRate}
              onChangeText={setTravelRate}
              keyboardType="decimal-pad"
              optional
              prefix="$"
            />
            <AppText style={styles.fieldHint}>
              Optional. Used to auto-calculate travel costs from miles on job expenses.
            </AppText>
          </View>

          <SettingsPanelDivider />

          <View style={styles.timeOffHeader}>
            <View style={styles.timeOffCopy}>
              <AppText style={styles.sectionHead}>Time off</AppText>
              <AppText style={styles.sectionDesc}>Next 30 days — blocks online booking.</AppText>
            </View>
            <Pressable
              accessibilityLabel="Add time off"
              style={styles.addBtn}
              onPress={() => {
                setBlockDate(todayIso())
                setAddOpen(true)
              }}
            >
              <Plus size={20} color={colors.greenText} weight="bold" />
            </Pressable>
          </View>

          {blocksLoading ? (
            <ScreenLoading variant="list" />
          ) : blocks.length === 0 ? (
            <AppText style={styles.fieldHint}>No upcoming time off.</AppText>
          ) : (
            <View style={styles.blockList}>
              {blocks.map((block, index) => (
                <SwipeableRow
                  key={block.id}
                  rowId={block.id}
                  openRowId={openRowId}
                  onOpenChange={setOpenRowId}
                  onEdit={() => {}}
                  onDelete={() => handleDeleteBlock(block)}
                  style={index < blocks.length - 1 ? styles.blockRow : undefined}
                >
                  <View style={styles.blockRowInner}>
                    <AppText variant="bodySemiBold">{formatBlockDate(block.date)}</AppText>
                    <AppText variant="caption" style={styles.blockSub}>
                      {formatBlockTime(block)}
                      {block.label ? ` · ${block.label}` : ''}
                    </AppText>
                  </View>
                </SwipeableRow>
              ))}
            </View>
          )}
        </Card>

        <PrimaryButton label={saving ? 'Saving…' : 'Save settings'} onPress={() => void handleSave()} loading={saving} />
      </ScrollView>

      <AddTimeOffSheet
        visible={addOpen}
        saving={savingBlock}
        blockDate={blockDate}
        blockAllDay={blockAllDay}
        blockStart={blockStart}
        blockEnd={blockEnd}
        blockLabel={blockLabel}
        onClose={() => setAddOpen(false)}
        onSave={() => void handleAddBlock()}
        onChangeDate={setBlockDate}
        onChangeAllDay={setBlockAllDay}
        onChangeStart={setBlockStart}
        onChangeEnd={setBlockEnd}
        onChangeLabel={setBlockLabel}
      />
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  panel: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  sectionDesc: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewLink: {
    color: colors.greenText,
    fontFamily: fonts.bodySemiBold,
    marginTop: 2,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  timeOffHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timeOffCopy: {
    flex: 1,
    gap: 4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: iconTonePalette.green.bg,
  },
  blockList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  blockRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  blockRowInner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  blockSub: {
    color: colors.textSecondary,
  },
})
