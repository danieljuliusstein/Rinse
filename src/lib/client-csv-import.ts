import type { ClientInput, VehicleInput, VehicleType } from '@rinse/core'

export type ClientCsvField =
  | 'skip'
  | 'name'
  | 'phone'
  | 'email'
  | 'address'
  | 'notes'
  | 'vehicle_year'
  | 'vehicle_make'
  | 'vehicle_model'
  | 'vehicle_type'

export const CLIENT_CSV_FIELD_OPTIONS: { value: ClientCsvField; label: string }[] = [
  { value: 'skip', label: 'Skip' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Address' },
  { value: 'notes', label: 'Notes' },
  { value: 'vehicle_year', label: 'Vehicle year' },
  { value: 'vehicle_make', label: 'Vehicle make' },
  { value: 'vehicle_model', label: 'Vehicle model' },
  { value: 'vehicle_type', label: 'Vehicle type' },
]

export type ClientCsvMappedRow = {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  vehicle_year?: number
  vehicle_make?: string
  vehicle_model?: string
  vehicle_type?: VehicleType
}

const FIELD_ALIASES: Record<Exclude<ClientCsvField, 'skip'>, string[]> = {
  name: ['name', 'client', 'customer', 'full name', 'fullname', 'contact', 'business name'],
  phone: ['phone', 'mobile', 'cell', 'telephone', 'tel', 'phone number'],
  email: ['email', 'e-mail', 'mail'],
  address: ['address', 'street', 'location', 'service address'],
  notes: ['notes', 'note', 'comments', 'comment'],
  vehicle_year: ['vehicle_year', 'year', 'veh year', 'car year'],
  vehicle_make: ['vehicle_make', 'make', 'veh make', 'car make'],
  vehicle_model: ['vehicle_model', 'model', 'veh model', 'car model'],
  vehicle_type: ['vehicle_type', 'type', 'vehicle', 'body type'],
}

export function parseCsvLine(line: string): string[] {
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

function normalizeHeader(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[_-]+/g, ' ')
}

export function guessCsvField(header: string): ClientCsvField {
  const h = normalizeHeader(header)
  if (!h) return 'skip'
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [
    Exclude<ClientCsvField, 'skip'>,
    string[],
  ][]) {
    if (aliases.some((a) => h === a || h.includes(a))) return field
  }
  // Positional fallback for rinse export without matching names handled elsewhere.
  return 'skip'
}

export function autoMapHeaders(headers: string[]): ClientCsvField[] {
  const used = new Set<ClientCsvField>()
  return headers.map((header, index) => {
    let guess = guessCsvField(header)
    if (guess !== 'skip' && used.has(guess)) guess = 'skip'
    // Classic rinse export: name,phone,email,address,notes
    if (guess === 'skip' && headers.length >= 5 && index < 5) {
      const positional: ClientCsvField[] = ['name', 'phone', 'email', 'address', 'notes']
      const pos = positional[index]
      if (pos && !used.has(pos) && !normalizeHeader(header)) {
        guess = pos
      } else if (pos && !used.has(pos) && guessCsvField(header) === 'skip') {
        // header might be the field name already handled; keep skip unless empty header row of values
      }
    }
    if (guess !== 'skip') used.add(guess)
    return guess
  })
}

/** Prefer alias map; if first row looks like data (no name header), treat as no-header rinse export. */
export function detectCsvHeaders(text: string): {
  headers: string[]
  dataLines: string[]
  mapping: ClientCsvField[]
} {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], dataLines: [], mapping: [] }

  const first = parseCsvLine(lines[0])
  const hasNameHeader = first.some((c) => guessCsvField(c) === 'name')
  if (hasNameHeader) {
    const mapping = autoMapHeaders(first)
    // Ensure name is mapped once
    if (!mapping.includes('name')) {
      const idx = first.findIndex((c) => normalizeHeader(c) === 'name')
      if (idx >= 0) mapping[idx] = 'name'
    }
    return { headers: first, dataLines: lines.slice(1), mapping }
  }

  // Positional: name,phone,email,address,notes[,vehicle...]
  const headers = first.map((_, i) => `Column ${i + 1}`)
  const positional: ClientCsvField[] = [
    'name',
    'phone',
    'email',
    'address',
    'notes',
    'vehicle_year',
    'vehicle_make',
    'vehicle_model',
    'vehicle_type',
  ]
  const mapping = headers.map((_, i) => positional[i] ?? 'skip')
  return { headers, dataLines: lines, mapping }
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

export function mapCsvRows(
  dataLines: string[],
  mapping: ClientCsvField[],
): { rows: ClientCsvMappedRow[]; errors: string[] } {
  const rows: ClientCsvMappedRow[] = []
  const errors: string[] = []
  const nameIdx = mapping.indexOf('name')
  if (nameIdx === -1) {
    return { rows: [], errors: ['Map at least one column to Name'] }
  }

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i])
    const get = (field: ClientCsvField): string | undefined => {
      const idx = mapping.indexOf(field)
      if (idx === -1) return undefined
      const val = cells[idx]?.trim()
      return val || undefined
    }
    const name = get('name')
    if (!name) {
      errors.push(`Row ${i + 2}: missing name`)
      continue
    }
    const yearRaw = get('vehicle_year')
    const typeRaw = get('vehicle_type')
    rows.push({
      name,
      phone: get('phone'),
      email: get('email'),
      address: get('address'),
      notes: get('notes'),
      vehicle_year: yearRaw ? Number(yearRaw) || undefined : undefined,
      vehicle_make: get('vehicle_make'),
      vehicle_model: get('vehicle_model'),
      vehicle_type: typeRaw ? normalizeVehicleType(typeRaw) : undefined,
    })
  }
  return { rows, errors }
}

export function clientInputFromMapped(row: ClientCsvMappedRow): ClientInput {
  return {
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
  }
}

export function vehicleInputFromMapped(row: ClientCsvMappedRow, clientId: string): VehicleInput | null {
  if (!row.vehicle_make?.trim() && !row.vehicle_model?.trim()) return null
  return {
    client_id: clientId,
    year: row.vehicle_year,
    make: row.vehicle_make?.trim() || 'Unknown',
    model: row.vehicle_model?.trim() || 'Vehicle',
    type: row.vehicle_type ?? 'sedan',
  }
}
