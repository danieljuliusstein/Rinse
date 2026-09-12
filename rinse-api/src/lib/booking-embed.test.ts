import { describe, expect, it } from 'vitest'
import {
  bookingPageUrl,
  embedCalendarPageUrl,
  embedCalendarScriptHtml,
  exampleSiteUrl,
} from './booking-embed'

describe('booking-embed', () => {
  it('builds booking URL with query params', () => {
    expect(bookingPageUrl('https://app.example.com', 'mike-detail', { date: '2026-06-25', time: '09:00' })).toBe(
      'https://app.example.com/book/mike-detail?date=2026-06-25&time=09%3A00',
    )
  })

  it('builds embed calendar page URL', () => {
    expect(embedCalendarPageUrl('https://app.example.com/', 'atlas')).toBe(
      'https://app.example.com/embed/book/atlas',
    )
  })

  it('includes slug in script snippet', () => {
    const html = embedCalendarScriptHtml('https://app.example.com', 'atlas-detailing', 'Rinse')
    expect(html).toContain('data-detail-booking="atlas-detailing"')
    expect(html).toContain('Book with Rinse')
    expect(html).toContain('https://app.example.com/embed.js')
    expect(html).not.toContain('<!--')
  })

  it('builds example site URL with brand', () => {
    expect(exampleSiteUrl('https://app.example.com', 'my-slug', 'Rinse')).toBe(
      'https://app.example.com/examples/customer-site.html?slug=my-slug&brand=Rinse',
    )
  })
})
