import { ArrowRight, ChevronRight, BarChart2, Calendar, Users, Car, FileText, Bell, TrendingUp } from 'lucide-react'
import { colors } from '@/theme/colors'
import { RinseLogo } from '@/components/brand/RinseLogo'
import { Reveal } from './Reveal'
import { SECTIONS, scrollToSection } from './scroll'

const JOBS = [
  { time: '9:00 AM', client: 'James W.', vehicle: 'BMW M3 Competition', service: 'Paint Correction', tech: 'Marcus T.', status: 'in-progress', amount: '$480' },
  { time: '11:30 AM', client: 'Sarah K.', vehicle: 'Porsche 911 GT3', service: 'Full Detail', tech: 'Jordan K.', status: 'upcoming', amount: '$299' },
  { time: '2:00 PM', client: 'Alex C.', vehicle: 'Tesla Model S', service: 'Ceramic Coating', tech: 'Unassigned', status: 'new', amount: '$899' },
  { time: '4:30 PM', client: 'Derek M.', vehicle: 'Range Rover SVR', service: 'Interior Detail', tech: 'Ryan S.', status: 'upcoming', amount: '$195' },
] as const

const STATUS_STYLE: Record<string, string> = {
  'in-progress': 'bg-brand-500/20 text-brand-600',
  upcoming: 'bg-black/8 text-black/50',
  new: 'bg-emerald-500/15 text-emerald-600',
}

function HeroMockup() {
  return (
    <div className="relative w-full select-none">
      <div className="rounded-2xl overflow-hidden border border-black/8 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.35)] bg-[#FAFAFA] flex">
        <div className="w-[180px] flex-shrink-0 border-r border-black/5 p-4 flex-col gap-1 hidden lg:flex">
          <div className="flex items-center mb-5 px-2">
            <RinseLogo size={20} />
          </div>
          {[
            { icon: BarChart2, label: 'Dashboard', active: true },
            { icon: Calendar, label: 'Schedule' },
            { icon: Users, label: 'Customers' },
            { icon: Car, label: 'Jobs' },
            { icon: FileText, label: 'Invoices' },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${
                item.active ? 'bg-brand-500/15 text-brand-600' : 'text-black/35'
              }`}
            >
              <item.icon size={14} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-base font-bold text-neutral-900">Good morning, Jason</div>
              <div className="text-[11px] text-black/30 font-mono mt-0.5">Monday, June 9</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-black/5 border border-black/6 flex items-center justify-center">
              <Bell size={13} className="text-black/40" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Today's Revenue", value: '$1,873' },
              { label: 'Jobs Today', value: '8' },
              { label: 'New Bookings', value: '3' },
              { label: 'Avg Rating', value: '4.9★' },
            ].map((s) => (
              <div key={s.label} className="bg-black/3 border border-black/5 rounded-xl p-3">
                <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider">{s.label}</div>
                <div className="text-base font-bold text-neutral-900 mt-1 font-mono">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-black/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
              <span className="text-xs font-semibold text-neutral-900">Today's Schedule</span>
              <span className="text-[10px] text-black/25 font-mono">8 jobs · $1,873</span>
            </div>
            {JOBS.map((job, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${i < JOBS.length - 1 ? 'border-b border-black/4' : ''}`}
              >
                <span className="text-[10px] font-mono text-black/30 w-14 flex-shrink-0">{job.time}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 truncate">
                    {job.client} · {job.vehicle}
                  </div>
                  <div className="text-[10px] text-black/30 font-mono truncate">
                    {job.service} · {job.tech}
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[job.status]}`}>
                  {job.status}
                </span>
                <span className="text-xs font-bold font-mono text-black/60 flex-shrink-0">{job.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Reveal
        delay={500}
        className="absolute -bottom-5 -right-5 hidden sm:block rounded-xl border border-black/10 bg-white/95 backdrop-blur-xl p-3 items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] max-w-[240px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${colors.green}22` }}>
            <Bell size={14} style={{ color: colors.greenText }} />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-900">New booking</div>
            <div className="text-[10px] text-black/40 font-mono">Ferrari 488 · Sat Jun 14</div>
          </div>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors.green }} />
        </div>
      </Reveal>

      <Reveal
        delay={650}
        className="absolute -top-4 -left-4 hidden sm:block rounded-xl border border-black/10 bg-white/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      >
        <div className="text-[9px] font-mono text-black/30 uppercase tracking-wider mb-1">This Month</div>
        <div className="text-xl font-bold text-neutral-900 font-mono">$18,420</div>
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp size={10} className="text-emerald-500" />
          <span className="text-[9px] font-mono text-emerald-500">+23% vs last month</span>
        </div>
      </Reveal>
    </div>
  )
}

export function Hero({ onStartTrial }: { onStartTrial: () => void }) {
  return (
    <section
      data-section="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden px-6 lg:px-12"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -5%, ${colors.green}14, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-25 animate-home-grid-drift"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 20%, black, transparent)',
        }}
      />

      <div className="relative max-w-7xl mx-auto w-full">
        <Reveal className="flex justify-center mb-7">
          <button
            onClick={() => scrollToSection(SECTIONS.workflow)}
            className="inline-flex items-center gap-2 text-[11px] font-mono text-black/50 border border-black/10 bg-black/3 px-4 py-1.5 rounded-full hover:border-black/20 transition-colors cursor-pointer"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.green }} />
            Built for mobile detailing businesses
            <ChevronRight size={11} className="text-black/30" />
          </button>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-center text-5xl sm:text-6xl lg:text-[80px] xl:text-[90px] font-extrabold text-neutral-900 tracking-tight leading-[1.05] mb-6">
            <span className="block">The operating system</span>
            <span className="block">
              for <span style={{ color: colors.greenText }}>mobile</span> detailing.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-center text-base lg:text-lg text-black/40 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bookings, scheduling, CRM, invoices, payments, and analytics — unified in one platform built exclusively
            for detailing professionals.
          </p>
        </Reveal>

        <Reveal delay={300} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 lg:mb-24">
          <button
            onClick={onStartTrial}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.24)]"
          >
            Start free — no card needed
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => scrollToSection(SECTIONS.workflow)}
            className="flex items-center gap-2 text-black/50 hover:text-neutral-900 transition-colors text-sm font-semibold px-6 py-3 rounded-xl border border-black/8 hover:border-black/16 bg-black/2"
          >
            See how it works
          </button>
        </Reveal>

        <Reveal delay={380}>
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  )
}
