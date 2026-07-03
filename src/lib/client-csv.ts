import type { ClientInput, VehicleInput, VehicleType } from './types'

export interface ClientCsvRow {
  name: string
  phone?: string
  email?: string
  address?: string
  vehicle_year?: number
  vehicle_make?: string
  vehicle_model?: string
  vehicle_type?: VehicleType
  notes?: string
}

export interface ClientCsvImportResult {
  imported: number
  skipped: number
  errors: string[]
}

const HEADERS = [
  'name',
  'phone',
  'email',
  'address',
  'vehicle_year',
  'vehicle_make',
  'vehicle_model',
  'vehicle_type',
  'notes',
] as const

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function normalizeVehicleType(raw: string): VehicleType {
  const v = raw.trim().toLowerCase()
  if (v === 'suv') return 'suv'
  if (v === 'truck') return 'truck'
  if (v === 'van') return 'van'
  if (v === 'boat') return 'boat'
  if (v === 'other') return 'other'
  return 'sedan'
}

export function parseClientsCsv(text: string): { rows: ClientCsvRow[]; errors: string[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  const errors: string[] = []
  if (lines.length === 0) return { rows: [], errors: ['CSV is empty'] }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const nameIdx = headerCells.indexOf('name')
  if (nameIdx === -1) {
    return { rows: [], errors: ['CSV must include a "name" column'] }
  }

  const col = (cells: string[], key: (typeof HEADERS)[number]): string | undefined => {
    const idx = headerCells.indexOf(key)
    if (idx === -1) return undefined
    const val = cells[idx]?.trim()
    return val || undefined
  }

  const rows: ClientCsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const name = cells[nameIdx]?.trim()
    if (!name) {
      errors.push(`Row ${i + 1}: missing name`)
      continue
    }
    const yearRaw = col(cells, 'vehicle_year')
    rows.push({
      name,
      phone: col(cells, 'phone'),
      email: col(cells, 'email'),
      address: col(cells, 'address'),
      vehicle_year: yearRaw ? Number(yearRaw) || undefined : undefined,
      vehicle_make: col(cells, 'vehicle_make'),
      vehicle_model: col(cells, 'vehicle_model'),
      vehicle_type: col(cells, 'vehicle_type')
        ? normalizeVehicleType(col(cells, 'vehicle_type')!)
        : undefined,
      notes: col(cells, 'notes'),
    })
  }

  return { rows, errors }
}

export function clientToCsvRow(client: {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}): string {
  return [
    escapeCsv(client.name),
    escapeCsv(client.phone ?? ''),
    escapeCsv(client.email ?? ''),
    escapeCsv(client.address ?? ''),
    '',
    '',
    '',
    '',
    escapeCsv(client.notes ?? ''),
  ].join(',')
}

export function clientsToCsv(
  clients: { name: string; phone?: string; email?: string; address?: string; notes?: string }[]
): string {
  const header = HEADERS.join(',')
  const body = clients.map(clientToCsvRow).join('\n')
  return `${header}\n${body}`
}

export function clientInputFromRow(row: ClientCsvRow): ClientInput {
  return {
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
  }
}

export function vehicleInputFromRow(row: ClientCsvRow, clientId: string): VehicleInput | null {
  if (!row.vehicle_make?.trim() && !row.vehicle_model?.trim()) return null
  return {
    client_id: clientId,
    year: row.vehicle_year,
    make: row.vehicle_make?.trim() || 'Unknown',
    model: row.vehicle_model?.trim() || 'Vehicle',
    type: row.vehicle_type ?? 'sedan',
  }
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
