import type { RinseTourState, RinseTourStep } from './types'

type Listener = (state: RinseTourState) => void

const initialState: RinseTourState = {
  active: false,
  index: 0,
  steps: [],
  step: null,
  layout: null,
  transitioning: false,
}

let state: RinseTourState = { ...initialState }
const listeners = new Set<Listener>()

let completedNaturally = false

function emit(): void {
  for (const listener of listeners) {
    listener(state)
  }
}

function setState(patch: Partial<RinseTourState>): void {
  state = { ...state, ...patch }
  emit()
}

export function subscribeRinseTour(listener: Listener): () => void {
  listeners.add(listener)
  queueMicrotask(() => {
    if (listeners.has(listener)) listener(state)
  })
  return () => listeners.delete(listener)
}

export function getRinseTourState(): RinseTourState {
  return state
}

export function isRinseTourActive(): boolean {
  return state.active
}

export function startRinseTour(steps: RinseTourStep[]): void {
  if (!steps.length) return
  completedNaturally = false
  setState({
    active: true,
    index: 0,
    steps,
    step: steps[0],
    layout: null,
    transitioning: true,
  })
}

export function stopRinseTour(): void {
  setState({ ...initialState })
}

export function completeRinseTour(): void {
  completedNaturally = true
  stopRinseTour()
}

export function abortRinseTour(): void {
  completedNaturally = false
  stopRinseTour()
}

export function rinseTourEndedNaturally(): boolean {
  return completedNaturally
}

export function setRinseTourIndex(index: number): void {
  if (!state.active || !state.steps.length) return
  const next = Math.max(0, Math.min(index, state.steps.length - 1))
  setState({
    index: next,
    step: state.steps[next] ?? null,
    layout: null,
    transitioning: true,
  })
}

export function setRinseTourLayout(layout: RinseTourState['layout']): void {
  setState({ layout, transitioning: false })
}

export function nextRinseTourStep(): void {
  if (!state.active) return
  if (state.index >= state.steps.length - 1) {
    completeRinseTour()
    return
  }
  setRinseTourIndex(state.index + 1)
}

export function prevRinseTourStep(): void {
  if (!state.active || state.index <= 0) return
  setRinseTourIndex(state.index - 1)
}

export function skipRinseTourSection(): void {
  if (!state.active || !state.step) return
  const currentSection = state.step.section
  let nextIndex = state.index + 1
  while (nextIndex < state.steps.length && state.steps[nextIndex]?.section === currentSection) {
    nextIndex += 1
  }
  if (nextIndex >= state.steps.length) {
    completeRinseTour()
    return
  }
  setRinseTourIndex(nextIndex)
}
