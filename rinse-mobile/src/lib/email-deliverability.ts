export type EmailDeliverabilityChecklist = {
  domain?: string
  spf_done?: boolean
  dkim_done?: boolean
  dmarc_done?: boolean
  resend_verified?: boolean
  updated_at?: string
}

export const DEFAULT_EMAIL_DELIVERABILITY: EmailDeliverabilityChecklist = {
  domain: '',
  spf_done: false,
  dkim_done: false,
  dmarc_done: false,
  resend_verified: false,
}

export function normalizeEmailDeliverability(raw: unknown): EmailDeliverabilityChecklist {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_EMAIL_DELIVERABILITY }
  const o = raw as Record<string, unknown>
  return {
    domain: typeof o.domain === 'string' ? o.domain.trim() : '',
    spf_done: o.spf_done === true,
    dkim_done: o.dkim_done === true,
    dmarc_done: o.dmarc_done === true,
    resend_verified: o.resend_verified === true,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : undefined,
  }
}

export function emailDeliverabilityProgress(c: EmailDeliverabilityChecklist): {
  done: number
  total: number
} {
  const flags = [c.spf_done, c.dkim_done, c.dmarc_done, c.resend_verified]
  return { done: flags.filter(Boolean).length, total: flags.length }
}
