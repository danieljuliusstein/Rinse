import type {
  DeskActivity,
  DeskChatThread,
  DeskClient,
  DeskJob,
  DeskLead,
  DeskVehicle,
} from './types'

export type AssistChip = 'draft' | 'pipeline' | 'chat' | 'activity'

export type AssistIcon =
  | 'mail'
  | 'calendar'
  | 'briefcase'
  | 'chat'
  | 'phone'
  | 'clock'
  | 'shield'
  | 'warn'
  | 'check'

export type AssistTone = 'info' | 'warn' | 'good'

export interface AssistSuggestion {
  id: string
  icon: AssistIcon
  title: string
  body: string
  meta?: string
  tone?: AssistTone
}

export interface AssistContactOption {
  id: string
  name: string
  sub: string
}

export interface AssistSnapshot {
  openDeals: number
  stalledDeals: number
  openChats: number
  awaitingReply: number
  activities24h: number
  jobsTomorrow: number
  openDealsHint: string
  openChatsHint: string
  activitiesHint: string
}

export interface AssistContext {
  clients: DeskClient[]
  vehicles: DeskVehicle[]
  leads: DeskLead[]
  jobs: DeskJob[]
  activities: DeskActivity[]
  threads: DeskChatThread[]
  focusContactId?: string
  now?: Date
}

const DAY_MS = 86_400_000
const STALL_DAYS = 4
const QUIET_CHAT_DAYS = 7

function daysSince(iso: string | undefined, now: Date): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((now.getTime() - t) / DAY_MS)
}

function formatDays(n: number): string {
  if (n <= 0) return 'today'
  if (n === 1) return '1 day'
  return `${n} days`
}

function vehicleLabel(vehicles: DeskVehicle[], clientId: string): string | null {
  const v = vehicles.find((x) => x.client_id === clientId)
  if (!v) return null
  return [v.year, v.make, v.model].filter(Boolean).join(' ') || null
}

function openLeads(leads: DeskLead[]): DeskLead[] {
  return leads.filter((l) => l.stage !== 'booked')
}

function isActiveThread(t: DeskChatThread): boolean {
  return t.status === 'open' && !t.archived && !t.trashed && !t.spam
}

function isAwaitingReply(t: DeskChatThread): boolean {
  if (!isActiveThread(t)) return false
  if (!t.agent_last_read_at) return true
  return t.agent_last_read_at < t.last_message_at
}

function lastActivityAt(activities: DeskActivity[], contactId: string): string | undefined {
  let latest: string | undefined
  for (const a of activities) {
    if (a.contact_id !== contactId) continue
    if (!latest || a.occurred_at > latest) latest = a.occurred_at
  }
  return latest
}

function leadForContact(leads: DeskLead[], contactId: string): DeskLead | undefined {
  const linked = openLeads(leads).filter((l) => l.client_id === contactId)
  if (linked.length === 0) return undefined
  return [...linked].sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))[0]
}

function leadIdleDays(lead: DeskLead, activities: DeskActivity[], now: Date): number {
  const contactIdle = lead.client_id
    ? daysSince(lastActivityAt(activities, lead.client_id), now)
    : null
  const createdIdle = daysSince(lead.created, now) ?? 0
  if (contactIdle == null) return createdIdle
  return Math.max(contactIdle, 0)
}

