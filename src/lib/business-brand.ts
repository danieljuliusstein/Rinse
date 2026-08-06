const BUSINESS_UPDATED_EVENT = 'desk:business-updated'
const BUSINESS_NAME_KEY = 'desk.businessName'

export function getCachedBusinessName(): string {
  try {
    return localStorage.getItem(BUSINESS_NAME_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function notifyBusinessUpdated(name: string) {
  const trimmed = name.trim()
  try {
    if (trimmed) localStorage.setItem(BUSINESS_NAME_KEY, trimmed)
    else localStorage.removeItem(BUSINESS_NAME_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(BUSINESS_UPDATED_EVENT, { detail: { name: trimmed } }))
}

export function onBusinessUpdated(handler: (name: string) => void): () => void {
  function onUpdated(e: Event) {
    const detail = (e as CustomEvent<{ name?: string }>).detail
    if (typeof detail?.name === 'string') handler(detail.name.trim())
  }
  window.addEventListener(BUSINESS_UPDATED_EVENT, onUpdated)
  return () => window.removeEventListener(BUSINESS_UPDATED_EVENT, onUpdated)
}

export function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() || 'R'
}
