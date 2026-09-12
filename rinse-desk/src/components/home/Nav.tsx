import { useEffect, useState, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { RinseLockup } from '@/components/brand/RinseLogo'
import { SECTIONS, scrollToSection } from './scroll'

const NAV_LINK_CLS = 'text-sm text-black/45 hover:text-neutral-900 transition-colors duration-200'

const SCROLL_LINKS = [
  { label: 'Workflow', id: SECTIONS.workflow },
  { label: 'Reviews', id: SECTIONS.testimonials },
  { label: 'Pricing', id: SECTIONS.pricing },
] as const

export function HomeNav({ onSignIn, onStartTrial }: { onSignIn: () => void; onStartTrial: () => void }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleScroll = useCallback((id: string) => {
    scrollToSection(id)
    setOpen(false)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-black/6 bg-white/90 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo + Sign in */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center hover:opacity-80 transition-opacity"
            aria-label="Rinse home"
          >
            <RinseLockup height={22} />
          </button>
          <button
            onClick={onSignIn}
            className="hidden sm:inline text-sm text-black/50 hover:text-neutral-900 transition-colors duration-200"
          >
            Sign in
          </button>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {SCROLL_LINKS.map((item) => (
            <button key={item.label} onClick={() => handleScroll(item.id)} className={NAV_LINK_CLS}>
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onStartTrial}
            className="text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-colors duration-200 px-4 py-2 rounded-xl"
          >
            Get started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center text-black/50"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-black/6 bg-white/95 backdrop-blur-xl px-6 py-4 space-y-3">
          <button
            onClick={onSignIn}
            className="block w-full text-left text-sm text-black/50 hover:text-neutral-900 py-1.5"
          >
            Sign in
          </button>
          {SCROLL_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleScroll(item.id)}
              className="block w-full text-left text-sm text-black/50 hover:text-neutral-900 py-1.5"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              onStartTrial()
              setOpen(false)
            }}
            className="block w-full text-sm font-semibold text-white bg-neutral-900 px-4 py-2.5 rounded-xl text-center mt-2"
          >
            Get started
          </button>
        </div>
      )}
    </nav>
  )
}
