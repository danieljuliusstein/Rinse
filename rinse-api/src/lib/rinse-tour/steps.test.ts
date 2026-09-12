import { describe, expect, it } from 'vitest'
import { buildRinseTourSteps } from './steps'
import { coachSelector } from '../tour-targets'

describe('buildRinseTourSteps', () => {
  it('builds a six-step Next-only overview tour', () => {
    const steps = buildRinseTourSteps()
    expect(steps).toHaveLength(6)
    expect(steps[0].title).toBe('Welcome to Rinse')
    expect(steps[steps.length - 1].title).toBe('Lead pipeline')
  })

  it('covers each main screen with one overview step', () => {
    const steps = buildRinseTourSteps()
    expect(steps.filter((s) => s.section === 'home')).toHaveLength(2)
    expect(steps.filter((s) => s.section === 'jobs')).toHaveLength(1)
    expect(steps.filter((s) => s.section === 'clients')).toHaveLength(1)
    expect(steps.filter((s) => s.section === 'money')).toHaveLength(1)
    expect(steps.filter((s) => s.section === 'pipeline')).toHaveLength(1)
    expect(steps.every((s) => s.advance !== 'tap')).toBe(true)
  })

  it('routes to each screen except welcome', () => {
    const steps = buildRinseTourSteps()
    expect(steps[0].route).toBeUndefined()
    expect(steps[1].route).toBe('/')
    expect(steps[2].route).toBe('/jobs')
    expect(steps[3].route).toBe('/clients')
    expect(steps[4].route).toBe('/reports')
    expect(steps[5].route).toBe('/pipeline')
    expect(steps[2].selector).toBe(coachSelector('jobs-search'))
  })
})
