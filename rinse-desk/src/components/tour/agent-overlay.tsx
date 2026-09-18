// agent-overlay.tsx — DEV-ONLY inspector

import { useState } from 'react'
import { Bug, X } from 'lucide-react'
import { useTour } from './tour-provider'

export function AgentOverlay() {
  const [open, setOpen] = useState(false)
  const {
    phase,
    stop,
    stopIndex,
    total,
    stopDone,
    canNext,
    armedTargetId,
    spotlightSelector,
    dataMode,
    counts,
    invoiceFallback,
  } = useTour()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed bottom-4 left-4 z-[80] inline-flex items-center gap-1.5 rounded-full border border-[#2a352f] bg-[#0d1512] px-3 py-2 text-[12px] font-semibold text-[#9fe6b6] shadow-lg transition-colors hover:bg-[#111d17]"
      >
        <Bug className="h-3.5 w-3.5" strokeWidth={2} />
        Agent overlay
      </button>
    )
  }

  const rows: [string, string][] = [
    ['phase', phase],
    ['stop', `${stop.id} (${stopIndex + 1}/${total})`],
    ['completion', stop.completion],
    ['requiresAction', String(stop.requiresAction)],
    ['stopDone', String(stopDone)],
    ['canNext', String(canNext)],
    ['invoiceFallback', String(invoiceFallback)],
    ['armedTargetId', armedTargetId ?? '—'],
    ['spotlight', spotlightSelector],
    ['dataMode', dataMode],
    ['counts', `c:${counts.contacts} d:${counts.deals} i:${counts.invoices} draft:${counts.drafts}`],
  ]

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[80] w-[288px] rounded-2xl border border-[#2a352f] bg-[#0d1512] p-4 font-mono text-[11.5px] text-[#c7d0cb] shadow-2xl">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-sans text-[12px] font-semibold text-[#9fe6b6]">
          <Bug className="h-3.5 w-3.5" strokeWidth={2} />
          Agent overlay
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-6 w-6 place-items-center rounded-md text-[#7c8a83] hover:bg-white/5"
          aria-label="Close agent overlay"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-[#5c6b64]">{k}</dt>
            <dd className="break-all text-right text-[#c7d0cb]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
