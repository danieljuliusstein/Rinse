import { hasCustomBusinessLogo } from './business-logo'
import type { AppSettings } from './settings'

export interface ProfileStep {
  id: string
  label: string
  href: string
  done: boolean
}

export interface ProfileCompletion {
  isComplete: boolean
  percent: number
  completedCount: number
  totalCount: number
  steps: ProfileStep[]
  nextStep: ProfileStep | null
}

const BUSINESS_SETTINGS_HREF = '/settings/business'

function buildSteps(settings: AppSettings): ProfileStep[] {
  return [
    {
      id: 'phone',
      label: 'Business phone',
      href: BUSINESS_SETTINGS_HREF,
      done: Boolean(settings.business_phone?.trim()),
    },
    {
      id: 'email',
      label: 'Business email',
      href: BUSINESS_SETTINGS_HREF,
      done: Boolean(settings.business_email?.trim()),
    },
    {
      id: 'logo',
      label: 'Business logo',
      href: BUSINESS_SETTINGS_HREF,
      done: hasCustomBusinessLogo(settings.logo_url),
    },
  ]
}

export function computeProfileCompletion(settings: AppSettings): ProfileCompletion {
  const steps = buildSteps(settings)
  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length
  const percent = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100)
  const nextStep = steps.find((s) => !s.done) ?? null

  return {
    isComplete: completedCount === totalCount,
    percent,
    completedCount,
    totalCount,
    steps,
    nextStep,
  }
}
