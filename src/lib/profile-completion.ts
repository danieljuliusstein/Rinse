import type { AppSettings } from './settings-store'

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

function hasCustomLogo(logoUrl?: string): boolean {
  if (!logoUrl?.trim()) return false
  return !logoUrl.includes('logo.png') && !logoUrl.endsWith('/logo.png')
}

export function computeProfileCompletion(settings: AppSettings): ProfileCompletion {
  const steps: ProfileStep[] = [
    {
      id: 'phone',
      label: 'Business phone',
      href: '/settings/business',
      done: Boolean(settings.business_phone?.trim()),
    },
    {
      id: 'email',
      label: 'Business email',
      href: '/settings/business',
      done: Boolean(settings.business_email?.trim()),
    },
    {
      id: 'logo',
      label: 'Business logo',
      href: '/settings/business',
      done: hasCustomLogo(settings.logo_url),
    },
  ]
  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length
  const percent = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100)
  return {
    isComplete: completedCount === totalCount,
    percent,
    completedCount,
    totalCount,
    steps,
    nextStep: steps.find((s) => !s.done) ?? null,
  }
}
