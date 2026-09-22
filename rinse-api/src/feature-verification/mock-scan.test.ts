import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanMockSignals } from './mock-scan'

describe('static mock and disconnected implementation scan', () => {
  it('emits categorized source evidence without asserting every signal is a bug', async () => {
    const signals = await scanMockSignals()
    await mkdir(resolve(process.cwd(), 'test-results'), { recursive: true })
    await writeFile(resolve(process.cwd(), 'test-results/mock-signals.json'), `${JSON.stringify(signals, null, 2)}\n`)
    expect(signals.length).toBeGreaterThan(0)
    expect(new Set(signals.map((signal) => signal.kind)).size).toBeGreaterThan(1)
  })
})
