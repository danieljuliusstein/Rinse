import type { PremiumAction } from './subscription-gates'

export type PremiumRequiredPayload = {
  action?: PremiumAction
  featureLabel?: string
  mode?: 'nudge' | 'lapsed' | 'free' | 'vault'
}

type PremiumListener = (payload: PremiumRequiredPayload) => void

const listeners = new Set<PremiumListener>()

export function subscribePremiumRequired(listener: PremiumListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function dispatchPremiumRequired(payload: PremiumRequiredPayload = {}): void {
  for (const listener of listeners) listener(payload)
}
