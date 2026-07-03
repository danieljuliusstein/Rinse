import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeRinseTour,
  getRinseTourState,
  isRinseTourActive,
  nextRinseTourStep,
  rinseTourEndedNaturally,
  startRinseTour,
} from './controller'
import { buildRinseTourSteps } from './steps'

describe('rinse tour controller', () => {
  beforeEach(() => {
    if (isRinseTourActive()) completeRinseTour()
  })

  it('walks all six steps then completes naturally', () => {
    const steps = buildRinseTourSteps()
    startRinseTour(steps)
    expect(getRinseTourState().index).toBe(0)
    expect(getRinseTourState().step?.id).toBe('welcome')

    for (let i = 0; i < steps.length - 1; i += 1) {
      nextRinseTourStep()
      expect(isRinseTourActive()).toBe(true)
      expect(getRinseTourState().index).toBe(i + 1)
    }

    nextRinseTourStep()
    expect(isRinseTourActive()).toBe(false)
    expect(rinseTourEndedNaturally()).toBe(true)
  })

  it('completes when Done would fire on the last step', () => {
    const steps = buildRinseTourSteps()
    startRinseTour(steps)
    for (let i = 0; i < steps.length; i += 1) {
      nextRinseTourStep()
    }
    expect(isRinseTourActive()).toBe(false)
    expect(rinseTourEndedNaturally()).toBe(true)
  })
})
