import { requireOrganizationId } from './org'

function key(collection: string): string {
  const org = requireOrganizationId()
  return `desk-platform:${org}:${collection}`
}

function readAll<T extends { id: string }>(collection: string): T[] {
  try {
    const raw = localStorage.getItem(key(collection))
    if (!raw) return []
    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll<T extends { id: string }>(collection: string, rows: T[]) {
  localStorage.setItem(key(collection), JSON.stringify(rows))
}

export function newId(): string {
  return crypto.randomUUID()
}

export const orgStore = {
  list<T extends { id: string }>(collection: string): T[] {
    return readAll<T>(collection)
  },
  get<T extends { id: string }>(collection: string, id: string): T | undefined {
    return readAll<T>(collection).find((r) => r.id === id)
  },
  create<T extends { id: string }>(collection: string, row: T): T {
    const rows = readAll<T>(collection)
    rows.unshift(row)
    writeAll(collection, rows)
    return row
  },
  update<T extends { id: string }>(collection: string, id: string, patch: Partial<T>): T {
    const rows = readAll<T>(collection)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) throw new Error(`${collection} record not found`)
    const next = { ...rows[idx]!, ...patch, id } as T
    rows[idx] = next
    writeAll(collection, rows)
    return next
  },
  remove(collection: string, id: string): void {
    writeAll(
      collection,
      readAll(collection).filter((r) => r.id !== id),
    )
  },
}
