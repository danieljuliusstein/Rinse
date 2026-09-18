/** Local calendar categories (name + color) and per-event assignment. */

export type CalCategory = {
  id: string
  name: string
  color: string
}

const CATS_KEY = 'desk_cal_categories_v1'
const ASSIGN_KEY = 'desk_cal_event_category_v1'
const COLOR_KEY = 'desk_cal_event_color_v1'

export const DEFAULT_CATEGORIES: CalCategory[] = [
  { id: 'meeting', name: 'Meeting', color: '#2563eb' },
  { id: 'call', name: 'Call', color: '#22c55e' },
  { id: 'email', name: 'Email', color: '#14b8a6' },
  { id: 'job', name: 'Job', color: '#f59e0b' },
  { id: 'other', name: 'Other', color: '#8b5cf6' },
]

export const CATEGORY_COLOR_PRESETS = [
  '#2563eb',
  '#22c55e',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#0f766e',
  '#ea580c',
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadCategories(): CalCategory[] {
  const saved = readJson<CalCategory[]>(CATS_KEY, [])
  if (!Array.isArray(saved) || saved.length === 0) return [...DEFAULT_CATEGORIES]
  return saved.filter((c) => c && c.id && c.name && c.color)
}

export function saveCategories(cats: CalCategory[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats))
}

export function loadEventCategoryMap(): Record<string, string> {
  return readJson<Record<string, string>>(ASSIGN_KEY, {})
}

export function saveEventCategoryMap(map: Record<string, string>) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(map))
}

export function loadEventColorMap(): Record<string, string> {
  return readJson<Record<string, string>>(COLOR_KEY, {})
}

export function saveEventColorMap(map: Record<string, string>) {
  localStorage.setItem(COLOR_KEY, JSON.stringify(map))
}

export function assignEventCategory(jobId: string, categoryId: string) {
  const map = loadEventCategoryMap()
  map[jobId] = categoryId
  saveEventCategoryMap(map)
}

/** Per-event color override — does not change the category default. */
export function assignEventColor(jobId: string, color: string) {
  const map = loadEventColorMap()
  map[jobId] = color
  saveEventColorMap(map)
}

export function clearEventColor(jobId: string) {
  const map = loadEventColorMap()
  delete map[jobId]
  saveEventColorMap(map)
}

export function clearEventMeta(jobId: string) {
  const cats = loadEventCategoryMap()
  delete cats[jobId]
  saveEventCategoryMap(cats)
  clearEventColor(jobId)
}

export function clearTourCalendarData(): void {
  const isTourId = (id: string) => id.startsWith('tour-') || id.startsWith('dummy-') || id.startsWith('temp-')
  const catMap = loadEventCategoryMap()
  let catChanged = false
  for (const k of Object.keys(catMap)) {
    if (isTourId(k)) {
      delete catMap[k]
      catChanged = true
    }
  }
  if (catChanged) saveEventCategoryMap(catMap)

  const colMap = loadEventColorMap()
  let colChanged = false
  for (const k of Object.keys(colMap)) {
    if (isTourId(k)) {
      delete colMap[k]
      colChanged = true
    }
  }
  if (colChanged) saveEventColorMap(colMap)
}

export function categoryForJob(
  jobId: string,
  cats: CalCategory[],
  fallbackId = 'meeting',
): CalCategory {
  const map = loadEventCategoryMap()
  const id = map[jobId] || fallbackId
  return cats.find((c) => c.id === id) ?? cats[0] ?? DEFAULT_CATEGORIES[0]!
}

/** Resolve display color: event override → category default. */
export function colorForJob(jobId: string, cats: CalCategory[]): string {
  const overrides = loadEventColorMap()
  if (overrides[jobId]) return overrides[jobId]!
  return categoryForJob(jobId, cats).color
}

export function addCategory(name: string, color: string): CalCategory {
  const cats = loadCategories()
  const id = `cat-${Date.now().toString(36)}`
  const next: CalCategory = {
    id,
    name: name.trim() || 'New category',
    color: color || CATEGORY_COLOR_PRESETS[0]!,
  }
  saveCategories([...cats, next])
  return next
}

export function updateCategory(id: string, patch: Partial<Pick<CalCategory, 'name' | 'color'>>) {
  const cats = loadCategories().map((c) => (c.id === id ? { ...c, ...patch } : c))
  saveCategories(cats)
  return cats
}

export function removeCategory(id: string) {
  const cats = loadCategories().filter((c) => c.id !== id)
  if (cats.length === 0) {
    saveCategories([...DEFAULT_CATEGORIES])
    return [...DEFAULT_CATEGORIES]
  }
  saveCategories(cats)
  const map = loadEventCategoryMap()
  const fallback = cats[0]!.id
  for (const [jobId, catId] of Object.entries(map)) {
    if (catId === id) map[jobId] = fallback
  }
  saveEventCategoryMap(map)
  return cats
}
