import { describe, expect, it } from 'vitest'
import { IsolatedFixtureStore } from './fixtures'

describe('persistence and authorization fixture contract', () => {
  it('prevents cross-organization reads and writes', () => {
    const store = new IsolatedFixtureStore('org-a')
    const record = store.create('invoices', { id: 'invoice-1', total: 220 })

    expect(store.getForOrganization('invoices', record.id, store.organizationId)).toEqual(record)
    expect(store.getForOrganization('invoices', record.id, 'org-b')).toBeUndefined()
    expect(() => store.updateForOrganization('invoices', record.id, 'org-b', { total: 1 })).toThrow('Record not found')
    expect(store.get('invoices', record.id)?.total).toBe(220)
  })

  it('persists valid transitions and preserves tenant ownership', () => {
    const store = new IsolatedFixtureStore('org-a')
    const record = store.create('invoices', { id: 'invoice-1', status: 'draft' })
    const updated = store.updateForOrganization('invoices', record.id, store.organizationId, { status: 'sent' })

    expect(updated.status).toBe('sent')
    expect(updated.organization_id).toBe(store.organizationId)
    expect(store.snapshot()).toEqual([{ table: 'invoices', id: 'invoice-1' }])
  })
})
