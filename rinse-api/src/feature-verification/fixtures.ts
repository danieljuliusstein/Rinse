export type FixtureRecord = {
  id: string
  organization_id: string
  [key: string]: unknown
}

export class IsolatedFixtureStore {
  readonly organizationId: string
  readonly userId: string
  private readonly records = new Map<string, Map<string, FixtureRecord>>()

  constructor(seed = 'feature-verification') {
    this.organizationId = `${seed}-org`
    this.userId = `${seed}-user`
  }

  create<T extends Record<string, unknown>>(table: string, input: T): T & FixtureRecord {
    const record = {
      ...input,
      id: String(input.id ?? `${table}-${this.records.get(table)?.size ?? 0 + 1}`),
      organization_id: this.organizationId,
    } as T & FixtureRecord
    const tableRecords = this.records.get(table) ?? new Map<string, FixtureRecord>()
    tableRecords.set(record.id, record)
    this.records.set(table, tableRecords)
    return record
  }

  get(table: string, id: string): FixtureRecord | undefined {
    return this.records.get(table)?.get(id)
  }

  getForOrganization(table: string, id: string, organizationId: string): FixtureRecord | undefined {
    const record = this.get(table, id)
    if (!record || record.organization_id !== organizationId) return undefined
    return record
  }

  updateForOrganization(
    table: string,
    id: string,
    organizationId: string,
    patch: Record<string, unknown>,
  ): FixtureRecord {
    const record = this.getForOrganization(table, id, organizationId)
    if (!record) throw new Error('Record not found')
    const updated = { ...record, ...patch, id: record.id, organization_id: record.organization_id }
    this.records.get(table)?.set(id, updated)
    return updated
  }

  count(table: string): number {
    return this.records.get(table)?.size ?? 0
  }

  snapshot(): Array<{ table: string; id: string }> {
    return [...this.records.entries()].flatMap(([table, records]) =>
      [...records.keys()].map((id) => ({ table, id })),
    )
  }

  reset(): void {
    this.records.clear()
  }
}

export function expectEqual<T>(
  passed: string[],
  failed: string[],
  label: string,
  actual: T,
  expected: T,
): void {
  if (Object.is(actual, expected)) passed.push(label)
  else failed.push(`${label} (expected ${String(expected)}, received ${String(actual)})`)
}

export function expectTrue(
  passed: string[],
  failed: string[],
  label: string,
  value: boolean,
): void {
  if (value) passed.push(label)
  else failed.push(label)
}
