import { describe, expect, it, vi, beforeEach } from 'vitest'
import { logAuditEvent } from './audit-log'

vi.mock('./platform-events', () => ({
  logPlatformEvent: vi.fn(async () => undefined),
}))

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes structured JSON to console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logAuditEvent('admin_backup_triggered', { actor: 'test@example.com', scope: 'all' })
    expect(spy).toHaveBeenCalledOnce()
    const payload = JSON.parse(String(spy.mock.calls[0][0]))
    expect(payload.event).toBe('admin_backup_triggered')
    expect(payload.actor).toBe('test@example.com')
    expect(payload.timestamp).toBeTruthy()
    spy.mockRestore()
  })
})
