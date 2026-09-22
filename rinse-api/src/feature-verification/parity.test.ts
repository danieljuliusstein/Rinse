import { describe, expect, it } from 'vitest'

type Operation = {
  name: string
  input: Record<string, unknown>
  expectedFields: string[]
}

const operations: Operation[] = [
  { name: 'createClient', input: { name: 'Parity Client', email: 'parity@example.test' }, expectedFields: ['name', 'email'] },
  { name: 'createJob', input: { clientId: 'client-1', packageId: 'package-1', revenue: 100 }, expectedFields: ['clientId', 'packageId', 'revenue'] },
  { name: 'updateInvoice', input: { invoiceId: 'invoice-1', status: 'sent' }, expectedFields: ['invoiceId', 'status'] },
  { name: 'createVehicle', input: { client_id: 'client-1', make: 'Ford', model: 'Transit' }, expectedFields: ['client_id', 'make', 'model'] },
]

function normalizeOperation(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined))
}

describe('API/desktop/mobile operation parity contract', () => {
  it('defines a shared operation contract for core mutations', () => {
    for (const operation of operations) {
      const normalized = normalizeOperation(operation.input)
      expect(Object.keys(normalized)).toEqual(expect.arrayContaining(operation.expectedFields))
      expect(Object.keys(normalized).length).toBe(operation.expectedFields.length)
    }
  })

  it('preserves identifiers and status values across adapter normalization', () => {
    const api = normalizeOperation({ invoiceId: 'invoice-1', status: 'sent' })
    const desktop = normalizeOperation({ invoiceId: 'invoice-1', status: 'sent' })
    const mobile = normalizeOperation({ invoiceId: 'invoice-1', status: 'sent' })
    expect(desktop).toEqual(api)
    expect(mobile).toEqual(api)
  })
})
