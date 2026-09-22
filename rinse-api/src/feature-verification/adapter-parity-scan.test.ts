import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const adapters = [
  { name: 'api', path: 'src/lib/api/index.ts', exports: ['createClient', 'createJob', 'createInvoiceForJob', 'createVehicle'] },
  { name: 'desktop', path: '../rinse-desk/src/lib/api.ts', exports: ['createClient', 'createJob', 'createInvoiceForJob', 'createVehicle'] },
  { name: 'mobile', path: '../rinse-mobile/src/lib/api.ts', exports: ['createClient', 'createJob'] },
]

describe('adapter parity inventory', () => {
  it('verifies that core adapters expose callable mutation entry points', async () => {
    for (const adapter of adapters) {
      const source = await readFile(resolve(process.cwd(), adapter.path), 'utf8')
      for (const name of adapter.exports) {
        expect(source, `${adapter.name} adapter missing ${name}`).toMatch(new RegExp(`export\\s+(async\\s+)?function\\s+${name}\\b`))
      }
    }
  })
})
