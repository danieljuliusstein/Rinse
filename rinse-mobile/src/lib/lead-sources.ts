import type { LeadSource, LeadStage, LeadWithRelations } from '@rinse/core'
import type { BadgeTone } from '@/src/theme/tokens'

const STAGE_PRIORITY: LeadStage[] = ['booked', 'quoted', 'inquiry']

/** Bucket leads by effective stage (job → scheduled, quote → quoted). */
export function resolveLeadStage(lead: LeadWithRelations): LeadStage {
  if (lead.job_id) return 'booked'
  if (lead.quote_id) return 'quoted'
  const stage = lead.stage
  if (stage === 'inquiry' || stage === 'quoted' || stage === 'booked') return stage
  return 'inquiry'
}

export function groupLeadsByStage(leads: LeadWithRelations[]): Record<LeadStage, LeadWithRelations[]> {
  const grouped: Record<LeadStage, LeadWithRelations[]> = { inquiry: [], quoted: [], booked: [] }
  for (const lead of leads) grouped[resolveLeadStage(lead)].push(lead)
  return grouped
}

export function firstPipelineStageWithLeads(leads: LeadWithRelations[]): LeadStage {
  const grouped = groupLeadsByStage(leads)
  for (const stage of STAGE_PRIORITY) {
    if (grouped[stage].length > 0) return stage
  }
  return 'inquiry'
}

export function leadStageLabel(stage: LeadStage): string {
  if (stage === 'inquiry') return 'Inquiry'
  if (stage === 'quoted') return 'Quoted'
  return 'Scheduled'
}

export function leadSourceLabel(source?: LeadSource | string | null): string {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    google: 'Google',
    referral: 'Referral',
    text: 'Text',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    word_of_mouth: 'Word of mouth',
    website: 'Website',
    other: 'Other',
  }
  return labels[String(source ?? 'other')] ?? 'Other'
}

export function leadSourceBadgeTone(source?: LeadSource | string | null): BadgeTone {
  switch (source) {
    case 'instagram':
      return 'red'
    case 'google':
    case 'text':
      return 'blue'
    case 'referral':
      return 'green'
    case 'website':
      return 'amber'
    default:
      return 'gray'
  }
}

export const LEAD_STAGES: { id: LeadStage; label: string; shortLabel: string }[] = [
  { id: 'inquiry', label: 'Inquiry', shortLabel: 'Inquiry' },
  { id: 'quoted', label: 'Quoted', shortLabel: 'Quoted' },
  { id: 'booked', label: 'Scheduled', shortLabel: 'Scheduled' },
]

export const PIPELINE_STAGE_ORDER: LeadStage[] = ['inquiry', 'quoted', 'booked']
