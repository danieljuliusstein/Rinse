export function formatJobDate(iso: string): string {
  const raw = iso.slice(0, 10)
  return new Date(`${raw}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatJobDateShort(iso: string): string {
  const raw = iso.slice(0, 10)
  return new Date(`${raw}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatSentAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
