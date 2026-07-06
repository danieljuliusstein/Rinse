import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  CLIENT_PLATFORM_EVENT_TYPES,
  getSignupMetrics,
  listPlatformEvents,
  logPlatformEvent,
  PLATFORM_EVENT_LABELS,
} from './platform-events'

const mockCreate = vi.fn()
const mockGetList = vi.fn()
const mockGetFullList = vi.fn()

vi.mock('./pocketbase-admin', () => ({
  authenticateServerAdmin: vi.fn(async () => ({
    collection: (name: string) => {
      if (name === 'platform_events') {
        return { create: mockCreate, getList: mockGetList, getFullList: mockGetFullList }
      }
      if (name === 'organizations') {
        return { getFullList: mockGetFullList }
      }
      throw new Error(`unexpected collection ${name}`)
    },
  })),
}))

describe('platform-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ id: 'evt1' })
  })

  it('persists events with default category', async () => {
    await logPlatformEvent('org_created', {
      organizationId: 'org1',
      actorEmail: 'a@b.com',
      detail: 'Acme (/acme)',
      metadata: { source: 'email_signup' },
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'org_created',
        category: 'product',
        organization_id: 'org1',
        actor_email: 'a@b.com',
        detail: 'Acme (/acme)',
        metadata: { source: 'email_signup' },
        occurred_at: expect.any(String),
      }),
    )
  })

  it('does not throw when persistence fails', async () => {
    mockCreate.mockRejectedValue(new Error('db down'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(logPlatformEvent('auth_failure', { metadata: { route: '/x' } })).resolves.toBeUndefined()
    warn.mockRestore()
  })

  it('lists events with filters', async () => {
    mockGetList.mockResolvedValue({
      items: [
        {
          id: 'e1',
          type: 'admin_backup_triggered',
          category: 'admin',
          actor_email: 'admin@rinsehq.com',
          detail: 'scope: all',
          created: '2026-07-05T12:00:00.000Z',
        },
      ],
    })

    const events = await listPlatformEvents({ limit: 10, category: 'admin' })
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('admin_backup_triggered')
    expect(mockGetList).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ filter: 'category = "admin"', sort: '-id' }),
    )
  })

  it('builds signup metrics from org_created events', async () => {
    const today = new Date()
    today.setUTCHours(12, 0, 0, 0)
    const day = today.toISOString().slice(0, 10)

    mockGetFullList.mockResolvedValue([
      { created: `${day}T10:00:00.000Z`, type: 'org_created' },
      { created: `${day}T11:00:00.000Z`, type: 'org_created' },
    ])

    const metrics = await getSignupMetrics(7)
    const todayPoint = metrics.series.find((p) => p.date === day)
    expect(todayPoint?.count).toBe(2)
    expect(metrics.total).toBe(2)
  })

  it('exposes client-allowed event types and labels', () => {
    expect(CLIENT_PLATFORM_EVENT_TYPES).toContain('onboarding_completed')
    expect(PLATFORM_EVENT_LABELS.org_created).toBe('Org created')
  })
})
