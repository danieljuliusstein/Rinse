import { useState } from 'react'
import { Check, X, Star } from 'lucide-react'
import { Reveal } from './Reveal'
import { SECTIONS } from './scroll'

type BillingCycle = 'monthly' | 'annual'

const COMPARISON_FEATURES: { label: string; starter: boolean; group: 1 | 2 | 3 }[] = [
  { label: 'Up to 3 clients', starter: true, group: 1 },
  { label: 'Up to 10 jobs', starter: true, group: 1 },
  { label: 'Basic job tracking', starter: true, group: 1 },
  { label: 'Client portal', starter: true, group: 1 },
  { label: 'Unlimited clients', starter: false, group: 2 },
  { label: 'Unlimited jobs', starter: false, group: 2 },
  { label: 'Advanced reporting', starter: false, group: 2 },
  { label: 'Team collaboration', starter: false, group: 2 },
  { label: 'Automations & workflows', starter: false, group: 2 },
  { label: 'Priority support', starter: false, group: 2 },
  { label: 'Unlimited technicians', starter: false, group: 3 },
  { label: 'Multi-location support', starter: false, group: 3 },
  { label: 'Custom branding', starter: false, group: 3 },
  { label: 'API access', starter: false, group: 3 },
  { label: 'Dedicated onboarding', starter: false, group: 3 },
]

