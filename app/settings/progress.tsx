import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import {
  Briefcase,
  CalendarCheck,
  CurrencyDollar,
  Medal,
  Trophy,
} from '@/src/icons'
import { SettingsScreen } from '@/src/components/SettingsScreen'
import { AppText, Card, ScreenLoading } from '@/src/components/ui'
import { listJobs } from '@/src/lib/api'
import { listLeads } from '@/src/lib/leads-api'
import { markMilestonesViewed } from '@/src/lib/milestones-viewed'
import {
  computeMilestoneState,
  formatLifetimeEarned,
  MILESTONE_COUNT,
  type Milestone,
  type MilestoneIcon,
} from '@/src/lib/milestones'
import { colors, iconTonePalette, shadows, spacing } from '@/src/theme/colors'
import { fonts } from '@/src/theme/typography'

const ICONS = {
  trophy: Trophy,
  medal: Medal,
  briefcase: Briefcase,
  dollar: CurrencyDollar,
  calendar: CalendarCheck,
} satisfies Record<MilestoneIcon, typeof Trophy>

function ProgressStatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <AppText variant="caption" style={styles.statLabel}>
        {label}
      </AppText>
      <AppText style={styles.statValue}>{value}</AppText>
      {sub ? <AppText style={styles.statSub}>{sub}</AppText> : null}
    </View>
  )
}

function MilestoneBadge({ unlocked }: { unlocked: boolean }) {
  return (
    <View style={[styles.milestoneBadge, unlocked ? styles.milestoneBadgeDone : styles.milestoneBadgeLocked]}>
      <AppText style={[styles.milestoneBadgeText, unlocked ? styles.milestoneBadgeTextDone : styles.milestoneBadgeTextLocked]}>
        {unlocked ? 'Done' : 'Locked'}
      </AppText>
    </View>
  )
}

function MilestoneRow({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const unlocked = milestone.status === 'unlocked'
  const Icon = ICONS[milestone.icon]

  return (
    <View style={[styles.milestoneRow, !unlocked && styles.milestoneRowLocked, !isLast && styles.milestoneRowBorder]}>
      <View style={[styles.milestoneIcon, unlocked ? styles.milestoneIconOn : styles.milestoneIconOff]}>
        <Icon size={18} color={unlocked ? colors.greenText : colors.textMuted} weight="duotone" />
      </View>
      <View style={styles.milestoneBody}>
        <AppText variant="bodyMedium" style={!unlocked ? styles.milestoneTitleLocked : undefined}>
          {milestone.title}
        </AppText>
        <AppText style={[styles.milestoneSub, unlocked ? styles.milestoneSubUnlocked : styles.milestoneSubLocked]}>
          {unlocked ? `✓ ${milestone.unlockedAt}` : (milestone.progress ?? milestone.requirement)}
        </AppText>
      </View>
      <MilestoneBadge unlocked={unlocked} />
    </View>
  )
}

export default function SettingsProgressScreen() {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState(() => computeMilestoneState([], []))

  useEffect(() => {
    void Promise.all([listJobs(500), listLeads()])
      .then(([jobs, leads]) => setState(computeMilestoneState(jobs, leads)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    void markMilestonesViewed()
  }, [loading])

  return (
    <SettingsScreen title="Your progress" subtitle="Milestones from your business activity">
      {loading ? (
        <ScreenLoading variant="list" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AppText variant="body" style={styles.intro}>
            Milestones mark real wins from running your business — not points for opening the app.
          </AppText>

          <View style={styles.statGrid}>
            <ProgressStatCard
              label="Unlocked"
              value={`${state.unlockedCount}/${MILESTONE_COUNT}`}
              sub="milestones"
            />
            <ProgressStatCard label="Jobs" value={String(state.totalJobs)} sub="lifetime" />
            <ProgressStatCard
              label="Earned"
              value={formatLifetimeEarned(state.totalEarned)}
              sub="lifetime"
            />
          </View>

          <AppText style={styles.sectionLabel}>Milestones</AppText>
          <Card style={styles.milestoneList}>
            {state.milestones.map((m, index) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                isLast={index === state.milestones.length - 1}
              />
            ))}
          </Card>
        </ScrollView>
      )}
    </SettingsScreen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  statSub: {
    fontSize: 11,
    color: colors.greenText,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  milestoneList: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 0,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  milestoneRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  milestoneRowLocked: {
    opacity: 0.85,
  },
  milestoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  milestoneIconOn: {
    backgroundColor: iconTonePalette.green.bg,
  },
  milestoneIconOff: {
    backgroundColor: colors.bg,
  },
  milestoneBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  milestoneTitleLocked: {
    color: colors.textSecondary,
  },
  milestoneSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  milestoneSubUnlocked: {
    color: colors.greenText,
  },
  milestoneSubLocked: {
    color: colors.textMuted,
  },
  milestoneBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  milestoneBadgeDone: {
    backgroundColor: iconTonePalette.green.bg,
  },
  milestoneBadgeLocked: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  milestoneBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  milestoneBadgeTextDone: {
    color: colors.greenText,
  },
  milestoneBadgeTextLocked: {
    color: colors.textMuted,
  },
})
