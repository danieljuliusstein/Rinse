'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding-claude/OnboardingFlow'
import { markSetupIntroSeen } from '@/lib/setup-intro'
import { trackIntroSlideViewed } from '@/lib/onboarding-analytics'

interface SetupIntroFlowProps {
  demo?: boolean
  onDemoFinish?: () => void
  onDemoSkip?: () => void
  onDemoSignIn?: () => void
}

export default function SetupIntroFlow({
  demo = false,
  onDemoFinish,
  onDemoSkip,
  onDemoSignIn,
}: SetupIntroFlowProps) {
  const router = useRouter()

  const finish = useCallback(
    (destination: '/auth?mode=signup' | '/welcome') => {
      if (demo) {
        if (destination === '/auth?mode=signup') onDemoFinish?.()
        else onDemoSkip?.()
        return
      }
      markSetupIntroSeen()
      router.replace(destination)
    },
    [demo, onDemoFinish, onDemoSkip, router],
  )

  return (
    <OnboardingFlow
      onComplete={() => finish('/auth?mode=signup')}
      onSkip={() => finish('/welcome')}
      onSlideChange={demo ? undefined : trackIntroSlideViewed}
      signInHref={demo ? '#' : '/auth'}
      onSignInClick={
        demo
          ? (e) => {
              e.preventDefault()
              onDemoSignIn?.()
            }
          : undefined
      }
    />
  )
}
