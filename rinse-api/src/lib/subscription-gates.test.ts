import { describe, expect, it } from 'vitest'
import { resolveGate } from './subscription-gates'
const free = { plan: 'free', founding_member: false, subscription_status: 'none' }
describe.each([['api', resolveGate]] as const)('%s gates', (_name, gate) => {
  it('allows the entire invoice path on Free', () => {
    for (const action of ['create_job','create_invoice','send_invoice','invoice_pdf','invoice_payment'] as const) expect(gate(free, false, action).allowed).toBe(true)
  })
  it('keeps unrelated paid actions gated', () => {
    for (const action of ['create_quote','send_quote','share_portal','new_lead','export_pdf'] as const) expect(gate(free, false, action).allowed).toBe(false)
  })
  it('fails closed while subscription identity is unknown', () => { expect(gate(null, false, 'send_invoice').allowed).toBe(false) })
  it('gives Starter and Early matching access', () => {
    for (const plan of ['starter','early']) expect(gate({ ...free, plan, subscription_status:'active', current_period_end:'2030-01-01' }, false, 'new_lead').allowed).toBe(true)
  })
})
