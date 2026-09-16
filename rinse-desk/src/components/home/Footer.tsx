import { RinseLockup } from '@/components/brand/RinseLogo'
import { SECTIONS, scrollToSection } from './scroll'

export function HomeFooter() {
  return (
    <footer className="border-t border-black/6 px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10 mb-16">
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center mb-4 hover:opacity-80 transition-opacity"
            >
              <RinseLockup height={20} />
            </button>
            <p className="text-xs text-black/30 leading-relaxed max-w-[220px]">
              The operating system for mobile detailing professionals.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-[10px] font-mono text-black/25 uppercase tracking-widest mb-4">Product</div>
              <div className="space-y-2.5">
                <button onClick={() => scrollToSection(SECTIONS.workflow)} className="block text-xs text-black/35 hover:text-black/70 transition-colors text-left">
                  Workflow
                </button>
                <button onClick={() => scrollToSection(SECTIONS.pricing)} className="block text-xs text-black/35 hover:text-black/70 transition-colors text-left">
                  Pricing
                </button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-black/25 uppercase tracking-widest mb-4">Company</div>
              <div className="space-y-2.5">
                <a href="mailto:hello@rinsehq.com" className="block text-xs text-black/35 hover:text-black/70 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-black/5">
          <div className="text-[11px] font-mono text-black/20">© {new Date().getFullYear()} Rinse. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
