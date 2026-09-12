import { describe, expect, it } from 'vitest'
import { normalizeVehicleColorHex, vehicleColorDisplayHex } from './vehicle-color'

describe('normalizeVehicleColorHex', () => {
  it('accepts 6-digit hex', () => {
    expect(normalizeVehicleColorHex('#1A3A6A')).toBe('#1a3a6a')
  })

  it('accepts 3-digit hex', () => {
    expect(normalizeVehicleColorHex('#f00')).toBe('#ff0000')
  })

  it('accepts hex without hash', () => {
    expect(normalizeVehicleColorHex('1a3a6a')).toBe('#1a3a6a')
  })

  it('rejects invalid values', () => {
    expect(normalizeVehicleColorHex('blue')).toBeUndefined()
    expect(normalizeVehicleColorHex('')).toBeUndefined()
  })
})

describe('vehicleColorDisplayHex', () => {
  it('falls back when empty', () => {
    expect(vehicleColorDisplayHex('')).toBe('#888888')
  })
})
