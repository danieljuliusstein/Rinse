'use client'

import { useEffect } from 'react'
import {
  Briefcase,
  CalendarCheck,
  CurrencyDollar,
  Medal,
  Trophy,
} from '@phosphor-icons/react'
import SettingsDetailShell from '@/components/settings/SettingsDetailShell'
import { ScreenLoading } from '@/components/ui'
import { useMilestones } from '@/hooks/useMilestones'
import { formatLifetimeEarned, MILESTONE_COUNT } from '@/lib/milestones'
import type { Milestone, MilestoneIcon } from '@/lib/milestones/types'

const ICONS: Record<MilestoneIcon, typeof Trophy> = {
  trophy: Trophy,
  medal: Medal,
  briefcase: Briefcase,
  dollar: CurrencyDollar,
  calendar: CalendarCheck,
}

function ProgressStatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="progress-stat-card">
      <div className="progress-stat-card__label">{label}</div>
      <div className="progress-stat-card__value">{value}</div>
      {sub ? <div className="progress-stat-card__sub">{sub}</div> : null}
    </div>
  )
}

function MilestoneRow({ milestone: m }: { milestone: Milestone }) {
  const unlocked = m.status === 'unlocked'
  const Icon = ICONS[m.icon]

  return (
    <div className={`milestone-row${unlocked ? '' : ' milestone-row--locked'}`}>
      <span className={`milestone-row__icon${unlocked ? ' milestone-row__icon--unlocked' : ' milestone-row__icon--locked'}`}>
        <Icon size={18} weight="duotone" aria-hidden="true" />
      </span>
      <span className="milestone-row__body">
        <span className={`milestone-row__title${unlocked ? '' : ' milestone-row__title--locked'}`}>
          {m.title}
        </span>
        <span className={`milestone-row__sub${unlocked ? '' : ' milestone-row__sub--locked'}`}>
          {unlocked ? `✓ ${m.unlockedAt}` : (m.progress ?? m.requirement)}
        </span>
      </span>
      <span className={`milestone-badge${unlocked ? ' milestone-badge--done' : ' milestone-badge--locked'}`}>
        {unlocked ? 'Done' : 'Locked'}
      </span>
    </div>
  )
}

export default function SettingsProgressPage() {
  const { milestones, totalJobs, totalEarned, unlockedCount, loading, markViewed } = useMilestones()

  useEffect(() => {
    markViewed()
  }, [markViewed])

  return (
    <SettingsDetailShell title="Your progress" showSave={false}>
      {loading ? (
        <ScreenLoading inline />
      ) : (
        <>
          <p className="settings-progress-intro">
            Milestones mark real wins from running your business — not points for opening the app.
          </p>

          <div className="progress-stat-grid">
            <ProgressStatCard
              label="Unlocked"
              value={`${unlockedCount}/${MILESTONE_COUNT}`}
              sub="milestones"
            />
            <ProgressStatCard label="Jobs" value={String(totalJobs)} sub="lifetime" />
            <ProgressStatCard
              label="Earned"
              value={formatLifetimeEarned(totalEarned)}
              sub="lifetime"
            />
          </div>

          <p className="progress-section-label">Milestones</p>
          <div className="milestone-list">
            {milestones.map((m) => (
              <MilestoneRow key={m.id} milestone={m} />
            ))}
          </div>
        </>
      )}
    </SettingsDetailShell>
  )
}
