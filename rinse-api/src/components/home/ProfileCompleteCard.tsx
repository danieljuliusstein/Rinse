'use client'

import { useRouter } from 'next/navigation'
import { CaretRight } from '@phosphor-icons/react'
import type { ProfileCompletion } from '@/lib/profile-completion'

const RING_RADIUS = 15.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface ProfileCompleteCardProps {
  completion: ProfileCompletion
  compact?: boolean
}

export default function ProfileCompleteCard({ completion, compact = false }: ProfileCompleteCardProps) {
  const router = useRouter()
  const href = completion.nextStep?.href ?? '/settings/business'
  const remaining = completion.totalCount - completion.completedCount
  const subtitle = completion.nextStep
    ? `Next: ${completion.nextStep.label}`
    : 'Finish your business profile'
  const dashOffset = RING_CIRCUMFERENCE * (1 - completion.percent / 100)

  return (
    <button
      type="button"
      className={`profile-complete-card${compact ? ' profile-complete-card--compact' : ''}`}
      data-tour="profile-complete"
      onClick={() => router.push(href)}
      aria-label={`Complete your profile, ${completion.completedCount} of ${completion.totalCount} done`}
    >
      <div className="profile-complete-card__ring" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="profile-complete-card__svg">
          <circle className="profile-complete-card__track" cx="18" cy="18" r={RING_RADIUS} />
          <circle
            className="profile-complete-card__progress"
            cx="18"
            cy="18"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span className="profile-complete-card__percent">{completion.percent}%</span>
      </div>
      <div className="profile-complete-card__body">
        <p className="profile-complete-card__title">Complete your profile</p>
        <p className="profile-complete-card__subtitle">
          {subtitle}
          {!compact && remaining > 0 ? ` · ${remaining} left` : ''}
        </p>
      </div>
      <CaretRight className="profile-complete-card__chevron" size={16} weight="bold" aria-hidden="true" />
    </button>
  )
}
