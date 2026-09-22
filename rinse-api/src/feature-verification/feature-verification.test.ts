import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { featureRegistry } from './registry'
import { reportMarkdown, runFeatureChecks } from './runner'
import { verificationScope } from './scope'

describe('programmatic feature verification', () => {
  it('runs the registry and writes structured audit evidence', async () => {
    const report = await runFeatureChecks(featureRegistry)
    const outputDir = resolve(process.cwd(), 'test-results')
    await mkdir(outputDir, { recursive: true })
    await writeFile(resolve(outputDir, 'feature-verification.json'), `${JSON.stringify(report, null, 2)}\n`)
    await writeFile(resolve(outputDir, 'feature-verification.md'), reportMarkdown(report))
    await writeFile(resolve(outputDir, 'feature-verification-scope.json'), `${JSON.stringify(verificationScope, null, 2)}\n`)

    expect(report.summary.total).toBeGreaterThan(15)
    expect(report.summary.verified).toBeGreaterThanOrEqual(6)
    expect(report.results.every((result) => result.durationMs >= 0)).toBe(true)
    expect(report.results.every((result) => result.entrypoint.length > 0)).toBe(true)
  })
})
