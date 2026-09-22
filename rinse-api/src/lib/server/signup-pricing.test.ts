import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ create: vi.fn(), collection: vi.fn() }))
vi.mock('./pocketbase-admin', () => ({ authenticateServerAdmin: async () => ({ collection: mocks.collection }) }))
vi.mock('./platform-events', () => ({ logPlatformEvent: vi.fn() }))
vi.mock('../platform-admin', () => ({ isPlatformAdminEmail: () => false }))
import { registerOrganization, provisionOrganizationForOAuthUser } from './signup'
beforeEach(() => {
  mocks.create.mockReset().mockImplementation(async (_name, data) => ({ id: 'testrecord12345', ...data }))
  mocks.collection.mockImplementation((name: string) => ({
    getFullList: async () => [], getOne: async () => ({ id: 'user123', organization_id: '' }),
    create: (data: unknown) => mocks.create(name, data), update: async () => ({}), requestVerification: async () => {},
  }))
})
describe('signup pricing', () => {
  for (const mode of ['email', 'oauth']) it(`${mode} starts Free without a trial or Founding allocation`, async () => {
    if (mode === 'email') await registerOrganization({ email: 'test@example.com', password: 'example-password', businessName: 'Test Detail' })
    else await provisionOrganizationForOAuthUser({ userId: 'user123', email: 'test@example.com' })
    const org = mocks.create.mock.calls.find(([name]) => name === 'organizations')?.[1]
    expect(org).toMatchObject({ plan: 'free', subscription_status: 'none', founding_member: false, booking_enabled: false })
    expect(org).not.toHaveProperty('trial_ends_at')
  })
})
