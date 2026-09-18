// WelcomeTourStop — high-conviction desktop intro and onboarding preview before the interactive lap.
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Calendar,
  Receipt,
  Users,
  Check,
  Car,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useTour } from '../tour-provider'

interface SlideData {
  badge: string
  title: string
  subtitle: string
}

export function WelcomeTourStop() {
  const { start, skip, total } = useTour()
  const [slide, setSlide] = useState(0)

  const slides: SlideData[] = [
    {
      badge: 'Welcome to Rinse Desk',
      title: 'Run your detailing business from one screen',
      subtitle:
        'A purpose-built desktop CRM for mobile detailers. Track inquiries, schedule routes, manage client vehicles, and collect payments effortlessly.',
    },
    {
      badge: 'The Connected Workflow',
      title: 'From client inquiry to cash in the bank',
      subtitle:
        'Desk and the mobile operator app sync in real time so your office and field operations stay perfectly aligned.',
    },
    {
      badge: 'Hands-on Walkthrough',
      title: `Take a 2-minute tour (${total} quick steps)`,
      subtitle:
        'No passive video — you’ll click through the real workspace and perform the key actions yourself.',
    },
  ]

  const nextSlide = useCallback(() => {
    setSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setSlide((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation for desktop: arrow keys, Enter to proceed, Escape to skip.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (slide < slides.length - 1) nextSlide()
      } else if (e.key === 'ArrowLeft') {
        if (slide > 0) prevSlide()
      } else if (e.key === 'Escape') {
        skip()
      } else if (e.key === 'Enter') {
        if (slide === slides.length - 1) {
          start()
        } else {
          nextSlide()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slide, slides.length, nextSlide, prevSlide, skip, start])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
      className="pointer-events-auto fixed inset-0 z-[70] grid place-items-center bg-[#0a0f0d]/50 backdrop-blur-sm px-4 py-6"
    >
      <div className="w-full max-w-xl rounded-3xl border border-[#e2e6df] bg-white p-7 md:p-8 shadow-[0_24px_64px_-16px_rgba(10,20,15,0.35)] transition-all">
        {/* Top bar: Badge & Slide dots */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22c55e]/12 px-3 py-1 text-[12px] font-semibold text-[#16a34a]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            {slides[slide].badge}
          </span>
          <div className="flex items-center gap-1.5" aria-label={`Slide ${slide + 1} of ${slides.length}`}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide
                    ? 'w-6 bg-[#22c55e]'
                    : 'w-2 bg-[#e2e6df] hover:bg-[#c4ccc2]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide Title & Subtitle */}
        <div className="mt-4 min-h-[76px]">
          <h1
            id="welcome-tour-title"
            className="text-[24px] md:text-[26px] font-bold leading-tight tracking-tight text-[#111815]"
          >
            {slides[slide].title}
          </h1>
          <p className="mt-2 text-[14px] md:text-[14.5px] leading-relaxed text-[#5b655f]">
            {slides[slide].subtitle}
          </p>
        </div>

        {/* Slide Content Body */}
        <div className="mt-5 min-h-[200px]">
          {slide === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  icon: Globe,
                  title: 'Online booking link',
                  desc: 'Clients choose services, time slots, and add-ons without phone tag.',
                },
                {
                  icon: Calendar,
                  title: 'Visual dispatch calendar',
                  desc: 'Organize your day, plan routes, and assign jobs to mobile operators.',
                },
                {
                  icon: Users,
                  title: 'Client & vehicle profiles',
                  desc: 'Keep complete service history, vehicle VINs/plates, and notes.',
                },
                {
                  icon: Receipt,
                  title: 'Auto-invoicing & payments',
                  desc: 'Completed jobs convert into clean invoices ready for instant payment.',
                },
              ].map((feat) => {
                const Icon = feat.icon
                return (
                  <div
                    key={feat.title}
                    className="flex gap-3 rounded-2xl border border-[#eef1eb] bg-[#f8faf6] p-3.5 transition hover:border-[#d9e2d5]"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#22c55e]/15 text-[#16a34a]">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#1a231d] leading-snug">
                        {feat.title}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#6b756e] leading-snug">
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {slide === 1 && (
            <div className="space-y-2.5">
              {[
                {
                  step: '1',
                  title: 'Lead or Booking',
                  detail: 'Inquiries arrive online or through direct messages and land in your pipeline.',
                  icon: Globe,
                },
                {
                  step: '2',
                  title: 'Schedule & Route',
                  detail: 'Drop jobs into your calendar with package details, travel estimates, and time windows.',
                  icon: Calendar,
                },
                {
                  step: '3',
                  title: 'Execute & Document',
                  detail: 'Operator details the vehicle on site, taking before & after photos via mobile.',
                  icon: Car,
                },
                {
                  step: '4',
                  title: 'Invoice & Get Paid',
                  detail: 'Send itemized invoices with Stripe payment links or log cash on completion.',
                  icon: Receipt,
                },
              ].map((stepItem) => {
                const Icon = stepItem.icon
                return (
                  <div
                    key={stepItem.step}
                    className="flex items-center gap-3.5 rounded-2xl border border-[#eef1eb] bg-[#f8faf6] px-4 py-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-[12px] font-bold text-white">
                      {stepItem.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#1a231d]">
                        {stepItem.title}
                      </div>
                      <div className="text-[12px] text-[#6b756e] truncate">
                        {stepItem.detail}
                      </div>
                    </div>
                    <Icon className="h-4 w-4 shrink-0 text-[#8a948c]" strokeWidth={2} />
                  </div>
                )
              })}
            </div>
          )}

          {slide === 2 && (
            <div className="rounded-2xl border border-[#eef1eb] bg-[#f8faf6] p-4">
              <div className="text-[12.5px] font-semibold text-[#16a34a] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> What you will do right now:
              </div>
              <div className="space-y-2">
                {[
                  'Orient: Take your bearings on the Desk workspace',
                  'Contacts: Add your first client contact',
                  'Deals: Move a detailing deal across stages in your pipeline',
                  'Calendar: Book a job with time and service package',
                  'Invoices: Review and mark an invoice sent',
                ].map((task, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[13px] text-[#334037]">
                    <div className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#22c55e]/20 text-[#16a34a]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </div>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="mt-7 flex flex-col gap-3 pt-4 border-t border-[#eef1eb]">
          <div className="flex items-center justify-between gap-3">
            {slide > 0 ? (
              <button
                type="button"
                onClick={prevSlide}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e6df] px-4 py-2.5 text-[13.5px] font-medium text-[#4b5650] transition hover:bg-[#f5f7f3]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={skip}
                className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-[#8a938c] transition hover:text-[#4b5650]"
              >
                Skip for now
              </button>
            )}

            <div className="flex items-center gap-2">
              {slide < slides.length - 1 ? (
                <>
                  <button
                    type="button"
                    onClick={start}
                    className="hidden sm:inline-flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-[#16a34a] hover:bg-[#22c55e]/10 transition"
                  >
                    Jump to tour
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#22c55e] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#16a34a]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#16a34a]"
                >
                  Start tour
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
