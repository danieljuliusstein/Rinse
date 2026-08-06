import { newId } from './orgStore'
import type {
  AutomationAction,
  AutomationEdge,
  AutomationNode,
  AutomationTrigger,
  AutomationWorkflow,
  DeskAutomation,
} from './types'

export const MAX_AUTOMATION_NODES = 24
export const MAX_RUNNER_STEPS = 20

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  form_submitted: 'When form submitted',
  deal_stage_changed: 'When deal stage changes',
  activity_logged: 'When activity logged',
  chat_message: 'When chat message received',
}

export const ACTION_LABELS: Record<AutomationAction, string> = {
  create_activity: 'Create activity',
  update_contact_tag: 'Add contact tag',
  notify: 'Log note',
}

export function isAutomationTrigger(v: string): v is AutomationTrigger {
  return v in TRIGGER_LABELS
}

export function isAutomationAction(v: string): v is AutomationAction {
  return v in ACTION_LABELS
}

export function legacyToWorkflow(
  trigger: AutomationTrigger,
  action: AutomationAction,
  config: Record<string, string> = {},
): AutomationWorkflow {
  const triggerId = newId()
  const actionId = newId()
  const nodes: AutomationNode[] = [
    {
      id: triggerId,
      type: 'trigger',
      position: { x: 80, y: 120 },
      data: { kind: trigger, label: TRIGGER_LABELS[trigger] },
    },
    {
      id: actionId,
      type: 'action',
      position: { x: 360, y: 120 },
      data: {
        kind: action,
        label: ACTION_LABELS[action],
        subject: config.subject,
        body: config.body,
        message: config.message,
        tag: config.tag,
      },
    },
  ]
  const edges: AutomationEdge[] = [{ id: newId(), source: triggerId, target: actionId }]
  return { nodes, edges }
}

export function ensureWorkflow(automation: DeskAutomation): AutomationWorkflow {
  if (automation.workflow && automation.workflow.nodes.length > 0) {
    return automation.workflow
  }
  return legacyToWorkflow(automation.trigger, automation.action, automation.config)
}

export function primaryActionFromWorkflow(workflow: AutomationWorkflow): AutomationAction {
  const actionNode = workflow.nodes.find((n) => n.type === 'action')
  const kind = actionNode?.data.kind
  if (kind && isAutomationAction(kind)) return kind
  return 'create_activity'
}

export function triggerFromWorkflow(workflow: AutomationWorkflow): AutomationTrigger | null {
  const triggerNode = workflow.nodes.find((n) => n.type === 'trigger')
  const kind = triggerNode?.data.kind
  if (kind && isAutomationTrigger(kind)) return kind
  return null
}

export function workflowSummary(workflow: AutomationWorkflow): string {
  const trigger = triggerFromWorkflow(workflow)
  const actions = workflow.nodes
    .filter((n) => n.type === 'action')
    .map((n) => {
      const kind = n.data.kind
      if (kind && isAutomationAction(kind)) return ACTION_LABELS[kind]
      return n.data.label || 'Action'
    })
  const conditions = workflow.nodes.filter((n) => n.type === 'condition').length
  const triggerLabel = trigger ? TRIGGER_LABELS[trigger] : 'Trigger'
  const actionPart = actions.length ? actions.join(' → ') : 'no actions'
  const condPart = conditions > 0 ? ` · ${conditions} condition${conditions === 1 ? '' : 's'}` : ''
  return `${triggerLabel} → ${actionPart}${condPart}`
}

export type WorkflowValidationIssue = {
  code: string
  message: string
  /** Soft issues show a banner but do not block save */
  severity?: 'error' | 'soft'
}

export function blockingWorkflowIssues(issues: WorkflowValidationIssue[]): WorkflowValidationIssue[] {
  return issues.filter((i) => i.severity !== 'soft')
}

