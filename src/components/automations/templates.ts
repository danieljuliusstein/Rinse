import { newId } from '@/lib/orgStore'
import { ACTION_LABELS, TRIGGER_LABELS } from '@/lib/automation-workflow'
import type { AutomationWorkflow } from '@/lib/types'

export type AutomationTemplate = {
  id: string
  name: string
  description: string
  /** Visual accent for template card */
  accent: 'form' | 'deal' | 'chat'
  /** Optional app stamp featured in discovery */
  featuredAppId?: string
  workflow: () => AutomationWorkflow
}

function formToTagToNote(): AutomationWorkflow {
  const t = newId()
  const tag = newId()
  const note = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 40, y: 140 },
        data: { kind: 'form_submitted', label: TRIGGER_LABELS.form_submitted },
      },
      {
        id: tag,
        type: 'action',
        position: { x: 320, y: 80 },
        data: {
          kind: 'update_contact_tag',
          label: ACTION_LABELS.update_contact_tag,
          tag: 'form-lead',
        },
      },
      {
        id: note,
        type: 'action',
        position: { x: 320, y: 220 },
        data: {
          kind: 'notify',
          label: ACTION_LABELS.notify,
          message: 'New form submission logged',
        },
      },
    ],
    edges: [
      { id: newId(), source: t, target: tag },
      { id: newId(), source: tag, target: note },
    ],
  }
}

function dealStageWithCondition(): AutomationWorkflow {
  const t = newId()
  const c = newId()
  const won = newId()
  const other = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 40, y: 160 },
        data: { kind: 'deal_stage_changed', label: TRIGGER_LABELS.deal_stage_changed },
      },
      {
        id: c,
        type: 'condition',
        position: { x: 300, y: 160 },
        data: {
          label: 'Stage is booked?',
          field: 'stage',
          op: 'equals',
          value: 'booked',
        },
      },
      {
        id: won,
        type: 'action',
        position: { x: 560, y: 60 },
        data: {
          kind: 'update_contact_tag',
          label: ACTION_LABELS.update_contact_tag,
          tag: 'won',
        },
      },
      {
        id: other,
        type: 'action',
        position: { x: 560, y: 260 },
        data: {
          kind: 'notify',
          label: ACTION_LABELS.notify,
          message: 'Deal stage updated',
        },
      },
    ],
    edges: [
      { id: newId(), source: t, target: c },
      { id: newId(), source: c, target: won, sourceHandle: 'true' },
      { id: newId(), source: c, target: other, sourceHandle: 'false' },
    ],
  }
}

function chatToActivity(): AutomationWorkflow {
  const t = newId()
  const a = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 80, y: 120 },
        data: { kind: 'chat_message', label: TRIGGER_LABELS.chat_message },
      },
      {
        id: a,
        type: 'action',
        position: { x: 360, y: 120 },
        data: {
          kind: 'create_activity',
          label: ACTION_LABELS.create_activity,
          subject: 'Chat follow-up',
          body: 'Visitor sent a chat message',
        },
      },
    ],
    edges: [{ id: newId(), source: t, target: a }],
  }
}

/** Form → Slack-ready log note (CRM-executable with stamp) */
function formToSlackNote(): AutomationWorkflow {
  const t = newId()
  const note = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 80, y: 120 },
        data: { kind: 'form_submitted', label: TRIGGER_LABELS.form_submitted },
      },
      {
        id: note,
        type: 'action',
        position: { x: 360, y: 120 },
        data: {
          kind: 'notify',
          label: ACTION_LABELS.notify,
          appId: 'slack',
          subject: 'New form lead',
          message: 'Form submitted — Slack destination stamped (Activity trail until Connect).',
        },
      },
    ],
    edges: [{ id: newId(), source: t, target: note }],
  }
}

/** Deal booked → Stripe prep note */
function dealToStripePrep(): AutomationWorkflow {
  const t = newId()
  const c = newId()
  const prep = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 40, y: 140 },
        data: { kind: 'deal_stage_changed', label: TRIGGER_LABELS.deal_stage_changed },
      },
      {
        id: c,
        type: 'condition',
        position: { x: 280, y: 140 },
        data: {
          label: 'Stage is booked?',
          field: 'stage',
          op: 'equals',
          value: 'booked',
        },
      },
      {
        id: prep,
        type: 'action',
        position: { x: 540, y: 140 },
        data: {
          kind: 'create_activity',
          label: ACTION_LABELS.create_activity,
          appId: 'stripe',
          subject: 'Invoice prep',
          body: 'Deal booked — Stripe destination stamped for Money/Payments follow-up.',
        },
      },
    ],
    edges: [
      { id: newId(), source: t, target: c },
      { id: newId(), source: c, target: prep, sourceHandle: 'true' },
    ],
  }
}

/** Chat → Claude-ready note */
function chatToClaudeNote(): AutomationWorkflow {
  const t = newId()
  const a = newId()
  return {
    nodes: [
      {
        id: t,
        type: 'trigger',
        position: { x: 80, y: 120 },
        data: { kind: 'chat_message', label: TRIGGER_LABELS.chat_message },
      },
      {
        id: a,
        type: 'action',
        position: { x: 360, y: 120 },
        data: {
          kind: 'create_activity',
          label: ACTION_LABELS.create_activity,
          appId: 'claude',
          subject: 'Draft reply',
          body: 'Chat received — Claude destination stamped for AI assist trail.',
        },
      },
    ],
    edges: [{ id: newId(), source: t, target: a }],
  }
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'form-tag-note',
    name: 'Form → tag → log note',
    description: 'When a form is submitted, tag the contact and log a note',
    accent: 'form',
    workflow: formToTagToNote,
  },
  {
    id: 'deal-booked-branch',
    name: 'Deal stage with branch',
    description: 'When a deal moves, branch on booked vs other stages',
    accent: 'deal',
    workflow: dealStageWithCondition,
  },
  {
    id: 'chat-activity',
    name: 'Chat → activity',
    description: 'Log an activity when a chat message arrives',
    accent: 'chat',
    workflow: chatToActivity,
  },
  {
    id: 'form-slack-note',
    name: 'Form → Slack-ready note',
    description: 'Log a branded Activity note when a form submits',
    accent: 'form',
    featuredAppId: 'slack',
    workflow: formToSlackNote,
  },
  {
    id: 'deal-stripe-prep',
    name: 'Deal → Stripe prep',
    description: 'When a deal is booked, stamp a Stripe invoice-prep Activity',
    accent: 'deal',
    featuredAppId: 'stripe',
    workflow: dealToStripePrep,
  },
  {
    id: 'chat-claude-note',
    name: 'Chat → Claude-ready note',
    description: 'Stamp a Claude destination on chat follow-up Activities',
    accent: 'chat',
    featuredAppId: 'claude',
    workflow: chatToClaudeNote,
  },
]
