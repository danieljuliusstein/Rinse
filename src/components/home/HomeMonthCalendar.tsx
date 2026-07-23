import { useMemo, useState, useEffect, useRef } from 'react'
import { PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'
import type { JobWithRelations } from '@rinse/core'
import { AppText } from '@/src/components/ui'
import { selectionHaptic } from '@/src/lib/haptics'
import { normalizeJobDate } from '@/src/lib/jobs-list'
import type { WeatherReadinessResult } from '@/src/lib/weather-readiness'
import { colors, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'
import { homeCardStyles } from './homeCardStyles'

interface HomeMonthCalendarProps {
  jobs: JobWithRelations[]
  selectedDate?: string | null
  onSelectDate?: (iso: string | null) => void
  /** Fired when the operator taps a blocked (greyed) day. */
  onBlockedDatePress?: (iso: string) => void
  weatherReadiness?: WeatherReadinessResult | null
  blockedDates?: Set<string>
  onViewMonthChange?: (year: number, month: number) => void
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function rainRiskDates(result: WeatherReadinessResult | null | undefined): Set<string> {
  const set = new Set<string>()
  if (!result) return set
  for (const row of result.rows) {
    if (row.kind === 'risk' && 'date' in row && row.date) set.add(String(row.date))
  }
  return set
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function HomeMonthCalendar({
  jobs,
  selectedDate,
  onSelectDate,
  onBlockedDatePress,
  weatherReadiness,
  blockedDates,
  onViewMonthChange,
}: HomeMonthCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const viewMonth = viewDate.getMonth()
  const viewYear = viewDate.getFullYear()

  useEffect(() => {
    onViewMonthChange?.(viewYear, viewMonth)
    // Notify parent when the visible month changes — callback identity is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth])

  const jobDates = useMemo(() => new Set(jobs.map((j) => normalizeJobDate(j.date))), [jobs])
  const rainDates = useMemo(() => rainRiskDates(weatherReadiness), [weatherReadiness])

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = isoDate(new Date())

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - firstOfMonth.getDay())
    const list: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      list.push(d)
    }
    return list
  }, [viewMonth, viewYear])

  const shiftMonth = (delta: number) => {
    selectionHaptic()
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }
  const shiftMonthRef = useRef(shiftMonth)
  shiftMonthRef.current = shiftMonth

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -48 || g.vx < -0.4) shiftMonthRef.current(1)
        else if (g.dx >= 48 || g.vx > 0.4) shiftMonthRef.current(-1)
      },
    }),
  ).current

  const weeks = useMemo(() => {
    const rows: Date[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cells])

  const renderDay = (date: Date) => {
    const iso = isoDate(date)
    const outside = date.getMonth() !== viewMonth
    const hasJobs = jobDates.has(iso)
    const rain = rainDates.has(iso)
    const blocked = blockedDates?.has(iso) ?? false
    const selected = selectedDate === iso
    const isToday = iso === today
    return (
      <Pressable
        key={iso}
        style={styles.cell}
        onPress={() => {
          if (blocked) {
            onBlockedDatePress?.(iso)
            return
          }
          onSelectDate?.(selected ? null : iso)
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
        accessibilityHint={blocked ? 'Day is blocked. Double tap to manage time off.' : undefined}
      >
        <View
          style={[
            styles.dayBubble,
            selected && styles.dayBubbleSelected,
            isToday && !selected && styles.dayBubbleToday,
            blocked && styles.dayBubbleBlocked,
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.dayNum,
              outside && styles.dayOutside,
              selected && styles.daySelected,
              isToday && !selected && styles.dayToday,
              blocked && styles.dayBlocked,
            ]}
          >
            {date.getDate()}
          </AppText>
        </View>
        <View style={styles.dots}>
          {hasJobs ? <View style={[styles.dot, styles.dotJob]} /> : null}
          {rain ? <View style={[styles.dot, styles.dotRain]} /> : null}
          {blocked ? <View style={[styles.dot, styles.dotBlocked]} /> : null}
        </View>
      </Pressable>
    )
  }

  return (
    <View style={homeCardStyles.card} {...panResponder.panHandlers}>
      <View style={styles.head}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          style={styles.navBtn}
        >
          <CaretLeft size={18} color={colors.textSecondary} />
        </Pressable>
        <AppText variant="bodyMedium" style={styles.monthLabel}>
          {monthLabel}
        </AppText>
        <Pressable
          accessibilityLabel="Next month"
          onPress={() => shiftMonth(1)}
          style={styles.navBtn}
        >
          <CaretRight size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <AppText variant="caption" style={styles.weekday}>
              {d}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={`w-${wi}`} style={styles.weekRow}>
            {week.map(renderDay)}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotJob]} />
          <AppText variant="caption" style={styles.legendText}>
            Job scheduled
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotRain]} />
          <AppText variant="caption" style={styles.legendText}>
            Rain risk
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dotBlocked]} />
          <AppText variant="caption" style={styles.legendText}>
            Blocked day
          </AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    padding: 6,
  },
  monthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekday: {
    color: colors.textMuted,
    fontSize: 11,
  },
  grid: {
    width: '100%',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: Platform.OS === 'web' ? 48 : 44,
  },
  dayBubble: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dayBubbleSelected: {
    backgroundColor: colors.green,
  },
  dayBubbleToday: {
    borderWidth: 1,
    borderColor: colors.green,
  },
  dayBubbleBlocked: {
    opacity: 0.45,
  },
  dayNum: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  dayOutside: {
    color: colors.textMuted,
    opacity: 0.55,
  },
  daySelected: {
    color: '#ffffff',
    fontFamily: fonts.bodySemiBold,
  },
  dayToday: {
    color: colors.green,
    fontFamily: fonts.bodySemiBold,
  },
  dayBlocked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    minHeight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotJob: {
    backgroundColor: colors.green,
  },
  dotRain: {
    backgroundColor: colors.amber,
  },
  dotBlocked: {
    backgroundColor: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
})
