import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'
import { AppSheet } from '@/src/components/ui/AppSheet'
import { AppText } from '@/src/components/ui/AppText'
import { selectionHaptic } from '@/src/lib/haptics'
import { colors, radii, spacing, webInlinePressableReset, webPressableReset } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIso(iso: string): Date {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

export function DatePickerSheet({
  visible,
  title = 'Pick a date',
  value,
  minDate,
  onClose,
  onSelect,
}: {
  visible: boolean
  title?: string
  value: string
  /** YYYY-MM-DD — days before this are disabled. Defaults to today. */
  minDate?: string
  onClose: () => void
  onSelect: (iso: string) => void
}) {
  const today = isoDate(new Date())
  const earliest = minDate ?? today
  const [viewDate, setViewDate] = useState(() => parseIso(value || today))

  useEffect(() => {
    if (visible) setViewDate(parseIso(value || today))
  }, [visible, value, today])

  const viewMonth = viewDate.getMonth()
  const viewYear = viewDate.getFullYear()
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - firstOfMonth.getDay())
    const cells: Date[] = []
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      cells.push(d)
    }
    const rows: Date[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [viewMonth, viewYear])

  const shiftMonth = (delta: number) => {
    selectionHaptic()
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <AppSheet presentation="modal" visible={visible} title={title} onClose={onClose}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Pressable
            accessibilityLabel="Previous month"
            onPress={() => shiftMonth(-1)}
            style={[styles.navBtn, webInlinePressableReset]}
          >
            <CaretLeft size={18} color={colors.textSecondary} />
          </Pressable>
          <AppText style={styles.monthLabel}>{monthLabel}</AppText>
          <Pressable
            accessibilityLabel="Next month"
            onPress={() => shiftMonth(1)}
            style={[styles.navBtn, webInlinePressableReset]}
          >
            <CaretRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <View key={d} style={styles.weekdayCell}>
              <AppText style={styles.weekday}>{d}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View key={`w-${wi}`} style={styles.weekRow}>
              {week.map((date) => {
                const iso = isoDate(date)
                const outside = date.getMonth() !== viewMonth
                const selected = value === iso
                const isToday = iso === today
                const disabled = iso < earliest

                return (
                  <Pressable
                    key={iso}
                    style={[styles.cell, webPressableReset]}
                    disabled={disabled}
                    onPress={() => {
                      if (disabled) return
                      selectionHaptic()
                      onSelect(iso)
                      onClose()
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    accessibilityLabel={iso}
                  >
                    <View
                      style={[
                        styles.dayBubble,
                        selected && styles.dayBubbleSelected,
                        isToday && !selected && styles.dayBubbleToday,
                        disabled && styles.dayBubbleDisabled,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.dayNum,
                          outside && styles.dayOutside,
                          selected && styles.daySelected,
                          isToday && !selected && styles.dayToday,
                          disabled && styles.dayDisabled,
                        ]}
                      >
                        {date.getDate()}
                      </AppText>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>
      </View>
    </AppSheet>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.bg,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fonts.body,
  },
  grid: {
    gap: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleSelected: {
    backgroundColor: colors.green,
  },
  dayBubbleToday: {
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  dayBubbleDisabled: {
    opacity: 0.35,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  dayOutside: {
    color: colors.textDim,
  },
  daySelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayToday: {
    color: colors.greenText,
    fontWeight: '700',
  },
  dayDisabled: {
    color: colors.textDim,
  },
})