export function validateWorkflow(workflow: AutomationWorkflow): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = []
  const { nodes, edges } = workflow

  if (nodes.length === 0) {
    issues.push({ code: 'empty', message: 'Add at least a trigger and one action' })
    return issues
  }
  if (nodes.length > MAX_AUTOMATION_NODES) {
    issues.push({
      code: 'too_many_nodes',
      message: `Keep workflows to ${MAX_AUTOMATION_NODES} nodes or fewer`,
    })
  }

  const triggers = nodes.filter((n) => n.type === 'trigger')
  if (triggers.length !== 1) {
    issues.push({ code: 'one_trigger', message: 'Exactly one trigger node is required' })
  } else {
    const kind = triggers[0]!.data.kind
    if (!kind || !isAutomationTrigger(kind)) {
      issues.push({ code: 'trigger_kind', message: 'Trigger must use a known event type' })
    }
  }

  const actions = nodes.filter((n) => n.type === 'action')
  if (actions.length === 0) {
    issues.push({ code: 'need_action', message: 'Add at least one action' })
  }
  for (const a of actions) {
    if (!a.data.kind || !isAutomationAction(a.data.kind)) {
      issues.push({ code: 'action_kind', message: `Action “${a.data.label || a.id}” needs a type` })
    }
  }

  for (const c of nodes.filter((n) => n.type === 'condition')) {
    if (!c.data.field?.trim()) {
      issues.push({ code: 'condition_field', message: 'Each condition needs a field name' })
    }
  }

  const ids = new Set(nodes.map((n) => n.id))
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      issues.push({ code: 'bad_edge', message: 'An edge points to a missing node' })
      break
    }
  }

  if (triggers.length === 1) {
    const reachable = new Set<string>()
    const queue = [triggers[0]!.id]
    while (queue.length) {
      const id = queue.shift()!
      if (reachable.has(id)) continue
      reachable.add(id)
      for (const e of edges.filter((x) => x.source === id)) {
        if (!reachable.has(e.target)) queue.push(e.target)
      }
    }
    const orphanActions = actions.filter((a) => !reachable.has(a.id))
    if (orphanActions.length > 0) {
      issues.push({
        code: 'orphan',
        message: 'Connect every action to the trigger (directly or through conditions)',
      })
    }
  }

  const hasZapierPlaceholder = nodes.some(
    (n) =>
      n.data.appId === 'zapier' ||
      n.data.kind === 'zapier' ||
      n.data.kind === 'zapier_stub' ||
      n.data.label?.toLowerCase().includes('zapier'),
  )
  if (hasZapierPlaceholder) {
    issues.push({
      code: 'zapier_soft',
      severity: 'soft',
      message:
        'Zapier is a preview stub — CRM steps still run, but no webhook is sent until the adapter plan ships.',
    })
  }

  return issues
}

export function parseConfigPayload(raw: unknown): {
  config: Record<string, string>
  workflow?: AutomationWorkflow
} {
  let obj: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return { config: {} }
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>
  }

  let workflow: AutomationWorkflow | undefined
  const wf = obj.workflow
  if (wf && typeof wf === 'object') {
    const w = wf as { nodes?: unknown; edges?: unknown }
    if (Array.isArray(w.nodes) && Array.isArray(w.edges)) {
      workflow = {
        nodes: w.nodes as AutomationNode[],
        edges: w.edges as AutomationEdge[],
      }
    }
  }

  const config: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'workflow') continue
    if (typeof v === 'string') config[k] = v
    else if (v != null && typeof v !== 'object') config[k] = String(v)
  }
  return { config, workflow }
}

export function serializeConfigPayload(
  config: Record<string, string>,
  workflow?: AutomationWorkflow,
): string {
  const payload: Record<string, unknown> = { ...config }
  if (workflow) payload.workflow = workflow
  return JSON.stringify(payload)
}

/** Evaluate a condition node against trigger context. */
export function evaluateCondition(
  data: AutomationNode['data'],
  ctx: Record<string, string>,
): boolean {
  const field = data.field?.trim() || ''
  const op = data.op || 'equals'
  const expected = data.value ?? ''
  const actual = ctx[field]

  if (op === 'exists') return actual != null && String(actual).length > 0
  if (op === 'not_equals') return String(actual ?? '') !== expected
  return String(actual ?? '') === expected
}

export function nextNodes(
  workflow: AutomationWorkflow,
  fromId: string,
  handle?: string | null,
): AutomationNode[] {
  const outs = workflow.edges.filter((e) => {
    if (e.source !== fromId) return false
    if (handle == null || handle === '') {
      return !e.sourceHandle || e.sourceHandle === 'default'
    }
    return e.sourceHandle === handle || (!e.sourceHandle && handle === 'true')
  })
  return outs
    .map((e) => workflow.nodes.find((n) => n.id === e.target))
    .filter((n): n is AutomationNode => Boolean(n))
}
