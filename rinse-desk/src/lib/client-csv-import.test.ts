import { describe, expect, it } from 'vitest'
import {
  autoMapHeaders,
  detectCsvHeaders,
  mapCsvRows,
  parseCsvLine,
} from './client-csv-import'

describe('client-csv-import', () => {
  it('parses standard CSV lines and quoted commas correctly', () => {
    const line = 'John Doe,"123 Main St, Apt 4",555-1234,test@example.com'
    const parsed = parseCsvLine(line)
    expect(parsed).toEqual(['John Doe', '123 Main St, Apt 4', '555-1234', 'test@example.com'])
  })

  it('detects header mapping automatically from alias patterns', () => {
    const rawHeaders = ['Client Name', 'Cell Phone', 'Email Address', 'Street Address', 'Car Year', 'Car Make', 'Car Model']
    const mapping = autoMapHeaders(rawHeaders)
    expect(mapping).toEqual([
      'name',
      'phone',
      'email',
      'address',
      'vehicle_year',
      'vehicle_make',
      'vehicle_model',
    ])
  })

  it('detects headers and dataLines from full CSV text', () => {
    const csv = `Client Name,Cell Phone,Email Address\nAlice Walker,555-9876,alice@example.com`
    const { headers, dataLines, mapping } = detectCsvHeaders(csv)
    expect(headers).toEqual(['Client Name', 'Cell Phone', 'Email Address'])
    expect(dataLines).toEqual(['Alice Walker,555-9876,alice@example.com'])
    expect(mapping).toEqual(['name', 'phone', 'email'])
  })

  it('maps data rows into clients and vehicles', () => {
    const mapping = ['name', 'phone', 'email', 'vehicle_year', 'vehicle_make', 'vehicle_model'] as const
    const lines = [
      'Alice Walker,555-9876,alice@example.com,2022,Tesla,Model 3',
      'Bob Smith,555-4321,bob@example.com,,,',
      ',,,', // empty row should be skipped
    ]

    const { rows, errors } = mapCsvRows(lines, [...mapping])
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(2)

    expect(rows[0].name).toBe('Alice Walker')
    expect(rows[0].phone).toBe('555-9876')
    expect(rows[0].email).toBe('alice@example.com')
    expect(rows[0].vehicle_make).toBe('Tesla')
    expect(rows[0].vehicle_model).toBe('Model 3')
    expect(rows[0].vehicle_year).toBe(2022)

    expect(rows[1].name).toBe('Bob Smith')
    expect(rows[1].vehicle_make).toBeUndefined()
  })
})
