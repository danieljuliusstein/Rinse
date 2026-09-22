import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export type MockSignal = {
  file: string
  line: number
  kind: 'demo-path' | 'swallowed-catch' | 'success-only-route' | 'in-memory-fallback'
  evidence: string
}

const sourceRoots = ['src/app/api', 'src/lib/server', 'src/lib/api', '../rinse-desk/src/lib', '../rinse-mobile/src/lib']
const extensions = /\.(ts|tsx|js|jsx)$/

async function filesUnder(root: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises')
  let entries: string[]
  try {
    entries = await readdir(resolve(process.cwd(), root), { withFileTypes: true }).then((items) =>
      items.map((item) => item.name),
    )
  } catch {
    return []
  }
  const result: string[] = []
  for (const name of entries) {
    const relative = `${root}/${name}`
    const absolute = resolve(process.cwd(), relative)
    const stat = await import('node:fs/promises').then(({ stat }) => stat(absolute))
    if (stat.isDirectory()) result.push(...(await filesUnder(relative)))
    else if (extensions.test(name)) result.push(relative)
  }
  return result
}

export async function scanMockSignals(): Promise<MockSignal[]> {
  const files = (await Promise.all(sourceRoots.map(filesUnder))).flat()
  const signals: MockSignal[] = []
  for (const file of files) {
    const content = await readFile(resolve(process.cwd(), file), 'utf8')
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (file.includes('/demo/') || file.includes('/demo-')) {
        signals.push({ file, line: index + 1, kind: 'demo-path', evidence: trimmed })
      } else if (/^catch\s*\{\s*$/.test(trimmed)) {
        signals.push({ file, line: index + 1, kind: 'swallowed-catch', evidence: trimmed })
      } else if (/return (NextResponse\.)?json\(\{\s*ok:\s*true/.test(trimmed) && file.includes('/api/')) {
        signals.push({ file, line: index + 1, kind: 'success-only-route', evidence: trimmed })
      } else if (/loadData\(\)|saveData\(/.test(trimmed) && (file.includes('/api/') || file.includes('/server/'))) {
        signals.push({ file, line: index + 1, kind: 'in-memory-fallback', evidence: trimmed })
      }
    })
  }
  return signals
}
