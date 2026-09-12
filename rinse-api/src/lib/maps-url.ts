export function googleMapsDirectionsUrl(address: string): string {
  const encoded = encodeURIComponent(address.trim())
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
}

export function appleMapsDirectionsUrl(address: string): string {
  const encoded = encodeURIComponent(address.trim())
  return `maps://?daddr=${encoded}`
}

export function isIosUserAgent(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent)
}

export function mapsDirectionsUrl(address: string, userAgent = ''): string {
  if (isIosUserAgent(userAgent)) return appleMapsDirectionsUrl(address)
  return googleMapsDirectionsUrl(address)
}

export function openMapsDirections(address: string): void {
  const trimmed = address.trim()
  if (!trimmed || typeof window === 'undefined') return
  const url = mapsDirectionsUrl(trimmed, navigator.userAgent)
  window.location.href = url
}
