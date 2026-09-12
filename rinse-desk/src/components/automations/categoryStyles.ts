import type { AutomationTrigger, AutomationWorkflow, DeskAutomation } from '@/lib/types'
import { ensureWorkflow } from '@/lib/automation-workflow'
import {
  IconChat,
  IconDeal,
  IconForm,
  IconGitBranch,
  IconWorkflow,
  type IconProps,
} from './AutomationIcons'
import type { ReactNode } from 'react'

/** Visual category for automation trigger / template accent */
export type AutomationCategory = 'form' | 'deal' | 'chat' | 'branch'

export type CategoryStyle = {
  bg: string
  fg: string
  label: string
}

/** Shared category → color mapping for journey cards + workflow rows */
export const CATEGORY_STYLES: Record<AutomationCategory, CategoryStyle> = {
  form: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Forms' },
  deal: { bg: '#FEF3C7', fg: '#92400E', label: 'Deals' },
  chat: { bg: '#CCFBF1', fg: '#0F766E', label: 'Chat' },
  branch: { bg: '#FEF3C7', fg: '#92400E', label: 'Branching' },
}

/** Paused / off icon treatment */
export const CATEGORY_PAUSED = { bg: '#F1EFE8', fg: '#5F5E5A' } as const

export function categoryFromTrigger(trigger: string): AutomationCategory {
  switch (trigger as AutomationTrigger) {
    case 'form_submitted':
      return 'form'
    case 'deal_stage_changed':
      return 'deal'
    case 'chat_message':
      return 'chat'
    default:
      return 'form'
  }
}

export function categoryFromAccent(accent: 'form' | 'deal' | 'chat'): AutomationCategory {
  return accent
}

/** Prefer branch when the graph has condition nodes */
export function categoryFromWorkflow(
  trigger: string,
  workflow?: AutomationWorkflow,
): AutomationCategory {
  if (workflow?.nodes.some((n) => n.type === 'condition')) return 'branch'
  return categoryFromTrigger(trigger)
}

export function categoryForAutomation(automation: DeskAutomation): AutomationCategory {
  return categoryFromWorkflow(automation.trigger, ensureWorkflow(automation))
}

export function categoryIcon(
  category: AutomationCategory,
): (props: IconProps) => ReactNode {
  switch (category) {
    case 'form':
      return IconForm
    case 'deal':
      return IconDeal
    case 'chat':
      return IconChat
    case 'branch':
      return IconGitBranch
    default:
      return IconWorkflow
  }
}