function isStalledLead(lead: DeskLead, activities: DeskActivity[], now: Date): boolean {
  if (lead.stage === 'booked') return false
  return leadIdleDays(lead, activities, now) >= STALL_DAYS
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function contactSub(
  client: DeskClient,
  vehicles: DeskVehicle[],
  leads: DeskLead[],
  activities: DeskActivity[],
  now: Date,
): string {
  const vehicle = vehicleLabel(vehicles, client.id)
  const lead = leadForContact(leads, client.id)
  const idle = daysSince(lastActivityAt(activities, client.id), now)
  const bits: string[] = []
  if (vehicle) bits.push(vehicle)
  if (lead) {
    const interest = lead.service_interest || lead.packageName || lead.stage
    if (lead.stage === 'quoted') bits.push(`Quote · ${interest}`)
    else if (lead.stage === 'inquiry') bits.push(`Inquiry · ${interest}`)
    else bits.push(String(interest))
  } else if (idle != null) {
    bits.push(idle === 0 ? 'Active today' : `No activity ${formatDays(idle)}`)
  } else {
    bits.push('No open deal')
  }
  return bits.join(' · ')
}

export function buildAssistContactOptions(ctx: AssistContext): AssistContactOption[] {
  const now = ctx.now ?? new Date()
  const ranked = [...ctx.clients].sort((a, b) => {
    const aLead = leadForContact(ctx.leads, a.id)
    const bLead = leadForContact(ctx.leads, b.id)
    const aScore =
      (aLead ? (isStalledLead(aLead, ctx.activities, now) ? 3 : 2) : 0) +
      (ctx.threads.some((t) => t.contact_id === a.id && isAwaitingReply(t)) ? 2 : 0)
    const bScore =
      (bLead ? (isStalledLead(bLead, ctx.activities, now) ? 3 : 2) : 0) +
      (ctx.threads.some((t) => t.contact_id === b.id && isAwaitingReply(t)) ? 2 : 0)
    if (bScore !== aScore) return bScore - aScore
    return a.name.localeCompare(b.name)
  })

  return [
    { id: '', name: 'General workspace', sub: 'No contact focused' },
    ...ranked.map((c) => ({
      id: c.id,
      name: c.name,
      sub: contactSub(c, ctx.vehicles, ctx.leads, ctx.activities, now),
    })),
  ]
}

export function buildAssistSnapshot(ctx: AssistContext): AssistSnapshot {
  const now = ctx.now ?? new Date()
  const open = openLeads(ctx.leads)
  const stalled = open.filter((l) => isStalledLead(l, ctx.activities, now))
  const openThreads = ctx.threads.filter(isActiveThread)
  const awaiting = openThreads.filter(isAwaitingReply)
  const dayAgo = now.getTime() - DAY_MS
  const activities24h = ctx.activities.filter((a) => new Date(a.occurred_at).getTime() > dayAgo).length
  const tomorrow = ymd(addDays(now, 1))
  const jobsTomorrow = ctx.jobs.filter(
    (j) => j.date === tomorrow && j.status !== 'cancelled' && j.status !== 'completed',
  ).length

  return {
    openDeals: open.length,
    stalledDeals: stalled.length,
    openChats: openThreads.length,
    awaitingReply: awaiting.length,
    activities24h,
    jobsTomorrow,
    openDealsHint:
      stalled.length > 0
        ? `${stalled.length} stalled > ${STALL_DAYS} days`
        : open.length > 0
          ? 'Pipeline looks current'
          : 'No open deals',
    openChatsHint:
      awaiting.length > 0
        ? `${awaiting.length} awaiting your reply`
        : openThreads.length > 0
          ? 'None waiting on you'
          : 'Inbox clear',
    activitiesHint:
      jobsTomorrow === 0
        ? '0 booked tomorrow'
        : `${jobsTomorrow} job${jobsTomorrow === 1 ? '' : 's'} tomorrow`,
  }
}

function coatingLike(lead: DeskLead): boolean {
  const hay = `${lead.service_interest ?? ''} ${lead.packageName ?? ''} ${lead.notes ?? ''}`.toLowerCase()
  return /coat|ceramic|ppf|paint\s*protect/.test(hay)
}

function buildDraftSuggestions(ctx: AssistContext, snap: AssistSnapshot): AssistSuggestion[] {
  const now = ctx.now ?? new Date()
  const focusId = ctx.focusContactId
  const contact = focusId ? ctx.clients.find((c) => c.id === focusId) : undefined

  if (contact) {
    const lead = leadForContact(ctx.leads, contact.id)
    const vehicle = vehicleLabel(ctx.vehicles, contact.id)
    const idle =
      daysSince(lastActivityAt(ctx.activities, contact.id), now) ??
      (lead ? leadIdleDays(lead, ctx.activities, now) : null)
    const first = contact.name.split(' ')[0] || contact.name
    const out: AssistSuggestion[] = []

    if (lead?.stage === 'quoted') {
      out.push({
        id: 'd-follow-quote',
        icon: 'mail',
        title: `Follow up on ${first}'s quote`,
        body: `${contact.name} has an open quote${lead.quote_amount ? ` ($${Math.round(lead.quote_amount).toLocaleString()})` : ''}${vehicle ? ` for their ${vehicle}` : ''}${lead.service_interest ? ` — ${lead.service_interest}` : ''}. A short nudge referencing the vehicle and warranty/value (not a discount) can move them to book.`,
        meta: idle != null ? `Idle ${formatDays(idle)}` : 'Quoted stage',
        tone: idle != null && idle >= STALL_DAYS ? 'warn' : 'info',
      })
      out.push({
        id: 'd-offer-slot',
        icon: 'calendar',
        title: 'Offer a concrete booking slot',
        body:
          snap.jobsTomorrow === 0
            ? `Nothing is booked for tomorrow. Pre-filling one open slot in the email to ${first} removes a step and lifts booking rate.`
            : `Suggest a named day and time rather than an open question — leads book faster when the email contains a single slot.`,
        meta: snap.jobsTomorrow === 0 ? 'Tomorrow open' : 'Named slot converts better',
        tone: 'good',
      })
    } else if (lead?.stage === 'inquiry') {
      out.push({
        id: 'd-send-quote',
        icon: 'mail',
        title: `Send ${first} a quote`,
        body: `${contact.name} is still in Inquiry${lead.service_interest ? ` (${lead.service_interest})` : ''}${vehicle ? ` · ${vehicle}` : ''}. A clear package quote with one next step beats another generic check-in.`,
        meta: 'Inquiry stage',
        tone: 'info',
      })
    } else {
      out.push({
        id: 'd-check-in',
        icon: 'mail',
        title: `Check in with ${contact.name}`,
        body: `${contact.name}${vehicle ? ` (${vehicle})` : ''} has no open deal logged. A brief, specific follow-up keeps the conversation warm or surfaces a new job.`,
        tone: 'info',
      })
    }

    if (idle != null && idle >= STALL_DAYS && lead && lead.stage !== 'booked') {
      out.push({
        id: 'd-stale-flag',
        icon: 'warn',
        title: 'Flag the stale deal',
        body: `This contact has been idle ${formatDays(idle)}. If they don’t respond to a nudge, move the deal or mark it lost-eligible so it stops inflating your open-deal count.`,
        meta: 'Affects pipeline health',
        tone: 'warn',
      })
    }

    if (out.length < 2) {
      out.push({
        id: 'd-slot-generic',
        icon: 'calendar',
        title: 'Offer the next available slot',
        body: 'Suggest a concrete booking time rather than an open question. Leads book faster when the email contains a single named day and time.',
        tone: 'good',
      })
    }

    return out
  }

  const stalled = openLeads(ctx.leads)
    .filter((l) => isStalledLead(l, ctx.activities, now))
    .slice(0, 3)
  const out: AssistSuggestion[] = []

  if (stalled.length > 0) {
    const names = stalled
      .map((l) => {
        const c = l.client_id ? ctx.clients.find((x) => x.id === l.client_id) : undefined
        return c?.name || l.name
      })
      .join(' and ')
    out.push({
      id: 'dg-reengage',
      icon: 'mail',
      title: `Re-engage ${stalled.length} stalled quote${stalled.length === 1 ? '' : 's'}`,
      body: `${names} ${stalled.length === 1 ? 'has' : 'have'} had little or no activity for ${STALL_DAYS}+ days. A short check-in on each could recover them before they go cold.`,
      meta: `${stalled.length} contact${stalled.length === 1 ? '' : 's'} · ${STALL_DAYS}+ days idle`,
      tone: 'warn',
    })
  }

  out.push({
    id: 'dg-fill-bay',
    icon: 'calendar',
    title: snap.jobsTomorrow === 0 ? 'Fill tomorrow’s open bay' : 'Protect bay utilization',
    body:
      snap.jobsTomorrow === 0
        ? `You have no jobs scheduled tomorrow. Drafting a quick availability note to your most recent quote recipients may fill it without a new lead.`
        : `You have ${snap.jobsTomorrow} job${snap.jobsTomorrow === 1 ? '' : 's'} tomorrow. Use spare capacity to pull one stalled quote forward.`,
    meta:
      snap.openDeals > 0
        ? `${snap.jobsTomorrow} tomorrow · ${snap.openDeals} open deals`
        : `${snap.jobsTomorrow} booked tomorrow`,
    tone: snap.jobsTomorrow === 0 ? 'warn' : 'info',
  })

  const coating = openLeads(ctx.leads).filter(coatingLike)
  if (coating.length > 0) {
    out.push({
      id: 'dg-coating',
      icon: 'shield',
      title: 'Prioritize coating / protection leads',
      body: `${coating.length} open deal${coating.length === 1 ? '' : 's'} look like coating or paint-protection work. A reminder or follow-up keeps high-value jobs moving.`,
      meta: `${coating.length} high-value lead${coating.length === 1 ? '' : 's'}`,
      tone: 'good',
    })
  } else if (out.length < 3) {
    out.push({
      id: 'dg-general',
      icon: 'mail',
      title: 'Keep recent quotes warm',
      body: 'Pick a focus contact above for a personalized draft, or jump to Deals to advance the next Inquiry → Quoted → Booked move.',
      tone: 'info',
    })
  }

  return out
}

function buildPipelineSuggestions(ctx: AssistContext, snap: AssistSnapshot): AssistSuggestion[] {
  const now = ctx.now ?? new Date()
  const open = openLeads(ctx.leads)
  const stalled = open.filter((l) => isStalledLead(l, ctx.activities, now))
  const out: AssistSuggestion[] = []

  if (stalled.length > 0) {
    const sample = stalled
      .slice(0, 2)
      .map((l) => {
        const c = l.client_id ? ctx.clients.find((x) => x.id === l.client_id) : undefined
        const idle = leadIdleDays(l, ctx.activities, now)
        return `${c?.name || l.name} (${idle}d)`
      })
      .join(', ')
    const pct = open.length ? Math.round((stalled.length / open.length) * 100) : 0
    out.push({
      id: 'p-stall',
      icon: 'warn',
      title: `${stalled.length} deal${stalled.length === 1 ? ' is' : 's are'} stalling your pipeline`,
      body: `${sample} sit in open stages with little recent activity. Move them to a follow-up, book them, or clear them so your open-deal count stays honest.`,
      meta: `${stalled.length} of ${open.length} open · ${pct}%`,
      tone: 'warn',
    })
  } else if (open.length > 0) {
    out.push({
      id: 'p-healthy',
      icon: 'check',
      title: 'Pipeline looks active',
      body: `You have ${open.length} open deal${open.length === 1 ? '' : 's'} and none are past the ${STALL_DAYS}-day idle threshold. Keep pushing Inquiry → Quoted → Booked.`,
      meta: `${open.length} open`,
      tone: 'good',
    })
  } else {
    out.push({
      id: 'p-empty',
      icon: 'briefcase',
      title: 'No open deals',
      body: 'Your pipeline is empty. Capture the next inquiry from Inbox or Contacts so Assist has deals to prioritize.',
      tone: 'info',
    })
  }

  const withAmount = open.filter((l) => l.quote_amount > 0)
  if (withAmount.length > 0) {
    const total = withAmount.reduce((s, l) => s + l.quote_amount, 0)
    const avg = total / withAmount.length
    const coating = withAmount.filter(coatingLike)
    out.push({
      id: 'p-value',
      icon: 'briefcase',
      title: coating.length > 0 ? 'High-value / coating leads first' : 'Quoted revenue in play',
      body:
        coating.length > 0
          ? `${coating.length} of ${open.length} open deals look like higher-ticket protection work (avg ~$${Math.round(avg).toLocaleString()}). Prioritize those follow-ups for more revenue per bay.`
          : `${withAmount.length} quoted deal${withAmount.length === 1 ? '' : 's'} total ~$${Math.round(total).toLocaleString()} (avg ~$${Math.round(avg).toLocaleString()}). Focus the largest quotes first.`,
      meta: `~$${Math.round(total).toLocaleString()} potential`,
      tone: 'good',
    })
  }

  out.push({
    id: 'p-tomorrow',
    icon: 'calendar',
    title: snap.jobsTomorrow === 0 ? 'Nothing booked for tomorrow' : 'Tomorrow’s schedule',
    body:
      snap.jobsTomorrow === 0
        ? 'Your calendar shows zero jobs scheduled tomorrow. Pulling one stalled quote forward today protects tomorrow’s revenue and bay utilization.'
        : `You have ${snap.jobsTomorrow} job${snap.jobsTomorrow === 1 ? '' : 's'} on the books for tomorrow. Use spare capacity to advance open quotes.`,
    meta: `${snap.jobsTomorrow} jobs · tomorrow`,
    tone: snap.jobsTomorrow === 0 ? 'warn' : 'info',
  })

  return out
}

function buildChatSuggestions(ctx: AssistContext, snap: AssistSnapshot): AssistSuggestion[] {
  const now = ctx.now ?? new Date()
  const openThreads = ctx.threads.filter(isActiveThread)
  const awaiting = openThreads.filter(isAwaitingReply)
  const out: AssistSuggestion[] = []

  if (awaiting.length > 0) {
    const top = [...awaiting].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))[0]
    const hours = Math.max(0, Math.floor((now.getTime() - new Date(top.last_message_at).getTime()) / 3_600_000))
    const who =
      (top.contact_id && ctx.clients.find((c) => c.id === top.contact_id)?.name) || top.visitor_name
    out.push({
      id: 'c-waiting',
      icon: 'chat',
      title: `${who} is waiting on you`,
      body: `${who} has an open Inbox thread awaiting your response${hours > 0 ? ` (${hours}h since last message)` : ''}. Answering first prevents losing a ready-to-book customer.`,
      meta:
        awaiting.length === 1
          ? '1 thread awaiting reply'
          : `${awaiting.length} threads awaiting reply`,
      tone: 'warn',
    })
  } else if (openThreads.length > 0) {
    out.push({
      id: 'c-caught-up',
      icon: 'check',
      title: 'You’re caught up on open chats',
      body: `${openThreads.length} open thread${openThreads.length === 1 ? '' : 's'}, none marked as unread. Keep an eye on new visitor messages.`,
      meta: 'No reply needed',
      tone: 'good',
    })
  } else {
    out.push({
      id: 'c-empty',
      icon: 'chat',
      title: 'Inbox is clear',
      body: 'No open chat threads right now. New visitor messages will show up in Inbox.',
      tone: 'info',
    })
  }

  const quiet = openThreads.filter((t) => {
    const idle = daysSince(t.last_message_at, now)
    return idle != null && idle >= QUIET_CHAT_DAYS && !isAwaitingReply(t)
  })
  if (quiet.length > 0) {
    const t = quiet[0]
    const who = (t.contact_id && ctx.clients.find((c) => c.id === t.contact_id)?.name) || t.visitor_name
    const idle = daysSince(t.last_message_at, now) ?? QUIET_CHAT_DAYS
    out.push({
      id: 'c-quiet',
      icon: 'clock',
      title: `${who}'s chat has gone quiet`,
      body: `${who}'s Inbox thread has had no recent activity for ${formatDays(idle)}. A single re-engagement message is cheaper than replacing the lead.`,
      meta: `${formatDays(idle)} silent`,
      tone: 'info',
    })
  }

  if (snap.awaitingReply === 0 && openThreads.length > 1) {
    out.push({
      id: 'c-priority',
      icon: 'chat',
      title: 'Don’t let confirmations steal focus',
      body: 'Skip threads that are already confirmed or closed-loop. Spend attention on unanswered visitor messages first.',
      meta: `${openThreads.length} open chats`,
      tone: 'good',
    })
  }

  return out
}

