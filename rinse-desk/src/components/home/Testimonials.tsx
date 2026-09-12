import { Star, Play } from 'lucide-react'
import { Reveal } from './Reveal'
import { SECTIONS } from './scroll'

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="fill-brand-500 text-brand-500" />
      ))}
    </div>
  )
}

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-brand-500/10 text-brand-600`}>
      {initials}
    </div>
  )
}

const TESTIMONIALS = [
  {
    id: 'marcus',
    quote:
      'We were drowning in spreadsheets — separate sheets for invoicing, scheduling, follow-ups. The moment we moved to Rinse, everything collapsed into one place. Six bookings a week became twenty-two in under ninety days. I stopped doing admin at midnight.',
    name: 'Marcus Rivera',
    title: 'Owner',
    company: 'Apex Mobile Detailing',
    location: 'Los Angeles, CA',
    initials: 'MR',
    featured: true,
    watchStory: false,
  },
  {
    id: 'dominique',
    quote:
      "Route optimization alone saves us two hours every single day. That's ten hours a week we put back into client work, not logistics. Our techs actually show up on time now — customers noticed before we even told them.",
    name: 'Dominique Osei',
    title: 'CEO',
    company: 'Prestige Auto Spa',
    location: 'Atlanta, GA',
    initials: 'DO',
    watchStory: true,
    featured: false,
  },
  {
    id: 'priya',
    quote:
      'Running solo used to mean flying blind. Now my dashboards give me a real picture of revenue, retention, and where I\'m losing jobs. It feels like I have a full operations team backing me up.',
    name: 'Priya Nair',
    title: 'Founder',
    company: 'Shine Theory Detailing',
    location: 'Austin, TX',
    initials: 'PN',
    featured: false,
    watchStory: false,
  },
]

const STATS = [
  { label: 'Early access', sub: 'Now open' },
  { label: 'Founding cohort', sub: 'Limited spots' },
  { label: 'No contracts', sub: 'Cancel any time' },
]

export function Testimonials() {
  const featured = TESTIMONIALS.find((t) => t.featured)!
  const secondary = TESTIMONIALS.filter((t) => !t.featured)

  return (
    <section id={SECTIONS.testimonials} className="w-full flex flex-col items-center px-6 py-24 gap-16 border-t border-black/6" style={{ background: '#f7f8f6' }}>
      <Reveal className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-end justify-between gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.07] text-neutral-900">Built by operators,</h2>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.07] text-black/22">for operators.</h2>
        </div>
        <div className="flex items-center flex-shrink-0">
          {STATS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col gap-0.5 px-5 first:pl-0">
                <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">{s.label}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600" style={{ letterSpacing: '0.08em' }}>
                  {s.sub}
                </span>
              </div>
              {i < STATS.length - 1 && <div className="w-px h-8 flex-shrink-0 bg-black/10" />}
            </div>
          ))}
        </div>
      </Reveal>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
        <Reveal delay={80} className="lg:col-span-3 bg-white rounded-2xl border border-black/8 p-8 flex flex-col justify-between gap-10">
          <div className="flex flex-col gap-6">
            <Stars />
            <p className="text-xl font-semibold leading-relaxed text-neutral-900">"{featured.quote}"</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar initials={featured.initials} size="md" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-neutral-900">{featured.name}</span>
              <span className="text-xs font-medium text-black/42">
                {featured.title}, {featured.company} · {featured.location}
              </span>
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-2 flex flex-col gap-5">
          {secondary.map((t, i) => (
            <Reveal key={t.id} delay={160 + i * 60} className="bg-white rounded-2xl border border-black/8 p-6 flex flex-col justify-between gap-6 flex-1">
              <div className="flex flex-col gap-4">
                <Stars />
                <p className="text-sm font-medium leading-relaxed text-black/72">"{t.quote}"</p>
              </div>
              <div className="flex flex-col gap-4">
                {t.watchStory && (
                  <button className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full text-xs font-bold border border-black/12 text-neutral-900 hover:bg-neutral-50 transition-colors">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-brand-500">
                      <Play size={9} className="fill-white text-white" />
                    </span>
                    Watch story
                  </button>
                )}
                <div className="flex items-center gap-2.5">
                  <Avatar initials={t.initials} size="sm" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-neutral-900">{t.name}</span>
                    <span className="text-xs font-medium text-black/38">
                      {t.title}, {t.company} · {t.location}
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
