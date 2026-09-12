import { useCallback, useEffect, useRef, useState } from 'react'
import { Calendar, BarChart2, Users, Car, FileText, TrendingUp, CheckCircle, Plus, Check } from 'lucide-react'
import { Reveal } from './Reveal'
import { SECTIONS } from './scroll'

function BookingMockup() {
  const fields = [
    ['Customer', 'Alex Chen'],
    ['Service', 'Full Detail + Ceramic'],
    ['Vehicle', '2023 Tesla Model S'],
    ['Date', 'Thursday, June 12'],
    ['Time', '10:00 AM'],
  ]
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.12)]">
      <div className="px-5 py-4 border-b border-black/6 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
          <Car size={13} className="text-brand-600" />
        </div>
        <span className="text-sm font-semibold text-neutral-900">New Booking</span>
        <span className="ml-auto text-[10px] font-mono text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full">Live</span>
      </div>
      <div className="p-5 space-y-2.5">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[11px] text-black/35 font-mono uppercase tracking-wider">{label}</span>
            <span className="text-xs font-semibold text-neutral-900">{value}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-black/6 flex items-center justify-between">
          <span className="text-[11px] text-black/35 font-mono uppercase tracking-wider">Estimate</span>
          <span className="text-base font-bold text-brand-600 font-mono">$299.00</span>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold mt-1">
          Confirm Booking
        </button>
      </div>
    </div>
  )
}