function BillingToggle({ cycle, onChange }: { cycle: BillingCycle; onChange: (c: BillingCycle) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5 rounded-full p-1 bg-black/6">
        {(['monthly', 'annual'] as BillingCycle[]).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`relative px-4 py-1.5 text-sm font-semibold capitalize rounded-full transition-colors ${
              cycle === option ? 'bg-white shadow-sm text-neutral-900' : 'text-black/40'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {cycle === 'annual' && <span className="text-xs font-bold text-brand-600">Save 20%</span>}
    </div>
  )
}

function FeatureRow({ label, available }: { label: string; available: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      {available ? (
        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-brand-500/10">
          <Check size={11} strokeWidth={2.8} className="text-brand-600" />
        </span>
      ) : (
        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-black/5">
          <X size={10} strokeWidth={2.5} className="text-black/25" />
        </span>
      )}
      <span className={`text-sm font-medium leading-snug ${available ? 'text-black/72' : 'text-black/30'}`}>{label}</span>
    </li>
  )
}

function FounderBanner({ onCta }: { onCta: () => void }) {
  const claimed = 12
  const total = 20
  const pct = (claimed / total) * 100
  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white border border-black/8 p-8 sm:p-10 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/8 text-brand-600 border border-brand-500/20">
            <Star size={10} strokeWidth={2.5} className="fill-brand-600 text-brand-600" />
            Founding Member Offer
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-neutral-900">
              Free for life. <span className="text-brand-600">First 20 businesses only.</span>
            </h2>
            <p className="text-sm font-medium leading-relaxed text-black/42">
              Get every Pro feature, forever, for being one of our first partners.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 sm:pt-1">
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white whitespace-nowrap bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            Claim your Founder spot
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-black/38">{claimed} of {total} spots claimed</span>
          <span className="text-xs font-bold text-brand-600">{Math.round(pct)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/6">
          <div className="h-full rounded-full bg-brand-500 transition-[width] duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  tagline,
  badge,
  price,
  priceNote,
  cta,
  isPro,
  isScale,
  index,
  onCta,
  cycle,
}: {
  name: string
  tagline: string
  badge?: string
  price: { monthly: string; annual: string }
  priceNote: string | { monthly: string; annual: string }
  cta: string
  isPro: boolean
  isScale?: boolean
  index: number
  onCta: () => void
  cycle: BillingCycle
}) {
  const priceVal = price[cycle]
  const isFree = priceVal === 'Free'
  const note = typeof priceNote === 'object' ? priceNote[cycle] : priceNote

  const group1 = COMPARISON_FEATURES.filter((f) => f.group === 1)
  const group2 = COMPARISON_FEATURES.filter((f) => f.group === 2)
  const group3 = COMPARISON_FEATURES.filter((f) => f.group === 3)

  const featureAvailable = (f: (typeof COMPARISON_FEATURES)[number]) => {
    if (isScale) return true
    if (isPro) return f.group !== 3
    return f.starter
  }

  return (
    <Reveal delay={index * 80} className="relative flex-1">
      <div className="flex flex-col h-full rounded-2xl bg-white border border-black/8 p-7">
        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold text-white ${isPro ? 'bg-brand-500' : 'bg-neutral-900'}`}>
              {badge}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-bold text-neutral-900">{name}</span>
            <span className="text-sm leading-snug text-black/38">{tagline}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-1.5 leading-none">
              <span className={`font-extrabold tracking-tight text-neutral-900 ${isFree || priceVal === 'Custom' ? 'text-4xl' : 'text-5xl'}`}>
                {priceVal}
              </span>
              {!isFree && priceVal !== 'Custom' && <span className="text-sm font-medium mb-2 text-black/35">/mo</span>}
            </div>
            <span className="text-xs font-medium text-black/30">{note}</span>
          </div>
          <button
            onClick={onCta}
            className={`w-full py-3 rounded-full text-sm font-bold transition-colors ${
              isPro
                ? 'text-white bg-brand-500 hover:bg-brand-600'
                : isScale
                  ? 'text-white bg-neutral-900 hover:bg-neutral-800'
                  : 'border border-black/12 text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {cta}
          </button>
          <div className="h-px w-full bg-black/6" />
          <ul className="flex flex-col gap-3">
            {group1.map((f) => (
              <FeatureRow key={f.label} label={f.label} available={featureAvailable(f)} />
            ))}
          </ul>
          <div className="h-px w-full bg-black/5" />
          <ul className="flex flex-col gap-3">
            {group2.map((f) => (
              <FeatureRow key={f.label} label={f.label} available={featureAvailable(f)} />
            ))}
          </ul>
          {group3.length > 0 && (
            <>
              <div className="h-px w-full bg-black/5" />
              <ul className="flex flex-col gap-3">
                {group3.map((f) => (
                  <FeatureRow key={f.label} label={f.label} available={featureAvailable(f)} />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Reveal>
  )
}

export function Pricing({ onStartTrial }: { onStartTrial: () => void }) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  return (
    <section id={SECTIONS.pricing} className="w-full flex flex-col items-center px-6 py-24 gap-10 border-t border-black/6" style={{ background: '#f7f8f6' }}>
      <Reveal className="flex flex-col items-center gap-4 text-center max-w-xl">
        <span className="text-xs font-bold tracking-widest uppercase text-brand-600">Pricing</span>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-neutral-900">Simple, honest pricing.</h2>
        <p className="text-base font-medium leading-relaxed max-w-sm text-black/42">Start free. Upgrade only when you outgrow it.</p>
      </Reveal>

      <Reveal delay={60} className="w-full flex justify-center">
        <FounderBanner onCta={onStartTrial} />
      </Reveal>

      <div className="w-full max-w-5xl flex flex-col items-center gap-6">
        <BillingToggle cycle={cycle} onChange={setCycle} />

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          <PricingCard
            name="Starter"
            tagline="For solo operators getting organized."
            price={{ monthly: 'Free', annual: 'Free' }}
            priceNote="Always free"
            cta="Start free"
            isPro={false}
            index={0}
            onCta={onStartTrial}
            cycle={cycle}
          />
          <PricingCard
            name="Pro"
            tagline="For growing teams who need full ops."
            badge="Most popular"
            price={{ monthly: '$6', annual: '$5' }}
            priceNote={{ monthly: 'per month', annual: 'per month, billed annually' }}
            cta="Upgrade to Pro"
            isPro={true}
            index={1}
            onCta={onStartTrial}
            cycle={cycle}
          />
          <PricingCard
            name="Scale"
            tagline="For multi-van, high-volume operations."
            badge="Enterprise"
            price={{ monthly: 'Custom', annual: 'Custom' }}
            priceNote="Contact us for volume pricing"
            cta="Talk to sales"
            isPro={false}
            isScale
            index={2}
            onCta={() => window.open('mailto:hello@rinsehq.com?subject=Scale%20plan%20inquiry', '_blank')}
            cycle={cycle}
          />
        </div>
      </div>

      <p className="text-xs font-medium text-center text-black/30">
        No credit card required&nbsp;&nbsp;·&nbsp;&nbsp;Cancel any time&nbsp;&nbsp;·&nbsp;&nbsp;Upgrade anytime
      </p>
    </section>
  )
}
