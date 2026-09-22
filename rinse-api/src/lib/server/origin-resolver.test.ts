import { describe, expect, it } from 'vitest'
import {
  extractSlugFromPath,
  normalizeOrigin,
  normalizeOrigins,
} from './origin-resolver'

describe('origin-resolver', () => {
  describe('normalizeOrigin', () => {
    it('normalizes full URLs with trailing slash and paths', () => {
      expect(normalizeOrigin('https://sparkledetailing.com/booking/')).toBe(
        'https://sparkledetailing.com',
      )
      expect(normalizeOrigin('https://sub.mybrand.org:8443/some/path?query=1#frag')).toBe(
        'https://sub.mybrand.org:8443',
      )
    })

    it('adds https to bare domains', () => {
      expect(normalizeOrigin('sparkledetailing.com')).toBe('https://sparkledetailing.com')
      expect(normalizeOrigin('sub.domain.co.uk')).toBe('https://sub.domain.co.uk')
    })

    it('defaults localhost to http', () => {
      expect(normalizeOrigin('localhost:3000')).toBe('http://localhost:3000')
      expect(normalizeOrigin('127.0.0.1:8080')).toBe('http://127.0.0.1:8080')
    })

    it('preserves * and self keyword', () => {
      expect(normalizeOrigin('*')).toBe('*')
      expect(normalizeOrigin("'self'")).toBe("'self'")
    })

    it('rejects invalid inputs and non-http/https protocols', () => {
      expect(normalizeOrigin('')).toBeNull()
      expect(normalizeOrigin('   ')).toBeNull()
      expect(normalizeOrigin('javascript:alert(1)')).toBeNull()
      expect(normalizeOrigin('file:///etc/passwd')).toBeNull()
      expect(normalizeOrigin('data:text/html,test')).toBeNull()
    })
  })

  describe('normalizeOrigins', () => {
    it('handles arrays and deduplicates', () => {
      const input = [
        'https://example.com/a',
        'example.com',
        'https://sub.example.com',
        'invalid:protocol',
        '',
      ]
      expect(normalizeOrigins(input)).toEqual([
        'https://example.com',
        'https://sub.example.com',
      ])
    })

    it('handles comma-separated and newline-separated strings', () => {
      const input = 'https://foo.com/path, bar.com\nhttps://baz.org:443'
      expect(normalizeOrigins(input)).toEqual([
        'https://foo.com',
        'https://bar.com',
        'https://baz.org',
      ])
    })

    it('handles null/undefined/empty input', () => {
      expect(normalizeOrigins(null)).toEqual([])
      expect(normalizeOrigins(undefined)).toEqual([])
      expect(normalizeOrigins('')).toEqual([])
    })
  })

  describe('extractSlugFromPath', () => {
    it('extracts slug from /book/:slug', () => {
      expect(extractSlugFromPath('/book/atlas-detailing')).toBe('atlas-detailing')
      expect(extractSlugFromPath('/book/atlas-detailing/packages')).toBe('atlas-detailing')
      expect(extractSlugFromPath('/book/atlas%20detailing')).toBe('atlas detailing')
    })

    it('extracts slug from /embed/book/:slug', () => {
      expect(extractSlugFromPath('/embed/book/sparkle-wash')).toBe('sparkle-wash')
      expect(extractSlugFromPath('/embed/book/sparkle-wash?step=2')).toBe('sparkle-wash')
    })

    it('extracts slug from /api/public/:slug/...', () => {
      expect(extractSlugFromPath('/api/public/apex/business')).toBe('apex')
      expect(extractSlugFromPath('/api/public/apex/availability')).toBe('apex')
    })

    it('returns null for non-slug routes', () => {
      expect(extractSlugFromPath('/jobs')).toBeNull()
      expect(extractSlugFromPath('/clients')).toBeNull()
      expect(extractSlugFromPath('/book')).toBeNull()
      expect(extractSlugFromPath('/embed/book')).toBeNull()
    })
  })
})