function CalendarMockup() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dates = [9, 10, 11, 12, 13, 14]
  const existing = [
    { day: 0, label: 'BMW M4', color: '#7C3AED' },
    { day: 0, label: 'Porsche 911', color: '#2563EB' },
    { day: 1, label: 'Audi RS7', color: '#0891B2' },
    { day: 2, label: 'Range Rover', color: '#059669' },
    { day: 2, label: 'Merc AMG', color: '#7C3AED' },
    { day: 4, label: 'Ferrari 488', color: '#EA580C' },
    { day: 5, label: 'Lamborghini', color: '#CA8A04' },
    { day: 5, label: 'Rolls Royce', color: '#DB2777' },
  ]
  return (
    <div className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.12)]">
      <div className="px-5 py-3.5 border-b border-black/6 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">June 9–14</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-black/30">Week</span>
          <div className="w-6 h-6 rounded-lg bg-black/6 flex items-center justify-center">
            <Plus size={11} className="text-black/50" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-6 gap-1 mb-3">
          {days.map((d, i) => (
            <div key={d} className={`text-center py-1.5 rounded-lg ${i === 3 ? 'bg-brand-500/15' : ''}`}>
              <div className="text-[9px] font-mono text-black/30 uppercase">{d}</div>
              <div className={`text-sm font-bold mt-0.5 ${i === 3 ? 'text-brand-600' : 'text-black/70'}`}>{dates[i]}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1 min-h-[130px]">
          {days.map((_, col) => (
            <div key={col} className="space-y-1">
              {existing
                .filter((j) => j.day === col)
                .map((job, ji) => (
                  <div key={ji} className="rounded-md p-1.5" style={{ background: job.color + '25' }}>
                    <div className="text-[9px] font-semibold truncate" style={{ color: job.color }}>
                      {job.label}
                    </div>
                  </div>
                ))}
              {col === 3 && (
                <div className="rounded-md p-1.5 ring-1 ring-brand-500/60" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <div className="text-[9px] font-bold text-brand-600">Tesla S</div>
                  <div className="text-[9px] text-brand-600/70">10 AM ✦</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AssignMockup() {
  const techs = [
    { name: 'Marcus T.', rating: '4.9', jobs: 127, status: 'available', active: true },
    { name: 'Jordan K.', rating: '4.8', jobs: 94, status: 'available', active: false },
    { name: 'Ryan S.', rating: '4.7', jobs: 82, status: 'on job', active: false },
  ]
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.12)]">
      <div className="px-5 py-4 border-b border-black/6">
        <div className="text-sm font-semibold text-neutral-900">Assign Technician</div>
        <div className="text-[11px] text-black/35 mt-0.5 font-mono">Tesla Model S · Full Detail · Jun 12</div>
      </div>
      <div className="p-4 space-y-2">
        {techs.map((t) => (
          <div
            key={t.name}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              t.active ? 'border-brand-500/40 bg-brand-500/10' : 'border-black/5 bg-black/2'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                t.active ? 'bg-brand-500 text-white' : 'bg-black/8 text-black/50'
              }`}
            >
              {t.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900">{t.name}</div>
              <div className="text-[10px] text-black/35 font-mono">★ {t.rating} · {t.jobs} jobs</div>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                t.status === 'available' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-orange-500/15 text-orange-600'
              }`}
            >
              {t.status}
            </span>
            {t.active && (
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <button className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold">
          Assign Marcus T. →
        </button>
      </div>
    </div>
  )
}

function InvoiceMockup() {
  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.12)]">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono text-black/30 uppercase tracking-widest">Invoice</div>
            <div className="text-lg font-bold text-neutral-900 mt-0.5 font-mono">#INV-2847</div>
            <div className="text-[11px] text-black/35 mt-1">Alex Chen</div>
          </div>
          <div className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
            ✓ Sent
          </div>
        </div>
        <div className="space-y-0">
          {[
            ['Full Detail', '$249.00'],
            ['Ceramic Boost', '$50.00'],
          ].map(([name, price]) => (
            <div key={name} className="flex justify-between py-2.5 border-b border-black/5">
              <span className="text-xs text-black/50">{name}</span>
              <span className="text-xs font-semibold text-neutral-900 font-mono">{price}</span>
            </div>
          ))}
          <div className="flex justify-between py-2.5">
            <span className="text-sm font-bold text-neutral-900">Total</span>
            <span className="text-base font-bold text-brand-600 font-mono">$299.00</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-emerald-700">Payment received</div>
            <div className="text-[10px] text-emerald-600/70 font-mono">$299.00 · Visa ····4892 · just now</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsMockup() {
  const bars = [38, 52, 45, 61, 58, 72, 68, 80, 75, 88, 82, 100]
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const metrics = [
    { label: 'Jobs', value: '62', delta: '+12%' },
    { label: 'Avg Ticket', value: '$297', delta: '+8%' },
    { label: 'Retention', value: '94%', delta: '+3%' },
  ]
  return (
    <div className="w-full max-w-[400px] rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_30px_80px_-10px_rgba(0,0,0,0.12)]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-neutral-900">Revenue Overview</span>
        </div>
        <div className="flex items-end gap-2.5 mb-5">
          <span className="text-3xl font-bold text-neutral-900 font-mono">$18,420</span>
          <div className="flex items-center gap-1 pb-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500">+23%</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-20">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${h}%`, background: i === 11 ? 'var(--color-brand-500)' : i >= 9 ? 'rgba(37,99,235,0.3)' : 'rgba(0,0,0,0.08)' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 mb-4">
          {months.map((m, i) => (
            <span key={i} className={`text-[9px] font-mono ${i === 11 ? 'text-brand-600' : 'text-black/20'}`}>
              {m}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="bg-black/3 border border-black/5 rounded-xl p-2.5">
              <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider">{m.label}</div>
              <div className="text-sm font-bold text-neutral-900 mt-1 font-mono">{m.value}</div>
              <div className="text-[9px] text-emerald-500 font-mono">{m.delta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const WORKFLOW_STEPS = [
  {
    icon: Car,
    label: 'Customer books online',
    desc: 'Customers self-book via your branded portal 24/7. Smart availability, service pricing, and vehicle details — all captured automatically.',
    mockup: <BookingMockup />,
  },
  {
    icon: Calendar,
    label: 'Calendar updates instantly',
    desc: 'Every booking lands on your live schedule in real time. No double-bookings, no phone tags. Your week populates itself.',
    mockup: <CalendarMockup />,
  },
  {
    icon: Users,
    label: 'Technician gets assigned',
    desc: 'Route-optimized auto-assignment or manual override — your call. Techs receive push notifications with full job details.',
    mockup: <AssignMockup />,
  },
  {
    icon: FileText,
    label: 'Invoice sent & payment collected',
    desc: 'Branded invoices are auto-generated and emailed the moment a job closes. Stripe-powered payments hit your account within minutes.',
    mockup: <InvoiceMockup />,
  },
  {
    icon: BarChart2,
    label: 'Analytics update in real time',
    desc: 'Revenue, retention, and technician performance track automatically. See what’s working and where to grow — without spreadsheets.',
    mockup: <AnalyticsMockup />,
  },
]

export function Workflow() {
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const onScroll = () => {
      const trigger = window.innerHeight * 0.35
      let best = 0
      stepRefs.current.forEach((el, i) => {
        if (!el) return
        if (el.getBoundingClientRect().top <= trigger) best = i
      })
      setActiveStep(best)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToStep = useCallback((i: number) => {
    const el = stepRefs.current[i]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <>
      <div className="pt-32 px-6 lg:px-12 border-t border-black/6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="mb-3">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight">
              One workflow.
              <br />
              <span className="text-black/30">End to end.</span>
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="text-base text-black/35 max-w-lg leading-relaxed">
              From the moment a customer books to the second the money hits your account — Rinse handles every step
              automatically.
            </p>
          </Reveal>
        </div>
      </div>

      <section id={SECTIONS.workflow} className="px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="pt-16 pb-16">
            <Reveal>
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-[0.2em]">How it works</span>
            </Reveal>
          </div>

          <div className="hidden lg:flex gap-20">
            <div className="sticky top-32 self-start w-48 flex-shrink-0 pt-1">
              {WORKFLOW_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => scrollToStep(i)}
                  className={`block w-full text-center py-2.5 border-l-2 transition-all duration-300 ${
                    i === activeStep
                      ? 'border-brand-500 text-neutral-900'
                      : 'border-black/8 text-black/25 hover:text-black/50 hover:border-black/20'
                  }`}
                >
                  <span className={`text-sm leading-snug transition-all duration-300 ${i === activeStep ? 'font-semibold' : 'font-normal'}`}>
                    {step.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {WORKFLOW_STEPS.map((step, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    stepRefs.current[i] = el
                  }}
                  className="border-b border-black/6"
                  style={{ minHeight: '80vh', paddingTop: '8vh', paddingBottom: '8vh' }}
                >
                  <div className="mb-8 max-w-lg mx-auto text-center">
                    <div className="flex items-center justify-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-brand-500/15 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <step.icon size={12} />
                      </div>
                      <span className="text-[10px] font-mono text-black/25 tracking-widest uppercase">
                        {String(i + 1).padStart(2, '0')} / {String(WORKFLOW_STEPS.length).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-2xl lg:text-[28px] font-bold text-neutral-900 mb-3 leading-tight">{step.label}</h3>
                    <p className="text-sm text-black/40 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="border-t border-black/6 mb-10" />
                  <div className="flex items-center justify-center">{step.mockup}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:hidden max-w-xl mx-auto pb-16">
            <div className="space-y-16">
              {WORKFLOW_STEPS.map((step, i) => (
                <Reveal key={i} delay={Math.min(i * 40, 200)}>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/25 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <step.icon size={15} />
                      </div>
                      <span className="text-[10px] font-mono text-black/25">
                        {i + 1} / {WORKFLOW_STEPS.length}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-neutral-900 mb-2">{step.label}</div>
                    <p className="text-sm text-black/40 leading-relaxed mb-6">{step.desc}</p>
                    <div className="border-t border-black/6 mb-6" />
                    <div className="flex justify-center">{step.mockup}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
