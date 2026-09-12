import { useEffect, useRef, useState } from 'react'
import { Bell, Zap, Shield, MapPin } from 'lucide-react'
import { Reveal } from './Reveal'

const HIGHLIGHTS = [
  { icon: MapPin, text: 'Live GPS tracking for all technicians' },
  { icon: Bell, text: 'Push notifications for new and updated jobs' },
  { icon: Shield, text: 'Photo capture and digital sign-off' },
  { icon: Zap, text: 'Performance scoring and leaderboards' },
]

const TECHS = [
  { name: 'Marcus T.', status: 'In transit', job: 'BMW M3 · 1.2 mi away', pct: 72, color: 'bg-brand-500' },
  { name: 'Jordan K.', status: 'On job', job: 'Porsche 911 · In progress', pct: 45, color: 'bg-emerald-500' },
  { name: 'Ryan S.', status: 'Wrapping up', job: 'Range Rover · Final rinse', pct: 91, color: 'bg-violet-500' },
]

function TeamMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="rounded-2xl border border-black/8 bg-white overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.18)]">
      <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">Live Team View</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-600">3 active</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {TECHS.map((tech) => (
          <div key={tech.name} className="rounded-xl border border-black/5 bg-black/2 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold text-neutral-900">
                  {tech.name[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900">{tech.name}</div>
                  <div className="text-[10px] text-black/30 font-mono">{tech.job}</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/40">{tech.status}</span>
            </div>
            <div className="h-1 rounded-full bg-black/6 overflow-hidden">
              <div
                className={`h-full rounded-full ${tech.color} transition-[width] duration-1000 ease-out`}
                style={{ width: inView ? `${tech.pct}%` : '0%' }}
              />
            </div>
            <div className="text-right text-[9px] font-mono text-black/20 mt-1">{tech.pct}% complete</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Showcase() {
  return (
    <section className="px-6 lg:px-12 border-t border-black/6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="py-24 lg:py-32 lg:pr-16 lg:border-r border-black/6">
            <Reveal className="mb-4">
              <span className="text-[10px] font-mono text-brand-600 uppercase tracking-[0.2em]">Technician Management</span>
            </Reveal>
            <Reveal delay={60} className="mb-5">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight leading-snug">
                Your team,
                <br />
                always in sync.
              </h2>
            </Reveal>
            <Reveal delay={100} className="mb-8">
              <p className="text-sm text-black/40 leading-relaxed">
                Real-time GPS, job status updates, photo documentation, and performance dashboards — all from one
                screen. Know exactly where every tech is and what they're working on.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="space-y-3">
                {HIGHLIGHTS.map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                      <item.icon size={13} className="text-brand-600" />
                    </div>
                    <span className="text-sm text-black/55">{item.text}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={160} className="flex items-center py-24 lg:py-32 lg:pl-16">
            <TeamMockup />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
