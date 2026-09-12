interface IcsEventInput {
  uid: string
  title: string
  description?: string
  location?: string
  date: string
  startTime?: string
  durationMinutes?: number
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function formatIcsDateTime(date: string, time?: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!time) {
    return `${String(y).padStart(4, '0')}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`
  }
  const [hh, mm] = time.split(':').map(Number)
  return `${String(y).padStart(4, '0')}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`
}

export function buildJobIcs(event: IcsEventInput): string {
  const duration = event.durationMinutes ?? 120
  const dtStart = formatIcsDateTime(event.date, event.startTime)
  const allDay = !event.startTime

  let dtEnd: string
  if (allDay) {
    const end = new Date(event.date + 'T12:00:00')
    end.setDate(end.getDate() + 1)
    dtEnd = formatIcsDateTime(end.toISOString().slice(0, 10))
  } else {
    const [hh, mm] = event.startTime!.split(':').map(Number)
    const end = new Date(event.date + 'T12:00:00')
    end.setHours(hh, mm + duration, 0, 0)
    dtEnd = formatIcsDateTime(event.date, `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Detailing App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}@detailing-app`,
    `DTSTAMP:${formatIcsDateTime(new Date().toISOString().slice(0, 10), '12:00')}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ]

  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
