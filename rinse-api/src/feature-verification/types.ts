export type FeatureStatus = 'verified' | 'partial' | 'mocked' | 'broken' | 'not-tested'

export type FeatureEvidence = {
  inputs?: Record<string, unknown>
  recordsAffected?: Array<{ table: string; operation: string; id?: string }>
  externalCalls?: Array<{ service: string; operation: string; payload?: unknown }>
  response?: unknown
  error?: { name?: string; message: string; status?: number }
}

export type FeatureExecution = FeatureEvidence & {
  assertionsPassed: string[]
  assertionsFailed: string[]
}

export type FeatureCheck = {
  id: string
  area: string
  description: string
  entrypoint: string
  status: FeatureStatus
  requires: string[]
  assertions: string[]
  execute: () => Promise<FeatureExecution>
}

export type FeatureResult = FeatureCheck & {
  durationMs: number
  assertionsPassed: string[]
  assertionsFailed: string[]
  evidence: FeatureEvidence
  error?: { name?: string; message: string; stack?: string }
}

export type FeatureReport = {
  generatedAt: string
  package: string
  summary: Record<FeatureStatus | 'total', number>
  results: FeatureResult[]
}
