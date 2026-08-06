import type { DeskAutomation } from '@/lib/types'
import {
  ACTION_LABELS,
  TRIGGER_LABELS,
} from '@/lib/automation-workflow'

const UNTITLED_NAMES = new Set([
  '',
  'new automation',
  'untitled',
  'untitled automation',
  'new workflow',
])

export function isUntitledWorkflowName(name: string): boolean {
  return UNTITLED_NAMES.has(name.trim().toLowerCase())
}

/** Readable default when the workflow has no meaningful custom name */
export function displayWorkflowName(automation: DeskAutomation): string {
  if (!isUntitledWorkflowName(automation.name)) return automation.name
  const trigger =
    TRIGGER_LABELS[automation.trigger]?.replace(/^When /i, '') ?? 'Trigger'
  const action = ACTION_LABELS[automation.action] ?? 'action'
  return `${trigger} → ${action}`
}

export type WorkflowRunMeta = {
  runsThisWeek: number
  /** null when never run / paused with no history */
  lastRunAt: Date | null
  lastFailed: boolean
  /** One-line failure reason when lastFailed */
  lastErrorReason?: string
}

/**
 * Run history is not persisted yet. Always return empty meta so the list
 * never invents runs, failures, or timestamps.
 */
export function getWorkflowRunMeta(_automation: DeskAutomation): WorkflowRunMeta {
  return {
    runsThisWeek: 0,
    lastRunAt: null,
    lastFailed: false,
  }
}

export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function formatRunSubtitle(meta: WorkflowRunMeta, enabled: boolean): string {
  if (!enabled) return 'Paused · no run history yet'
  if (meta.lastFailed && meta.lastRunAt) {
    return `Failed ${formatRelativeTime(meta.lastRunAt)} · ${meta.lastErrorReason ?? 'run failed'}`
  }
  if (!meta.lastRunAt) return 'No run history yet'
  return `${meta.runsThisWeek} runs this week · last run ${formatRelativeTime(meta.lastRunAt)}`
}
