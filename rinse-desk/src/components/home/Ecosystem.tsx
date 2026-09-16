import { Reveal } from './Reveal'

const INTEGRATIONS = [
  'Stripe',
  'Slack',
  'QuickBooks',
  'Google Calendar',
  'Google Maps',
  'Zapier',
  'Mailchimp',
  'Twilio',
  'Xero',
  'HubSpot',
]

const ROW = [...INTEGRATIONS, ...INTEGRATIONS]

export function Ecosystem() {
  return (
    <section className="border-t border-black/6 px-6 lg:px-12 py-16">
      <div
        className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative"
        style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <Reveal className="relative text-center px-8 pt-16 pb-14">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-7 text-[11px] font-medium tracking-wide"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Ecosystem
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
            Every tool your business
            <br />
            runs on, connected.
          </h2>
          <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed">
            Stripe, Slack, QuickBooks, and more — your whole stack in one place, no switching tabs.
          </p>
        </Reveal>

        <div className="relative pb-16 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 z-10 pointer-events-none"
            style={{ width: 120, background: 'linear-gradient(to right, #0D0D0D, transparent)' }}
          />
          <div
            className="absolute inset-y-0 right-0 z-10 pointer-events-none"
            style={{ width: 120, background: 'linear-gradient(to left, #0D0D0D, transparent)' }}
          />
          <div className="home-marquee-track flex gap-3 w-max animate-home-marquee-slow">
            {ROW.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex items-center justify-center shrink-0 rounded-2xl px-6"
                style={{ height: 92, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="text-sm font-semibold text-white/70 whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
