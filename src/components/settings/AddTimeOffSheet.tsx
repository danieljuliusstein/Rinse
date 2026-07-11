import { useMemo } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FormField } from '@/src/components/FormField'
import { ScheduleTimeField, ScheduleTimeGrid } from '@/src/components/settings/ScheduleTimeField'
import { SettingsToggleRow } from '@/src/components/settings/SettingsToggleRow'
import { AppText, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, radii, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDayPill(date: string): { top: string; bottom: string } {
  const d = new Date(`${date}T12:00:00`)
  return {
    top: d.toLocaleDateString('en-US', { weekday: 'short' }),
    bottom: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }
}

export function AddTimeOffSheet({
  visible,
  saving,
  blockDate,
  blockAllDay,
  blockStart,
  blockEnd,
  blockLabel,
  onClose,
  onSave,
  onChangeDate,
  onChangeAllDay,
  onChangeStart,
  onChangeEnd,
  onChangeLabel,
}: {
  visible: boolean
  saving: boolean
  blockDate: string
  blockAllDay: boolean
  blockStart: string
  blockEnd: string
  blockLabel: string
  onClose: () => void
  onSave: () => void
  onChangeDate: (date: string) => void
  onChangeAllDay: (value: boolean) => void
  onChangeStart: (value: string) => void
  onChangeEnd: (value: string) => void
  onChangeLabel: (value: string) => void
}) {
  const insets = useSafeAreaInsets()
  const dayOptions = useMemo(() => {
    const start = todayIso()
    return Array.from({ length: 30 }, (_, i) => addDays(start, i))
  }, [])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <AppText style={styles.title}>Add time off</AppText>
          <AppText style={styles.subtitle}>Block your calendar for appointments or personal time</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <AppText style={styles.sectionLabel}>Date</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
            {dayOptions.map((date) => {
              const on = blockDate === date
              const pill = formatDayPill(date)
              return (
                <Pressable
                  key={date}
                  onPress={() => onChangeDate(date)}
                  style={[styles.dayPill, on ? styles.dayPillOn : null]}
                >
                  <AppText style={[styles.dayTop, on ? styles.dayTextOn : null]}>{pill.top}</AppText>
                  <AppText style={[styles.dayBottom, on ? styles.dayTextOn : null]}>{pill.bottom}</AppText>
                </Pressable>
              )
            })}
          </ScrollView>

          <SettingsToggleRow label="All day" value={blockAllDay} onChange={onChangeAllDay} />

          {!blockAllDay ? (
            <ScheduleTimeGrid>
              <ScheduleTimeField label="Start" value={blockStart} onChange={onChangeStart} />
              <ScheduleTimeField label="End" value={blockEnd} onChange={onChangeEnd} />
            </ScheduleTimeGrid>
          ) : null}

          <FormField
            label="Label (optional)"
            value={blockLabel}
            onChangeText={onChangeLabel}
            placeholder="Vacation, appointment…"
          />
        </ScrollView>

        <View style={styles.footer}>
          <SecondaryButton label="Cancel" onPress={onClose} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Add block'}
            onPress={onSave}
            loading={saving}
            disabled={!blockDate}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginLeft: 2,
  },
  dayRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dayPill: {
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  dayPillOn: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  dayTop: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.bodySemiBold,
  },
  dayBottom: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  dayTextOn: {
    color: '#fff',
  },
  footer: {
    gap: spacing.sm,
  },
})
