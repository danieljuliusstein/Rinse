import type { LeadSource } from './types'

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'text', label: 'Text' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'word_of_mouth', label: 'Word of mouth' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
]

export function leadSourceLabel(source: string | undefined): string {
  const match = LEAD_SOURCES.find((s) => s.value === source)
  if (match) return match.label
  if (!source) return 'Other'
  return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export type LeadSourceBadgeTone = 'green' | 'amber' | 'blue' | 'gray' | 'red'

export function leadSourceBadgeTone(source: string | undefined): LeadSourceBadgeTone {
  switch (source) {
    case 'instagram':
      return 'red'
    case 'google':
      return 'blue'
    case 'referral':
      return 'green'
    case 'text':
      return 'blue'
    case 'website':
      return 'amber'
    default:
      return 'gray'
  }
}

export const LEAD_STAGES = [
  { id: 'inquiry' as const, label: 'Inquiry', shortLabel: 'Inquiry' },
  { id: 'quoted' as const, label: 'Quoted', shortLabel: 'Quoted' },
  { id: 'booked' as const, label: 'Ready to schedule', shortLabel: 'Schedule' },
]

export function leadStageLabel(stage: string): string {
  const match = LEAD_STAGES.find((s) => s.id === stage)
  return match?.label ?? stage
}