function buildActivitySuggestions(ctx: AssistContext, snap: AssistSnapshot): AssistSuggestion[] {
  const now = ctx.now ?? new Date()
  const out: AssistSuggestion[] = []
  const focusId = ctx.focusContactId
  const contact = focusId ? ctx.clients.find((c) => c.id === focusId) : undefined

  const stalled = openLeads(ctx.leads)
    .filter((l) => isStalledLead(l, ctx.activities, now))
    .sort((a, b) => leadIdleDays(b, ctx.activities, now) - leadIdleDays(a, ctx.activities, now))

  const awaiting = ctx.threads.filter(isAwaitingReply)
  if (awaiting.length > 0) {
    const top = awaiting[0]
    const who =
      (top.contact_id && ctx.clients.find((c) => c.id === top.contact_id)?.name) || top.visitor_name
    const hours = Math.max(0, Math.floor((now.getTime() - new Date(top.last_message_at).getTime()) / 3_600_000))
    out.push({
      id: 'a-reply',
      icon: 'chat',
      title: `Reply to ${who} in Inbox`,
      body: `${who} is waiting on an open chat. A quick reply clears your open-chat count and can lock in a booking.`,
      meta: hours > 0 ? `Overdue · ${hours}h` : 'Due now',
      tone: 'warn',
    })
  }

  if (contact) {
    const lead = leadForContact(ctx.leads, contact.id)
    const idle = daysSince(lastActivityAt(ctx.activities, contact.id), now)
    out.push({
      id: 'a-call-focus',
      icon: 'phone',
      title: `Call or log a touch with ${contact.name}`,
      body:
        lead?.stage === 'quoted'
          ? `${contact.name} has a quote open${idle != null ? ` with ${formatDays(idle)} idle` : ''}. A short call is often faster than another email.`
          : `Log a call or note for ${contact.name}, then schedule a follow-up on Calendar.`,
      meta: idle != null && idle >= STALL_DAYS ? 'Due today' : 'Next touch',
      tone: idle != null && idle >= STALL_DAYS ? 'warn' : 'info',
    })
  } else if (stalled.length > 0) {
    const lead = stalled[0]
    const who = (lead.client_id && ctx.clients.find((c) => c.id === lead.client_id)?.name) || lead.name
    const idle = leadIdleDays(lead, ctx.activities, now)
    out.push({
      id: 'a-call-stall',
      icon: 'phone',
      title: `Call ${who} about their open deal`,
      body: `${who} has been idle ${formatDays(idle)} in ${lead.stage}. A 5-minute call today is the fastest path to a booking decision.`,
      meta: 'Due today',
      tone: 'warn',
    })
  }

  if (stalled.length > 0) {
    const lead = stalled[contact ? 0 : Math.min(1, stalled.length - 1)] || stalled[0]
    const who = (lead.client_id && ctx.clients.find((c) => c.id === lead.client_id)?.name) || lead.name
    out.push({
      id: 'a-schedule',
      icon: 'calendar',
      title: `Schedule ${who}'s follow-up`,
      body: `Log a follow-up activity for tomorrow morning so ${who}'s deal doesn’t silently slip to lost.`,
      meta: 'Schedule for tomorrow AM',
      tone: 'info',
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'a-empty',
      icon: 'calendar',
      title: snap.activities24h === 0 ? 'Log your next customer touch' : 'Keep the streak going',
      body:
        snap.activities24h === 0
          ? 'No activities in the last 24 hours. Pick a contact, log a call or note, then schedule the next job on Calendar.'
          : `You’ve logged ${snap.activities24h} activit${snap.activities24h === 1 ? 'y' : 'ies'} in the last 24h. Review open deals for the next follow-up.`,
      tone: 'info',
    })
  }

  return out
}

