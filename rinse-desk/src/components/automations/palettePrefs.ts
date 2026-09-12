/** Persist workflow-editor chrome (palette open + which sections are expanded). */

const PALETTE_OPEN_KEY = 'desk.automationPaletteOpen'
const SECTIONS_KEY = 'desk.automationPaletteSections'

export type PaletteSectionId =
  | 'triggers'
  | 'actions'
  | 'logic'
  | 'apps'
  | 'templates'

const DEFAULT_SECTIONS: Record<PaletteSectionId, boolean> = {
  triggers: true,
  actions: true,
  logic: true,
  apps: true,
  templates: false,
}

export function readPaletteOpen(): boolean {
  try {
    const v = localStorage.getItem(PALETTE_OPEN_KEY)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

export function writePaletteOpen(open: boolean) {
  try {
    localStorage.setItem(PALETTE_OPEN_KEY, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function readPaletteSections(): Record<PaletteSectionId, boolean> {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY)
    if (!raw) return { ...DEFAULT_SECTIONS }
    const parsed = JSON.parse(raw) as Partial<Record<PaletteSectionId, boolean>>
    return { ...DEFAULT_SECTIONS, ...parsed }
  } catch {
    return { ...DEFAULT_SECTIONS }
  }
}

export function writePaletteSections(sections: Record<PaletteSectionId, boolean>) {
  try {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))
  } catch {
    /* ignore */
  }
}
