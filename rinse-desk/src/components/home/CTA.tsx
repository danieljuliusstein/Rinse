import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { SECTIONS } from './scroll'

export function CTA({ onStartTrial }: { onStartTrial: () => void }) {
  return (
    <section id={SECTIONS.cta} className="py-32 px-6 lg:px-12 border-t border-black/6">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div
            className="rounded-3xl border border-black/8 overflow-hidden relative p-12 lg:p-20 text-center"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,197,94,0.08), transparent), #FFFFFF' }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono text-brand-600 border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                Free 14-day trial · No credit card required
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-neutral-900 tracking-tight mb-5">
                Run your business
                <br />
                like the pros do.
              </h2>
              <p className="text-base lg:text-lg text-black/40 max-w-xl mx-auto mb-10 leading-relaxed">
                Join detailing businesses using Rinse to book more, earn more, and build something worth owning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onStartTrial}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors text-white text-sm font-semibold px-6 py-3 rounded-xl"
                >
                  Start your free trial
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
