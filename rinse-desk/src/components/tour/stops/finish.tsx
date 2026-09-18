// FinishTourStop — celebratory terminal screen after completing the interactive lap.
import { useEffect } from 'react'
import { Check, RotateCcw, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react'
import { useTour } from '../tour-provider'
import { useDeskNav } from '@/providers/DeskNavProvider'

export function FinishTourStop() {
  const { skip, start } = useTour()
  const { setPage } = useDeskNav()

  const recap = [
    { title: 'Added a client contact', desc: 'Saved vehicle, phone, and customer profile' },
    { title: 'Advanced a pipeline deal', desc: 'Moved an inquiry forward toward confirmed booking' },
    { title: 'Scheduled a calendar job', desc: 'Assigned service package, time, and operator' },
    { title: 'Sent a detailing invoice', desc: 'Ready for client card, cash, or Stripe payment' },
  ]

  // Keyboard shortcut: Enter or Escape completes the tour and goes to dashboard.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        skip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [skip])

  const handleGoSettings = () => {
    skip()
    // Small timeout to let tour close before navigating to settings
    setTimeout(() => {
      setPage('settings')
    }, 50)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-tour-title"
      className="pointer-events-auto fixed inset-0 z-[70] grid place-items-center bg-[#0a0f0d]/50 backdrop-blur-sm px-4 py-6"
    >
      <div className="w-full max-w-lg rounded-3xl border border-[#e2e6df] bg-white p-7 md:p-8 text-center shadow-[0_24px_64px_-16px_rgba(10,20,15,0.35)] transition-all">
        {/* Celebration icon badge */}
        <div className="relative mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#22c55e]/15 text-[#16a34a] shadow-sm">
          <div className="absolute -inset-2 rounded-3xl bg-[#22c55e]/10 blur-md" />
          <Check className="relative h-8 w-8" strokeWidth={2.5} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22c55e]/12 px-3 py-1 text-[11.5px] font-semibold text-[#16a34a]">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} />
          Tour complete
        </span>

        <h1
          id="finish-tour-title"
          className="mt-3 text-[24px] font-bold tracking-tight text-[#111815]"
        >
          You&apos;re ready to roll
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#5b655f]">
          You just performed the entire core detailing workflow on Rinse Desk:
        </p>

        {/* Recap checklist */}
        <div className="mt-5 space-y-2 text-left">
          {recap.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-[#eef1eb] bg-[#f8faf6] px-4 py-2.5"
            >
              <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#22c55e] text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#1f2822]">{r.title}</div>
                <div className="text-[11.5px] text-[#6e7771]">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={skip}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-5 py-3 text-[14.5px] font-semibold text-white shadow-sm transition hover:bg-[#16a34a]"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleGoSettings}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-[#4b5650] hover:bg-[#f5f7f3] transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Configure packages & settings
            </button>
            <span className="text-[#d0d7cf]">·</span>
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-[#8a938c] hover:text-[#4b5650] transition"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.25} />
              Replay tour
            </button>
          </div>
        </div>

        <p className="mt-3 text-[12px] text-[#9aa39d]">
          You can replay this anytime from <span className="font-medium text-[#5b655e]">Help</span> in the sidebar.
        </p>
      </div>
    </div>
  )
}
