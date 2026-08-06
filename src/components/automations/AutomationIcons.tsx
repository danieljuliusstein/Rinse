import type { ReactNode } from 'react'
import type { AutomationAction, AutomationTrigger, AutomationWorkflow } from '@/lib/types'
import { ACTION_LABELS, TRIGGER_LABELS, isAutomationAction, isAutomationTrigger } from '@/lib/automation-workflow'

export type IconProps = { size?: number; className?: string }

function Svg({ size = 16, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconForm(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </Svg>
  )
}

export function IconDeal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
    </Svg>
  )
}

export function IconChat(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

export function IconActivity(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  )
}

export function IconTag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Svg>
  )
}

export function IconNote(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </Svg>
  )
}

export function IconCondition(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3v12" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </Svg>
  )
}

/** Git-branch style mark for branching / conditional workflows */
export function IconGitBranch(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </Svg>
  )
}

export function IconWorkflow(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconArrow(props: IconProps) {
  return (
    <Svg {...props} size={props.size ?? 12}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

export function IconBolt(props: IconProps) {
  return (
    <Svg {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Svg>
  )
}

export function IconRepeat(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Svg>
  )
}

export function IconTarget(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}

export function IconDotsVertical(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  )
}

/** Lightweight AI mark for ChatGPT / Claude catalog entries */
export function IconAi(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M7.5 7.5l1.5 1.5" />
      <path d="M15 15l1.5 1.5" />
      <path d="M7.5 16.5L9 15" />
      <path d="M15 9l1.5-1.5" />
    </Svg>
  )
}

export function IconMoney(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Svg>
  )
}

export const ACCENT_ICON = {
  form: IconForm,
  deal: IconDeal,
  chat: IconChat,
} as const

export type StepTone = 'trigger' | 'action' | 'condition'

export function triggerIcon(kind: string) {
  switch (kind) {
    case 'form_submitted':
      return IconForm
    case 'deal_stage_changed':
      return IconDeal
    case 'chat_message':
      return IconChat
    case 'activity_logged':
      return IconActivity
    default:
      return IconWorkflow
  }
}

export function actionIcon(kind: string) {
  switch (kind) {
    case 'update_contact_tag':
      return IconTag
    case 'notify':
      return IconNote
    case 'create_activity':
      return IconActivity
    default:
      return IconWorkflow
  }
}

/**
 * Shared trigger / condition / action visual tokens — used by the palette,
 * list chips, and workflow canvas nodes so accents stay in sync.
 */
export const TONE_STYLES: Record<
  StepTone,
  { bg: string; fg: string; border: string; ring: string }
> = {
  trigger: {
    bg: '#EAF9EF',
    fg: '#16A34A',
    border: '#97C459',
    ring: '#97C459',
  },
  condition: {
    bg: '#FEF3C7',
    fg: '#92400E',
    border: '#FAC775',
    ring: '#FAC775',
  },
  action: {
    bg: '#CCFBF1',
    fg: '#0F766E',
    border: '#5DCAA5',
    ring: '#5DCAA5',
  },
}

export type FlowStepChip = {
  key: string
  label: string
  tone: StepTone
  Icon: (props: IconProps) => ReactNode
}

/** Ordered visual chips for list/template previews (trigger → …). */
export function workflowStepChips(workflow: AutomationWorkflow): FlowStepChip[] {
  const chips: FlowStepChip[] = []
  const trigger = workflow.nodes.find((n) => n.type === 'trigger')
  if (trigger) {
    const kind = trigger.data.kind || ''
    chips.push({
      key: trigger.id,
      label:
        (kind && isAutomationTrigger(kind) && TRIGGER_LABELS[kind as AutomationTrigger]) ||
        trigger.data.label ||
        'Trigger',
      tone: 'trigger',
      Icon: triggerIcon(kind),
    })
  }
  for (const n of workflow.nodes) {
    if (n.type === 'condition') {
      chips.push({
        key: n.id,
        label: n.data.label || 'Condition',
        tone: 'condition',
        Icon: IconCondition,
      })
    }
    if (n.type === 'action') {
      const kind = n.data.kind || ''
      chips.push({
        key: n.id,
        label:
          (kind && isAutomationAction(kind) && ACTION_LABELS[kind as AutomationAction]) ||
          n.data.label ||
          'Action',
        tone: 'action',
        Icon: actionIcon(kind),
      })
    }
  }
  return chips
}

/**
 * List-row chip preview: first step + optional "+N steps" when the graph has >2 steps.
 * Full chain remains available in the editor.
 */
export function compactWorkflowChips(chips: FlowStepChip[]): FlowStepChip[] {
  if (chips.length <= 2) return chips
  const first = chips[0]
  if (!first) return chips
  return [
    first,
    {
      key: `${first.key}-more`,
      label: `+${chips.length - 1} steps`,
      tone: 'trigger' as StepTone,
      Icon: IconWorkflow,
    },
  ]
}

export function StepBadge({
  tone,
  Icon,
  size = 36,
}: {
  tone: StepTone
  Icon: (props: IconProps) => ReactNode
  size?: number
}) {
  const s = TONE_STYLES[tone]
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size,
        height: size,
        background: s.bg,
        color: s.fg,
        boxShadow: `inset 0 0 0 1px ${s.ring}`,
      }}
    >
      <Icon size={Math.round(size * 0.45)} />
    </span>
  )
}

export function FlowChipRow({ chips, compact }: { chips: FlowStepChip[]; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {chips.map((chip, i) => {
        const s = TONE_STYLES[chip.tone]
        return (
          <span key={chip.key} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span className="text-gray-300 px-0.5">
                <IconArrow size={compact ? 10 : 12} />
              </span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1 rounded-full font-medium ${
                compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1'
              }`}
              style={{ background: s.bg, color: s.fg }}
            >
              <chip.Icon size={compact ? 10 : 12} />
              <span className="max-w-[9rem] truncate">{chip.label.replace(/^When /i, '')}</span>
            </span>
          </span>
        )
      })}
    </div>
  )
}

/** Low-radius node chain for journey rails / dense list previews (not soft pills). */
export function FlowNodeRow({
  chips,
  compact,
  className,
}: {
  chips: FlowStepChip[]
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`automation-flow-nodes flex flex-nowrap items-center overflow-hidden ${compact ? 'gap-1' : 'gap-1.5'} ${className ?? ''}`}
    >
      {chips.map((chip, i) => {
        const s = TONE_STYLES[chip.tone]
        return (
          <span key={chip.key} className="inline-flex items-center gap-1 shrink-0">
            {i > 0 ? (
              <span className="text-gray-300 px-0.5 shrink-0" aria-hidden>
                <IconArrow size={compact ? 10 : 12} />
              </span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1 font-medium rounded-md ${
                compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1'
              }`}
              style={{
                background: s.bg,
                color: s.fg,
                boxShadow: `inset 0 0 0 1px ${s.ring}`,
              }}
            >
              <chip.Icon size={compact ? 10 : 12} />
              <span className="max-w-[8.5rem] truncate">{chip.label.replace(/^When /i, '')}</span>
            </span>
          </span>
        )
      })}
    </div>
  )
}
