import assert from 'node:assert/strict'
import { test } from 'node:test'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  clientFormSchema,
  quickJobFormSchema,
  jobEditFormSchema,
  quoteFormSchema,
  onboardingBusinessSchema,
} from '../../packages/core/src/validation/schemas'

const options = { criteriaMode: 'firstError' as const, fields: {}, shouldUseNativeValidation: false }
const amounts = { tip: '0', travel_cost: '0', marketing_cost: '0', equipment_depreciation: '0' }

test('client resolver accepts omitted optional fields and trims names', async () => {
  const resolve = zodResolver(clientFormSchema)
  const result = await resolve({ name: '  Example Client  ' }, {}, options)
  assert.deepEqual(result.errors, {})
  assert.equal(result.values.name, 'Example Client')
  const invalid = await resolve({ name: 'Client', email: 'invalid' }, {}, options)
  assert.ok(invalid.errors.email)
})

test('job creation resolver converts amounts and rejects negative revenue', async () => {
  const resolve = zodResolver(quickJobFormSchema)
  const input = { ...amounts, clientId: 'client', packageId: 'package', vehicleType: 'sedan', locationType: 'mobile' as const, revenue: '125.50', date: '2026-09-22' }
  const result = await resolve(input, {}, options)
  assert.deepEqual(result.errors, {})
  assert.equal(result.values.revenue, 125.5)
  assert.ok((await resolve({ ...input, revenue: '-1' }, {}, options)).errors.revenue)
})

test('job edit resolver converts deposits and rejects negative tips', async () => {
  const resolve = zodResolver(jobEditFormSchema)
  const input = { ...amounts, date: '2026-09-22', revenue: '125', hours_worked: '2', deposit_amount: '25', status: 'scheduled' as const }
  const result = await resolve(input, {}, options)
  assert.deepEqual(result.errors, {})
  assert.equal(result.values.deposit_amount, 25)
  assert.ok((await resolve({ ...input, tip: '-1' }, {}, options)).errors.tip)
})

test('quote resolver converts subtotal and rejects invalid dates', async () => {
  const resolve = zodResolver(quoteFormSchema)
  const input = { client_id: 'client', package_id: 'package', date: '2026-09-22', valid_until: '2026-10-22', vehicle_type: 'sedan' as const, location_type: 'mobile' as const, subtotal: '125' }
  const result = await resolve(input, {}, options)
  assert.deepEqual(result.errors, {})
  assert.equal(result.values.subtotal, 125)
  assert.ok((await resolve({ ...input, valid_until: 'invalid' }, {}, options)).errors.valid_until)
})

test('onboarding resolver accepts a valid phone and rejects an empty business name', async () => {
  const resolve = zodResolver(onboardingBusinessSchema)
  const input = { business_name: 'Example', business_phone: '2125550123' }
  assert.deepEqual((await resolve(input, {}, options)).errors, {})
  assert.ok((await resolve({ ...input, business_name: '' }, {}, options)).errors.business_name)
})
