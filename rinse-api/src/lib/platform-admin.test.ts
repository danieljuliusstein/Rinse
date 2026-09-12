import { describe, expect, it } from 'vitest'
import { isPlatformAdminEmail } from './platform-admin'

describe('platform-admin', () => {
  it('checks allowlist emails', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'Admin@Example.com, other@test.com'
    expect(isPlatformAdminEmail('admin@example.com')).toBe(true)
    expect(isPlatformAdminEmail('other@test.com')).toBe(true)
    expect(isPlatformAdminEmail('nope@test.com')).toBe(false)
  })
})
