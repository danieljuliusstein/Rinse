import { describe, expect, it } from 'vitest'
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  isIosUserAgent,
  mapsDirectionsUrl,
} from './maps-url'

describe('maps-url', () => {
  it('encodes address in Google Maps URL', () => {
    const url = googleMapsDirectionsUrl('123 Main St, Austin TX')
    expect(url).toContain('destination=123%20Main%20St%2C%20Austin%20TX')
  })

  it('encodes address in Apple Maps URL', () => {
    const url = appleMapsDirectionsUrl('456 Oak Ave')
    expect(url).toBe('maps://?daddr=456%20Oak%20Ave')
  })

  it('detects iOS user agent', () => {
    expect(isIosUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true)
    expect(isIosUserAgent('Mozilla/5.0 (Linux; Android 14)')).toBe(false)
  })

  it('prefers Apple Maps on iOS', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    expect(mapsDirectionsUrl('1 Test Rd', ua)).toMatch(/^maps:\/\//)
  })

  it('uses Google Maps elsewhere', () => {
    expect(mapsDirectionsUrl('1 Test Rd', 'Mozilla/5.0 (Macintosh)')).toMatch(/^https:\/\/www\.google\.com\/maps/)
  })
})
