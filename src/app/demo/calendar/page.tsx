'use client'

import { useState } from 'react'
import { RinseDayPicker } from '@/components/ui'

/** Isolated calendar screenshot — matches July 2026 mockup data. */
export default function DemoCalendarPage() {
  const [selected, setSelected] = useState('2026-07-05')
  const jobDates = new Set(['2026-07-01', '2026-07-02', '2026-07-05', '2026-07-06', '2026-07-07', '2026-07-12'])
  const rainDates = new Set(['2026-07-08'])

  return (
    <div
      className="demo-frame"
      style={{ background: '#1a1a1a', minHeight: '100vh', padding: '24px 16px' }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <RinseDayPicker
          variant="operator"
          framed
          showLegend
          selectedIso={selected}
          onSelectIso={setSelected}
          defaultMonth={new Date('2026-07-01T12:00:00')}
          modifiers={{
            hasJobs: (date) => {
              const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              return jobDates.has(iso)
            },
            rainRisk: (date) => {
              const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              return rainDates.has(iso)
            },
          }}
        />
      </div>
    </div>
  )
}
