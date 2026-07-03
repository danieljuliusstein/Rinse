'use client'

import { useRouter } from 'next/navigation'
import { Crown, Sparkle } from '@phosphor-icons/react'
import BottomSheet from '@/components/BottomSheet'
import { Button } from '@/components/ui'
import { useOrgSubscription } from '@/hooks/useOrgSubscription'
import { PRO_PLAN, STARTER_PLAN } from '@/lib/plans'

interface PaywallSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotNow?: () => void
  feature?: string
  mode?: 'nudge' | 'lapsed'
}

export default function PaywallSheet({
  open,
  onOpenChange,
  onNotNow,
  feature,
  mode = 'lapsed',
}: PaywallSheetProps) {
  const router = useRouter()
  const { daysLeft, showTrialBanner, founding } = useOrgSubscription()

  if (!open) return null

  const lead =
    mode === 'nudge'
      ? feature
        ? `${feature} stays available on Starter — subscribe before your trial ends.`
        : 'Subscribe before your trial ends to keep full access.'
      : feature
        ? `${feature} requires an active Rinse subscription.`
        : 'Subscribe to unlock premium actions in Rinse.'

  return (
    <BottomSheet title="Upgrade to keep going" onClose={() => onOpenChange(false)}>
      <div className="paywall-sheet">
        <div className="paywall-sheet__icon" aria-hidden="true">
          <Crown size={28} weight="duotone" />
        </div>
        <p className="paywall-sheet__lead">{lead}</p>
        {showTrialBanner && daysLeft != null ? (
          <p className="paywall-sheet__trial">
            <Sparkle size={14} aria-hidden="true" /> {daysLeft} day{daysLeft === 1 ? '' : 's'} left in
            trial
          </p>
        ) : null}
        {founding ? (
          <p className="paywall-sheet__trial">Founding member — billing waived</p>
        ) : (
          <div className="paywall-sheet__plans">
            <div className="paywall-sheet__plan">
              <div>
                <strong>{STARTER_PLAN.name}</strong>
                <span>{STARTER_PLAN.tagline}</span>
              </div>
              <span className="paywall-sheet__price">{STARTER_PLAN.priceLabel}</span>
            </div>
            {PRO_PLAN.comingSoon ? (
              <p className="paywall-sheet__coming-soon">{PRO_PLAN.name} — coming soon</p>
            ) : (
              <div className="paywall-sheet__plan">
                <div>
                  <strong>{PRO_PLAN.name}</strong>
                  <span>{PRO_PLAN.tagline}</span>
                  {PRO_PLAN.footnote ? <span>{PRO_PLAN.footnote}</span> : null}
                </div>
                <span className="paywall-sheet__price">{PRO_PLAN.priceLabel}</span>
              </div>
            )}
          </div>
        )}
        <Button
          variant="primary"
          onClick={() => {
            onOpenChange(false)
            router.push('/settings/billing')
          }}
        >
          View plans & billing
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (onNotNow) onNotNow()
            else onOpenChange(false)
          }}
        >
          Not now
        </Button>
      </div>
    </BottomSheet>
  )
}
