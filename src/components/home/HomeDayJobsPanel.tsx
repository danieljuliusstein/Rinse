import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useDetailNavigation } from '@/src/hooks/useDetailNavigation'
import { Car } from 'phosphor-react-native'
import { fmt } from '@rinse/core'
import type { JobWithRelations } from '@rinse/core'
import { AppText, ListRow, SectionGroup } from '@/src/components/ui'
import { jobListBadgeTone, jobListStatusLabel } from '@/src/lib/jobs-list'
import { jobsForDate } from '@/src/lib/home-dashboard'
import { colors, iconTonePalette, spacing } from '@/src/theme/colors'

interface HomeDayJobsPanelProps {
  date: string
  jobs: JobWithRelations[]
  onClear: () => void
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function HomeDayJobsPanel({ date, jobs, onClear }: HomeDayJobsPanelProps) {
  const router = useRouter()
  const { openJob } = useDetailNavigation()
  const dayJobs = useMemo(() => jobsForDate(jobs, date), [jobs, date])

  const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <AppText variant="bodySemiBold">{label}</AppText>
        <Pressable onPress={onClear} accessibilityRole="button" hitSlop={8}>
          <AppText variant="caption" style={styles.clear}>
            Clear
          </AppText>
        </Pressable>
      </View>

      {dayJobs.length === 0 ? (
        <AppText variant="caption" style={styles.hint}>
          No jobs scheduled —{' '}
          <AppText
            variant="caption"
            style={styles.link}
            onPress={() => router.push(`/jobs/new?date=${date}` as never)}
          >
            Add one
          </AppText>
        </AppText>
      ) : (
        <>
          <SectionGroup title={`${dayJobs.length} job${dayJobs.length === 1 ? '' : 's'}`}>
            {dayJobs.map((job) => (
              <ListRow
                key={job.id}
                icon={<Car size={18} color={iconTonePalette.green.fg} weight="duotone" />}
                iconTone="green"
                title={job.client?.name ?? 'Client'}
                subtitle={`${job.package?.name ?? 'Detail'} · ${capitalize(job.vehicle_type)}`}
                badgeLabel={jobListStatusLabel(job)}
                badgeTone={jobListBadgeTone(job)}
                trailing={<AppText variant="bodySemiBold">{fmt(job.revenue + job.tip)}</AppText>}
                onPress={() => openJob(job.id)}
              />
            ))}
          </SectionGroup>
          <Pressable
            onPress={() => router.push(`/(tabs)/jobs?date=${date}` as never)}
            accessibilityRole="button"
            style={styles.viewAll}
          >
            <AppText variant="caption" style={styles.link}>
              View all in Jobs
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  clear: {
    color: colors.textMuted,
  },
  hint: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.green,
  },
  viewAll: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
})
