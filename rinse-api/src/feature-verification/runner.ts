import type { FeatureCheck, FeatureReport, FeatureResult } from './types'

export async function runFeatureChecks(registry: FeatureCheck[]): Promise<FeatureReport> {
  const results: FeatureResult[] = []
  for (const check of registry) {
    const started = performance.now()
    try {
      const execution = await check.execute()
      const status = execution.assertionsFailed.length > 0 && check.status === 'verified' ? 'broken' : check.status
      results.push({
        ...check,
        status,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        assertionsPassed: execution.assertionsPassed,
        assertionsFailed: execution.assertionsFailed,
        evidence: execution,
        error: execution.assertionsFailed.length
          ? { name: 'FeatureCheckIncomplete', message: execution.assertionsFailed.join('; ') }
          : undefined,
      })
    } catch (error) {
      results.push({
        ...check,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        assertionsPassed: [],
        assertionsFailed: ['check threw unexpectedly'],
        evidence: {},
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) },
      })
    }
  }

  const summary = {
    total: results.length,
    verified: results.filter((result) => result.status === 'verified').length,
    partial: results.filter((result) => result.status === 'partial').length,
    mocked: results.filter((result) => result.status === 'mocked').length,
    broken: results.filter((result) => result.status === 'broken').length,
    'not-tested': results.filter((result) => result.status === 'not-tested').length,
  }
  return { generatedAt: new Date().toISOString(), package: 'rinse-api', summary, results }
}

export function reportMarkdown(report: FeatureReport): string {
  const lines = [
    '# Rinse feature verification report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `**${report.summary.verified} verified · ${report.summary.partial} partial · ${report.summary.mocked} mocked · ${report.summary.broken} broken · ${report.summary['not-tested']} not tested**`,
    '',
    '| Feature | Area | Status | Entrypoint | Passed | Failed |',
    '|---|---|---|---|---:|---:|',
  ]
  for (const result of report.results) {
    lines.push(`| ${result.id} | ${result.area} | ${result.status} | \`${result.entrypoint}\` | ${result.assertionsPassed.length} | ${result.assertionsFailed.length} |`)
  }
  lines.push('', '## Evidence and prioritized findings', '')
  for (const result of report.results.filter((item) => item.status !== 'verified')) {
    lines.push(`- **${result.status}** \`${result.id}\`: ${result.description} ${result.error?.message ?? ''}`.trim())
  }
  return `${lines.join('\n')}\n`
}