export function buildAssistSuggestions(chip: AssistChip, ctx: AssistContext): AssistSuggestion[] {
  const snap = buildAssistSnapshot(ctx)
  if (chip === 'draft') return buildDraftSuggestions(ctx, snap)
  if (chip === 'pipeline') return buildPipelineSuggestions(ctx, snap)
  if (chip === 'chat') return buildChatSuggestions(ctx, snap)
  return buildActivitySuggestions(ctx, snap)
}

/** Infer chip from free-text ask; defaults to activity when unclear. */
export function inferAssistChip(text: string, fallback: AssistChip | null = null): AssistChip {
  const q = text.toLowerCase()
  if (q.includes('email') || q.includes('draft') || q.includes('write')) return 'draft'
  if (q.includes('pipeline') || q.includes('deal')) return 'pipeline'
  if (q.includes('chat') || q.includes('inbox') || q.includes('reply')) return 'chat'
  if (q.includes('activity') || q.includes('call') || q.includes('next') || q.includes('schedule')) {
    return 'activity'
  }
  return fallback ?? 'activity'
}

/** String tips for surfaces that still expect plain text (e.g. Chat sparkle). */
export function buildAiSuggestionLines(input: {
  contactName?: string
  openDeals?: number
  recentActivityCount?: number
  openChats?: number
}): string[] {
  const tips: string[] = []
  if (input.contactName) {
    tips.push(`Summarize recent touchpoints with ${input.contactName} before your next call.`)
  }
  if ((input.openDeals ?? 0) > 0) {
    tips.push(`You have ${input.openDeals} open deal(s) — prioritize Quoted-stage follow-ups.`)
  }
  if ((input.recentActivityCount ?? 0) === 0) {
    tips.push('No recent activities logged — add a note after your next customer touch.')
  }
  if ((input.openChats ?? 0) > 0) {
    tips.push(`${input.openChats} open chat(s) waiting — reply within a few minutes for best conversion.`)
  }
  if (tips.length === 0) {
    tips.push('Ask me to draft a follow-up email, suggest a next activity, or review pipeline health.')
  }
  return tips
}
